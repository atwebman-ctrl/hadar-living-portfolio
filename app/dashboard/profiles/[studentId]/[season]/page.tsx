// ============================================================
// app/dashboard/profiles/[studentId]/[season]/page.tsx
//
// Server component — Profile Overview for a single student
// and season. Fetches student + (optional) profile + sections
// and hands them to <ProfileOverview /> which decides between
// the empty start-state and the filled overview.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import {
  mapProfile,
  mapProfileSection,
} from '@/lib/mappers/profileBuilder'
import { getCurrentAcademicYear } from '@/lib/academicYears'
import type { Profile, ProfileSection } from '@/lib/types/profileBuilder'
import ProfileOverview from '@/components/profiles/ProfileOverview'

type Props = {
  params: Promise<{ studentId: string; season: string }>
}

export default async function ProfileOverviewPage({ params }: Props) {
  const { studentId, season } = await params

  if (season !== 'fall' && season !== 'spring') notFound()

  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())

  // Parents see the published parent view at a different route — keep
  // them out of the builder entirely for now.
  if (role === 'parent') {
    void userId
    notFound()
  }

  // Student
  const { data: studentRow, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()

  if (studentError || !studentRow) notFound()
  const student = mapStudent(studentRow as Record<string, unknown>)

  // Resolve academic_year_id so the profile lookup is correctly scoped.
  const { id: academicYearId, label: academicYearLabel } =
    await getCurrentAcademicYear(schoolId)

  // Profile (may not exist yet)
  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('season', season)
    .eq('academic_year_id', academicYearId)
    .is('deleted_at', null)
    .maybeSingle()

  let profile: Profile | null = null
  let sections: ProfileSection[] = []

  if (profileRow) {
    profile = mapProfile(profileRow as Parameters<typeof mapProfile>[0])

    const { data: sectionRows } = await supabaseAdmin
      .from('profile_sections')
      .select('*')
      .eq('profile_id', profile.id)
      .is('deleted_at', null)
      .order('section_order', { ascending: true })

    sections = (sectionRows ?? []).map((r) =>
      mapProfileSection(r as Parameters<typeof mapProfileSection>[0]),
    )
  }

  return (
    <ProfileOverview
      student={student}
      profile={profile}
      sections={sections}
      season={season}
      academicYearLabel={academicYearLabel}
    />
  )
}
