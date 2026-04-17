// ============================================================
// app/dashboard/profiles/[studentId]/[season]/[sectionKind]/page.tsx
//
// Server component — per-section editor route. Validates the
// section kind, fetches the student, profile, profile_section,
// then branches to the matching section wrapper. Routing is
// polymorphic — each section kind maps to its own wrapper.
// Unimplemented kinds render a "Coming soon" placeholder so
// teachers don't hit 404s when clicking through the overview.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent, mapReading } from '@/lib/mappers'
import { mapProfile, mapProfileSection } from '@/lib/mappers/profileBuilder'
import { getAcademicYearId } from '@/lib/academicYears'
import { formatGrade } from '@/lib/gradeLevel'
import { mergeMapsAssessments } from '@/lib/mapsHelpers'
import type { HebrewSkillAverages } from '@/lib/hebrewComparisonNorms'
import {
  PROFILE_SECTION_KINDS,
  PROFILE_SECTION_KIND_LABELS,
  type ProfileSectionKind,
} from '@/lib/types/profileBuilder'
import SectionEditorShell from '@/components/profiles/sections/SectionEditorShell'
import LexileSectionWrapper from './LexileSectionWrapper'
import MAPSSectionWrapper from './MAPSSectionWrapper'
import AVANTSectionWrapper from './AVANTSectionWrapper'
import HebrewComparisonSectionWrapper from './HebrewComparisonSectionWrapper'
import ReadingListSectionWrapper from './ReadingListSectionWrapper'
import EnglishCompositionSectionWrapper from './EnglishCompositionSectionWrapper'
import HebrewCompositionSectionWrapper from './HebrewCompositionSectionWrapper'
import { parseLexileRange } from './_lexileRange'
import { loadCompositionSamples } from './_compositionSamples'
import { loadAvantAssessments } from './_avantData'

const CURRENT_ACADEMIC_YEAR_LABEL = '2025-2026'

type Props = {
  params: Promise<{
    studentId:    string
    season:       string
    sectionKind:  string
  }>
}

function isValidSectionKind(s: string): s is ProfileSectionKind {
  return (PROFILE_SECTION_KINDS as readonly string[]).includes(s)
}

export default async function SectionEditorPage({ params }: Props) {
  const { studentId, season, sectionKind } = await params

  if (season !== 'fall' && season !== 'spring') notFound()
  if (!isValidSectionKind(sectionKind)) notFound()

  const { schoolId, role } = await getAuthContext().catch(() => notFound())
  if (role === 'parent') notFound()

  const { data: studentRow } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()

  if (!studentRow) notFound()
  const student = mapStudent(studentRow as Record<string, unknown>)

  const academicYearId = await getAcademicYearId(schoolId, CURRENT_ACADEMIC_YEAR_LABEL)
  if (!academicYearId) notFound()

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('season', season)
    .eq('academic_year_id', academicYearId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!profileRow) notFound()
  const profile = mapProfile(profileRow as Parameters<typeof mapProfile>[0])

  const { data: sectionRow } = await supabaseAdmin
    .from('profile_sections')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('section_kind', sectionKind)
    .is('deleted_at', null)
    .maybeSingle()

  if (!sectionRow) notFound()
  const section = mapProfileSection(sectionRow as Parameters<typeof mapProfileSection>[0])

  const studentName = `${student.firstName} ${student.lastName}`
  const gradeLabel  = formatGrade(student.gradeLevel)
  const backHref    = `/dashboard/profiles/${studentId}/${season}`
  const initialNarrative = section.narrativeText ?? section.narrativeDraft ?? ''

  // ── Lexile ───────────────────────────────────────────────────
  if (sectionKind === 'lexile') {
    const { data: lexRow } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .eq('assessment_type', 'lexile')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lexileValue = (lexRow?.lexile_value as string | null) ?? null
    const range = parseLexileRange(lexileValue)
    const band = range
      ? {
          label:     lexileValue ?? `${range.min}L`,
          rangeMinL: range.min,
          rangeMaxL: range.max,
          termLabel: (lexRow?.term as string | null) ?? '—',
          notes:     (lexRow?.notes as string | null) ?? null,
        }
      : null

    return (
      <LexileSectionWrapper
        profileId={profile.id}
        section={section}
        student={student}
        termLabel={profile.term}
        backHref={backHref}
        band={band}
      />
    )
  }

  // ── MAPS scores ──────────────────────────────────────────────
  if (sectionKind === 'maps_scores') {
    const { data: rows } = await supabaseAdmin
      .from('assessments')
      .select('id, assessment_type, term, academic_year, rit_score, percentile')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .in('assessment_type', ['maps_math', 'maps_english'])
      .is('deleted_at', null)

    const studentCurrentGrade = parseInt(student.gradeLevel, 10)
    const assessments = mergeMapsAssessments(
      (rows ?? []) as Parameters<typeof mergeMapsAssessments>[0],
      Number.isNaN(studentCurrentGrade) ? 0 : studentCurrentGrade,
      student.academicYear,
    )

    return (
      <MAPSSectionWrapper
        profileId={profile.id}
        sectionId={section.id}
        initialNarrative={initialNarrative}
        initialStatus={section.status}
        studentName={studentName}
        gradeLabel={gradeLabel}
        termLabel={profile.term}
        backHref={backHref}
        assessments={assessments}
      />
    )
  }

  // ── AVANT Hebrew ─────────────────────────────────────────────
  if (sectionKind === 'avant_hebrew') {
    const assessments = await loadAvantAssessments(
      studentId, schoolId, student.gradeLevel, student.academicYear,
    )
    return (
      <AVANTSectionWrapper
        profileId={profile.id}
        sectionId={section.id}
        initialNarrative={initialNarrative}
        initialStatus={section.status}
        studentName={studentName}
        gradeLabel={gradeLabel}
        termLabel={profile.term}
        backHref={backHref}
        assessments={assessments}
      />
    )
  }

  // ── Hebrew · National comparison ─────────────────────────────
  if (sectionKind === 'hebrew_comparison') {
    const merged = await loadAvantAssessments(
      studentId, schoolId, student.gradeLevel, student.academicYear,
    )
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

    return (
      <HebrewComparisonSectionWrapper
        profileId={profile.id}
        sectionId={section.id}
        initialNarrative={initialNarrative}
        initialStatus={section.status}
        studentName={studentName}
        gradeLabel={gradeLabel}
        termLabel={profile.term}
        backHref={backHref}
        athenaScores={athenaScores}
      />
    )
  }

  // ── Reading · English Canon ──────────────────────────────────
  if (sectionKind === 'canon_reading') {
    const { data: readingRows } = await supabaseAdmin
      .from('readings')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('sort_order')

    const readings = (readingRows ?? []).map((r) => mapReading(r as Record<string, unknown>))

    return (
      <ReadingListSectionWrapper
        profileId={profile.id}
        sectionId={section.id}
        initialNarrative={initialNarrative}
        initialStatus={section.status}
        studentName={studentName}
        gradeLabel={gradeLabel}
        termLabel={profile.term}
        backHref={backHref}
        readings={readings}
      />
    )
  }

  // ── English / Hebrew composition ─────────────────────────────
  if (sectionKind === 'english_composition' || sectionKind === 'hebrew_composition') {
    const language = sectionKind === 'english_composition' ? 'english' : 'hebrew'
    const samples = await loadCompositionSamples(studentId, schoolId, language)
    const Wrapper = sectionKind === 'english_composition'
      ? EnglishCompositionSectionWrapper
      : HebrewCompositionSectionWrapper
    return (
      <Wrapper
        profileId={profile.id}
        sectionId={section.id}
        initialNarrative={initialNarrative}
        initialStatus={section.status}
        studentName={studentName}
        gradeLabel={gradeLabel}
        termLabel={profile.term}
        backHref={backHref}
        samples={samples}
      />
    )
  }

  // ── Placeholder for unimplemented section kinds ──────────────
  return (
    <SectionEditorShell
      studentName={studentName}
      gradeLabel={gradeLabel}
      termLabel={profile.term}
      sectionTitle={PROFILE_SECTION_KIND_LABELS[sectionKind]}
      sectionStatus={section.status}
      backHref={backHref}
    >
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-mid)',
        textAlign: 'center', padding: '40px 20px', lineHeight: 1.6,
      }}>
        This section editor is coming in a later phase.
        <br />
        Use the back link above to return to the profile overview.
      </div>
    </SectionEditorShell>
  )
}
