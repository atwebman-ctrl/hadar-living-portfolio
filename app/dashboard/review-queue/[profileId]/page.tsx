// ============================================================
// app/dashboard/review-queue/[profileId]/page.tsx
//
// Admin-only preview of an in_review profile, rendered using
// the same <PublishedProfile> document the parent will eventually
// see. A sticky action bar below offers Approve & Publish or
// Request Changes.
// ============================================================

export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import { mapProfile, mapProfileSection } from '@/lib/mappers/profileBuilder'
import { getAcademicYearLabelById } from '@/lib/academicYears'
import {
  loadLexileBand,
  loadMapsScores,
  loadAvantAssessments,
  hebrewComparisonFromAvant,
  loadCanonReadings,
  loadCompositionSamples,
  loadCharacterAwards,
  loadPoetryVideo,
} from '@/lib/sectionData'
import PublishedProfile, {
  type SectionPayload,
} from '@/components/portfolio/published/PublishedProfile'
import type { PublishedSectionData } from '@/components/portfolio/published/PublishedSectionRenderer'
import ReviewActionBar from '@/components/dashboard/ReviewActionBar'

type Props = { params: Promise<{ profileId: string }> }

export default async function ReviewPreviewPage({ params }: Props) {
  const { profileId } = await params
  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))
  if (ctx.role !== 'admin') redirect('/dashboard')

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('school_id', ctx.schoolId)
    .eq('status', 'in_review')
    .is('deleted_at', null)
    .maybeSingle()
  if (!profileRow) notFound()
  const profile = mapProfile(profileRow as Parameters<typeof mapProfile>[0])

  const { data: schoolRow } = await supabaseAdmin
    .from('schools').select('*').eq('id', ctx.schoolId).maybeSingle()
  if (!schoolRow) notFound()

  const { data: studentRow } = await supabaseAdmin
    .from('students').select('*')
    .eq('id', profile.studentId).eq('school_id', ctx.schoolId)
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

  // Resolve the profile's academic year label so time-scoped loaders
  // filter to the profile's year, matching what the parent will eventually
  // see on the published report card.
  const profileAcademicYear = await getAcademicYearLabelById(profile.academicYearId, ctx.schoolId)

  const payloads: SectionPayload[] = await Promise.all(sections.map(async (section) => {
    const data = await loadSectionData(section.sectionKind, {
      studentId:    student.id,
      schoolId:     ctx.schoolId,
      gradeLevel:   student.gradeLevel,
      academicYear: student.academicYear,
      profileYear:  profileAcademicYear,
      firstName:    student.firstName,
    })
    return { section, data }
  }))

  return (
    <>
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
      <ReviewActionBar profileId={profile.id} />
    </>
  )
}

type LoadCtx = {
  studentId:    string
  schoolId:     string
  gradeLevel:   string
  academicYear: string
  profileYear:  string | null
  firstName:    string
}

async function loadSectionData(
  kind: ReturnType<typeof mapProfileSection>['sectionKind'],
  ctx: LoadCtx,
): Promise<PublishedSectionData> {
  const { studentId, schoolId, gradeLevel, academicYear } = ctx

  if (kind === 'maps_scores') {
    const assessments = await loadMapsScores(studentId, schoolId, gradeLevel, academicYear)
    return { kind: 'maps_scores', assessments }
  }
  if (kind === 'lexile') {
    const band = await loadLexileBand(studentId, schoolId)
    return { kind: 'lexile', band }
  }
  if (kind === 'avant_hebrew') {
    const assessments = await loadAvantAssessments(studentId, schoolId, gradeLevel, academicYear)
    return { kind: 'avant_hebrew', assessments }
  }
  if (kind === 'hebrew_comparison') {
    const merged = await loadAvantAssessments(studentId, schoolId, gradeLevel, academicYear)
    const athenaScores = hebrewComparisonFromAvant(merged)
    return { kind: 'hebrew_comparison', athenaScores, firstName: ctx.firstName }
  }
  if (kind === 'canon_reading') {
    const readings = await loadCanonReadings(studentId, schoolId)
    return { kind: 'canon_reading', readings }
  }
  if (kind === 'english_composition' || kind === 'hebrew_composition') {
    const language = kind === 'english_composition' ? 'english' : 'hebrew'
    const samples = await loadCompositionSamples(studentId, schoolId, language, ctx.profileYear ?? undefined)
    return { kind, samples }
  }
  if (kind === 'character_middot') {
    const awards = await loadCharacterAwards(studentId, schoolId)
    return { kind: 'character_middot', awards }
  }
  if (kind === 'poetry_recitation') {
    const { videoUrl, title } = await loadPoetryVideo(studentId, schoolId)
    return { kind: 'poetry_recitation', videoUrl, title }
  }
  return { kind: 'placeholder' }
}
