// ============================================================
// app/portfolio/[studentId]/full/[profileId]/page.tsx
//
// Parent-facing read-only view of a single published Learning
// Profile. Fetches the profile + sections, gathers each
// section's source data via the existing helpers, then hands
// off to <PublishedProfile>. Only profiles with status='published'
// (and matching student) render — anything else 404s.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import { mapStudent, mapReading, mapCharacterAward } from '@/lib/mappers'
import { mapProfile, mapProfileSection } from '@/lib/mappers/profileBuilder'
import { mergeMapsAssessments } from '@/lib/mapsHelpers'
import type { HebrewSkillAverages } from '@/lib/hebrewComparisonNorms'
import { storagePublicUrl } from '@/lib/storage'
import PublishedProfile, {
  type SectionPayload,
} from '@/components/portfolio/published/PublishedProfile'
import type { PublishedSectionData } from '@/components/portfolio/published/PublishedSectionRenderer'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'
import { mergeAvantAssessments } from '@/lib/avantHelpers'

type Props = {
  params: Promise<{ studentId: string; profileId: string }>
}

function parseLexileRange(value: string | null): { min: number; max: number } | null {
  if (!value) return null
  const m = value.match(/(\d+)L?\s*[-–]\s*(\d+)L?/)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = value.match(/(\d+)L?/)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return null
}

export default async function PublishedProfilePage({ params }: Props) {
  const { studentId, profileId } = await params
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())

  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  // ── Profile + student + sections ──────────────────────────────
  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()
  if (!profileRow) notFound()
  const profile = mapProfile(profileRow as Parameters<typeof mapProfile>[0])

  const { data: schoolRow } = await supabaseAdmin
    .from('schools').select('*').eq('id', schoolId).maybeSingle()
  if (!schoolRow) notFound()

  const { data: studentRow } = await supabaseAdmin
    .from('students').select('*')
    .eq('id', studentId).eq('school_id', schoolId)
    .is('deleted_at', null).single()
  if (!studentRow) notFound()
  const student = mapStudent(studentRow as Record<string, unknown>)

  const { data: sectionRows } = await supabaseAdmin
    .from('profile_sections').select('*')
    .eq('profile_id', profile.id)
    .is('deleted_at', null)
    .order('section_order')
  const sections = (sectionRows ?? [])
    .map((r) => mapProfileSection(r as Parameters<typeof mapProfileSection>[0]))

  // ── Per-section data fetching ─────────────────────────────────
  const studentCurrentGrade = parseInt(student.gradeLevel, 10)
  const gradeNum = Number.isNaN(studentCurrentGrade) ? 0 : studentCurrentGrade

  const payloads: SectionPayload[] = await Promise.all(sections.map(async (section) => {
    const data = await loadSectionData(section.sectionKind, {
      studentId, schoolId, gradeNum, academicYear: student.academicYear, firstName: student.firstName,
    })
    return { section, data }
  }))

  return (
    <PublishedProfile
      school={{
        id:               schoolRow.id as string,
        name:             schoolRow.name as string,
        slug:             (schoolRow.slug as string) ?? '',
        logoUrl:          (schoolRow.logo_url as string | null) ?? null,
        theme:            (schoolRow.theme_json as { colors: Record<string, string> }) ?? { colors: {} },
        enabledSections:  [],
        websiteUrl:       (schoolRow.website_url as string | null) ?? null,
        clerkOrgId:       (schoolRow.clerk_org_id as string | null) ?? null,
        pedagogicalSchools: [],
      }}
      student={student}
      profile={profile}
      payloads={payloads}
    />
  )
}

type LoadCtx = {
  studentId: string; schoolId: string;
  gradeNum: number; academicYear: string; firstName: string;
}

async function loadSectionData(
  kind: ReturnType<typeof mapProfileSection>['sectionKind'],
  ctx: LoadCtx,
): Promise<PublishedSectionData> {
  const { studentId, schoolId } = ctx

  if (kind === 'maps_scores') {
    const { data: rows } = await supabaseAdmin
      .from('assessments')
      .select('id, assessment_type, term, academic_year, rit_score, percentile')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .in('assessment_type', ['maps_math', 'maps_english'])
      .is('deleted_at', null)
    const assessments = mergeMapsAssessments(
      (rows ?? []) as Parameters<typeof mergeMapsAssessments>[0],
      ctx.gradeNum, ctx.academicYear,
    )
    return { kind: 'maps_scores', assessments }
  }

  if (kind === 'lexile') {
    const { data: lexRow } = await supabaseAdmin
      .from('assessments').select('*')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .eq('assessment_type', 'lexile').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const lexileValue = (lexRow?.lexile_value as string | null) ?? null
    const range = parseLexileRange(lexileValue)
    const band = range ? {
      label:     lexileValue ?? `${range.min}L`,
      rangeMinL: range.min, rangeMaxL: range.max,
      termLabel: (lexRow?.term as string | null) ?? '—',
      notes:     (lexRow?.notes as string | null) ?? null,
    } : null
    return { kind: 'lexile', band }
  }

  if (kind === 'avant_hebrew' || kind === 'hebrew_comparison') {
    const { data: rows } = await supabaseAdmin
      .from('assessments').select('id, assessment_type, term, academic_year, score')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .like('assessment_type', 'avant%').is('deleted_at', null)
    const merged = mergeAvantAssessments(
      (rows ?? []) as Parameters<typeof mergeAvantAssessments>[0],
      ctx.gradeNum, ctx.academicYear,
    )
    if (kind === 'avant_hebrew') return { kind: 'avant_hebrew', assessments: merged }
    const latest = merged.length > 0 ? merged[merged.length - 1] : null
    const present = [latest?.reading, latest?.writing, latest?.listening, latest?.speaking]
      .filter((s): s is number => s != null)
    const composite = present.length > 0
      ? present.reduce((a, b) => a + b, 0) / present.length : 0
    const athenaScores: HebrewSkillAverages = {
      reading:   latest?.reading   ?? 0,
      writing:   latest?.writing   ?? 0,
      listening: latest?.listening ?? 0,
      speaking:  latest?.speaking  ?? 0,
      composite,
    }
    return { kind: 'hebrew_comparison', athenaScores, firstName: ctx.firstName }
  }

  if (kind === 'canon_reading') {
    const { data: rows } = await supabaseAdmin
      .from('readings').select('*')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .is('deleted_at', null).order('sort_order')
    const readings = (rows ?? []).map((r) => mapReading(r as Record<string, unknown>))
    return { kind: 'canon_reading', readings }
  }

  if (kind === 'english_composition' || kind === 'hebrew_composition') {
    const language = kind === 'english_composition' ? 'english' : 'hebrew'
    const { data: rows } = await supabaseAdmin
      .from('writing_samples')
      .select('id, language, grade_level, academic_year, title, body, ocr_text, image_path')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .eq('language', language).is('deleted_at', null)
      .order('academic_year', { ascending: true })
    const samples: CompositionSample[] = (rows ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return {
        id:             row.id as string,
        language,
        gradeLevel:     (row.grade_level as string) ?? '',
        academicYear:   (row.academic_year as string) ?? '',
        title:          (row.title as string) ?? null,
        body:           (row.body as string) ?? null,
        ocrText:        (row.ocr_text as string) ?? null,
        imagePublicUrl: storagePublicUrl((row.image_path as string) ?? null),
      }
    })
    return { kind, samples }
  }

  if (kind === 'character_middot') {
    const { data: rows } = await supabaseAdmin
      .from('character_awards').select('*')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .is('deleted_at', null).order('award_date', { ascending: false })
    const awards = (rows ?? []).map((r) => mapCharacterAward(r as Record<string, unknown>))
    return { kind: 'character_middot', awards }
  }

  if (kind === 'poetry_recitation') {
    const { data: row } = await supabaseAdmin
      .from('student_videos').select('video_url, title')
      .eq('student_id', studentId).eq('school_id', schoolId)
      .eq('category', 'poetry_recitation').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    return {
      kind: 'poetry_recitation',
      videoUrl: (row?.video_url as string | null) ?? null,
      title:    (row?.title     as string | null) ?? null,
    }
  }

  return { kind: 'placeholder' }
}
