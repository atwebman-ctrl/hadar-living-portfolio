// ============================================================
// app/dashboard/StudentCard.tsx
//
// Roster grid card for a single student. Extracted from
// DashboardUI.tsx in Phase 2 of the Profile Builder wiring so
// the file could grow a Spring Profile status line without
// pushing DashboardUI past the 300-line limit.
// ============================================================

import Link from 'next/link'
import type { Student } from '@/lib/types'
import { formatGrade } from '@/lib/gradeLevel'
import EditStudentForm from '@/components/dashboard/EditStudentForm'
import StudentCardOverflow from '@/components/dashboard/StudentCardOverflow'
import type { StudentProfileStatus } from '@/lib/profileStatus'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${path}`
}

function statusLine(status: StudentProfileStatus | undefined): { text: string; color: string; weight: number } | null {
  if (!status) return null
  switch (status.kind) {
    case 'not_started':
      return { text: 'Spring profile · Not started', color: 'var(--ink-faint)', weight: 400 }
    case 'in_draft':
      return {
        text:   status.hasFeedback
          ? `Spring profile · Returned · ${status.requiredComplete}/${status.requiredTotal}`
          : `Spring profile · Draft ${status.requiredComplete}/${status.requiredTotal}`,
        color:  status.hasFeedback ? 'var(--plum, #8a3a66)' : 'var(--gold)',
        weight: status.hasFeedback ? 600 : 500,
      }
    case 'in_review':
      return { text: 'Spring profile · In review',  color: 'var(--gold)', weight: 600 }
    case 'published':
      return { text: 'Spring profile · Published',  color: 'var(--teal, #2d6a6a)', weight: 500 }
  }
}

export function StudentCard({
  student,
  role,
  onQuickNote,
  profileStatus,
}: {
  student:        Student
  role:           string
  onQuickNote?:   (student: Student) => void
  profileStatus?: StudentProfileStatus
}) {
  const canEdit    = role === 'admin' || role === 'teacher'
  const canArchive = canEdit && !student.isDemo
  const initials   = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = buildPhotoUrl(student.profilePhotoPath ?? null)

  const metaParts: string[] = [formatGrade(student.gradeLevel), student.academicYear]
  const status = statusLine(profileStatus)

  // Reserved for future bulk-fetched assessment chips.
  const statChips: { label: string; value: string }[] = []

  return (
    <article className="db-student-card">
      <Link href={`/portfolio/${student.id}`} className="db-card-link">
        <div className="db-card-head">
          <div className="db-card-photo">
            {photoUrl
              ? <img src={photoUrl} alt={`${student.firstName} ${student.lastName}`} />
              : <span className="db-card-initials">{initials}</span>}
          </div>
          <div className="db-card-identity">
            <h2 className="db-card-name">{student.firstName} {student.lastName}</h2>
            <p className="db-card-meta">{metaParts.join(' · ')}</p>
            {status && (
              <p
                className="db-card-profile-status"
                style={{
                  margin:        '2px 0 0',
                  fontFamily:    'var(--font-mono)',
                  fontSize:      11,
                  letterSpacing: '0.06em',
                  color:         status.color,
                  fontWeight:    status.weight,
                }}
              >
                {status.text}
              </p>
            )}
            {student.enrollmentStatus !== 'active' && (
              <span className="db-card-status">{student.enrollmentStatus}</span>
            )}
          </div>
        </div>

        {statChips.length > 0 && (
          <div className="db-card-chips">
            {statChips.map((c) => (
              <span key={c.label} className="db-card-chip">{c.label}: {c.value}</span>
            ))}
          </div>
        )}

        <span className="db-card-view">View Portfolio →</span>
      </Link>

      {student.isDemo && <span className="db-card-demo">Demo</span>}

      {canEdit && (
        <div className="db-card-actions">
          {onQuickNote && (
            <button
              type="button"
              className="db-card-note-btn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickNote(student) }}
              aria-label={`Add quick note for ${student.firstName} ${student.lastName}`}
              title="Add quick note"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}
          <EditStudentForm student={student} />
          {canArchive && <StudentCardOverflow studentId={student.id} />}
        </div>
      )}
    </article>
  )
}
