'use client'

// ============================================================
// components/profiles/ProfileOverview.tsx
//
// Thin selector that picks between the empty start-state and
// the filled overview. Full markup lives in the two child
// components so each file stays under the 300-line limit.
// ============================================================

import type { Student } from '@/lib/types'
import type { Profile, ProfileSection } from '@/lib/types/profileBuilder'
import ProfileOverviewEmptyState from './ProfileOverviewEmptyState'
import ProfileOverviewFilled from './ProfileOverviewFilled'

type Props = {
  student: Student
  profile: Profile | null
  sections: ProfileSection[]
  season: 'fall' | 'spring'
  academicYearLabel: string
  viewerRole: 'admin' | 'teacher' | 'parent'
}

export default function ProfileOverview({
  student, profile, sections, season, academicYearLabel, viewerRole,
}: Props) {
  if (profile === null) {
    return (
      <ProfileOverviewEmptyState
        student={student}
        season={season}
        academicYearLabel={academicYearLabel}
      />
    )
  }
  return (
    <ProfileOverviewFilled
      student={student}
      profile={profile}
      sections={sections}
      season={season}
      academicYearLabel={academicYearLabel}
      viewerRole={viewerRole}
    />
  )
}
