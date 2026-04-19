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
import { mapStudent } from '@/lib/mappers'
import { mapProfile, mapProfileSection } from '@/lib/mappers/profileBuilder'
import { getCurrentAcademicYear } from '@/lib/academicYears'
import { formatGrade } from '@/lib/gradeLevel'
import {
  PROFILE_SECTION_KINDS,
  PROFILE_SECTION_KIND_LABELS,
  type ProfileSectionKind,
} from '@/lib/types/profileBuilder'
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
import SectionEditorShell from '@/components/profiles/sections/SectionEditorShell'
import LexileSectionWrapper from './LexileSectionWrapper'
import MAPSSectionWrapper from './MAPSSectionWrapper'
import AVANTSectionWrapper from './AVANTSectionWrapper'
import HebrewComparisonSectionWrapper from './HebrewComparisonSectionWrapper'
import ReadingListSectionWrapper from './ReadingListSectionWrapper'
import EnglishCompositionSectionWrapper from './EnglishCompositionSectionWrapper'
import HebrewCompositionSectionWrapper from './HebrewCompositionSectionWrapper'
import CharacterDevelopmentSectionWrapper from './CharacterDevelopmentSectionWrapper'
import PoetryRecitationSectionWrapper from './PoetryRecitationSectionWrapper'

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

  const { id: academicYearId } = await getCurrentAcademicYear(schoolId)

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

  // Shared props passed to every section wrapper that follows the
  // common SectionEditorShell contract (all wrappers except Lexile).
  const commonProps = {
    profileId:        profile.id,
    sectionId:        section.id,
    initialNarrative,
    initialStatus:    section.status,
    studentName,
    gradeLabel,
    termLabel:        profile.term,
    backHref,
  } as const

  // ── Lexile ───────────────────────────────────────────────────
  if (sectionKind === 'lexile') {
    const band = await loadLexileBand(studentId, schoolId)
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
    const assessments = await loadMapsScores(
      studentId, schoolId, student.gradeLevel, student.academicYear,
    )
    return <MAPSSectionWrapper {...commonProps} assessments={assessments} />
  }

  // ── AVANT Hebrew ─────────────────────────────────────────────
  if (sectionKind === 'avant_hebrew') {
    const assessments = await loadAvantAssessments(
      studentId, schoolId, student.gradeLevel, student.academicYear,
    )
    return <AVANTSectionWrapper {...commonProps} assessments={assessments} />
  }

  // ── Hebrew · National comparison ─────────────────────────────
  if (sectionKind === 'hebrew_comparison') {
    const merged = await loadAvantAssessments(
      studentId, schoolId, student.gradeLevel, student.academicYear,
    )
    const athenaScores = hebrewComparisonFromAvant(merged)
    return <HebrewComparisonSectionWrapper {...commonProps} athenaScores={athenaScores} />
  }

  // ── Reading · English Canon ──────────────────────────────────
  if (sectionKind === 'canon_reading') {
    const readings = await loadCanonReadings(studentId, schoolId)
    return <ReadingListSectionWrapper {...commonProps} readings={readings} />
  }

  // ── English / Hebrew composition ─────────────────────────────
  if (sectionKind === 'english_composition' || sectionKind === 'hebrew_composition') {
    const language = sectionKind === 'english_composition' ? 'english' : 'hebrew'
    const samples = await loadCompositionSamples(studentId, schoolId, language)
    const Wrapper = sectionKind === 'english_composition'
      ? EnglishCompositionSectionWrapper
      : HebrewCompositionSectionWrapper
    return <Wrapper {...commonProps} samples={samples} />
  }

  // ── Character Development · Middot ───────────────────────────
  if (sectionKind === 'character_middot') {
    const awards = await loadCharacterAwards(studentId, schoolId)
    return <CharacterDevelopmentSectionWrapper {...commonProps} awards={awards} />
  }

  // ── Rhetoric · Poetry Recitation ─────────────────────────────
  if (sectionKind === 'poetry_recitation') {
    const { videoUrl, title } = await loadPoetryVideo(studentId, schoolId)
    return (
      <PoetryRecitationSectionWrapper
        {...commonProps}
        studentId={studentId}
        initialVideoUrl={videoUrl}
        initialVideoTitle={title}
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
