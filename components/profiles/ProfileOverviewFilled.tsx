'use client'

// ============================================================
// components/profiles/ProfileOverviewFilled.tsx
//
// Student header + 4-stat completion grid + vertical list of
// profile sections. "Open section →" links are disabled —
// per-section editing wires up in a later phase.
// ============================================================

import Link from 'next/link'
import type { Student } from '@/lib/types'
import {
  PROFILE_SECTION_KIND_LABELS,
  type Profile,
  type ProfileSection,
  type ProfileSectionStatus,
} from '@/lib/types/profileBuilder'
import {
  PAGE, SHELL, EYEBROW,
  HEADER, AVATAR, HEADER_NAME, HEADER_META,
  STAT_GRID, STAT_BOX, STAT_LABEL, STAT_VALUE,
  SECTION_LIST, SECTION_ROW, SECTION_ROW_LAST,
  SECTION_TITLE, SECTION_STATUS, OPEN_LINK,
  SEASON_LABEL,
} from './profileOverviewStyles'

type Props = {
  student: Student
  profile: Profile
  sections: ProfileSection[]
  season: 'fall' | 'spring'
  academicYearLabel: string
}

const STATUS_LABEL: Record<ProfileSectionStatus, string> = {
  not_started:     'Not started',
  in_progress:     'In progress',
  awaiting_review: 'Awaiting your narrative',
  complete:        'Complete',
}

export default function ProfileOverviewFilled({
  student, profile, sections, season, academicYearLabel,
}: Props) {
  const counts: Record<ProfileSectionStatus, number> = {
    complete:        sections.filter(s => s.status === 'complete').length,
    awaiting_review: sections.filter(s => s.status === 'awaiting_review').length,
    in_progress:     sections.filter(s => s.status === 'in_progress').length,
    not_started:     sections.filter(s => s.status === 'not_started').length,
  }
  const initial = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`

  return (
    <div style={PAGE}>
      <div style={SHELL}>
        <div style={EYEBROW}>
          {SEASON_LABEL[season]} {academicYearLabel} profile · status {profile.status}
        </div>

        <div style={HEADER}>
          <div style={AVATAR}>{initial}</div>
          <div>
            <h1 style={HEADER_NAME}>
              {student.firstName} {student.lastName}
            </h1>
            <div style={HEADER_META}>
              Grade {student.gradeLevel} · {profile.term}
            </div>
          </div>
        </div>

        <div style={STAT_GRID}>
          <div style={STAT_BOX}>
            <div style={STAT_LABEL}>Complete</div>
            <div style={STAT_VALUE}>{counts.complete}</div>
          </div>
          <div style={STAT_BOX}>
            <div style={STAT_LABEL}>Awaiting your narrative</div>
            <div style={STAT_VALUE}>{counts.awaiting_review}</div>
          </div>
          <div style={STAT_BOX}>
            <div style={STAT_LABEL}>In progress</div>
            <div style={STAT_VALUE}>{counts.in_progress}</div>
          </div>
          <div style={STAT_BOX}>
            <div style={STAT_LABEL}>Not started</div>
            <div style={STAT_VALUE}>{counts.not_started}</div>
          </div>
        </div>

        <div style={SECTION_LIST}>
          {sections.map((s, i) => {
            const isLast = i === sections.length - 1
            return (
              <div key={s.id} style={isLast ? SECTION_ROW_LAST : SECTION_ROW}>
                <div>
                  <div style={SECTION_TITLE}>
                    {PROFILE_SECTION_KIND_LABELS[s.sectionKind]}
                  </div>
                  <div style={SECTION_STATUS}>{STATUS_LABEL[s.status]}</div>
                </div>
                <Link
                  href={`/dashboard/profiles/${student.id}/${season}/${s.sectionKind}`}
                  style={OPEN_LINK}
                >
                  Open section →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
