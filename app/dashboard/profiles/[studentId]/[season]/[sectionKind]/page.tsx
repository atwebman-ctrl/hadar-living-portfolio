// ============================================================
// app/dashboard/profiles/[studentId]/[season]/[sectionKind]/page.tsx
//
// Server component — per-section editor route. Validates the
// section kind, fetches the student, profile, profile_section,
// and (for Lexile) the underlying assessment row, then hands
// it to the matching client wrapper. Routing is polymorphic —
// each section kind maps to its own wrapper.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import { mapProfile, mapProfileSection } from '@/lib/mappers/profileBuilder'
import { getAcademicYearId } from '@/lib/academicYears'
import {
  PROFILE_SECTION_KINDS,
  type ProfileSectionKind,
} from '@/lib/types/profileBuilder'
import LexileSectionWrapper from './LexileSectionWrapper'

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

function parseLexileRange(value: string | null): { min: number; max: number } | null {
  if (!value) return null
  // Accepts "1150L-1300L", "1150L–1300L", or single "1225L" (treated as both ends).
  const m = value.match(/(\d+)L?\s*[-–]\s*(\d+)L?/)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = value.match(/(\d+)L?/)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return null
}

export default async function SectionEditorPage({ params }: Props) {
  const { studentId, season, sectionKind } = await params

  if (season !== 'fall' && season !== 'spring') notFound()
  if (!isValidSectionKind(sectionKind)) notFound()

  const { schoolId, role } = await getAuthContext().catch(() => notFound())
  if (role === 'parent') notFound()

  // Student
  const { data: studentRow } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()

  if (!studentRow) notFound()
  const student = mapStudent(studentRow as Record<string, unknown>)

  // Profile (must exist — section editor is reachable only from overview)
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

  // The matching profile_section row
  const { data: sectionRow } = await supabaseAdmin
    .from('profile_sections')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('section_kind', sectionKind)
    .is('deleted_at', null)
    .maybeSingle()

  if (!sectionRow) notFound()
  const section = mapProfileSection(sectionRow as Parameters<typeof mapProfileSection>[0])

  const backHref = `/dashboard/profiles/${studentId}/${season}`

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

  // Other section kinds aren't implemented yet — keep the route
  // tight and 404 rather than render an empty shell.
  notFound()
}
