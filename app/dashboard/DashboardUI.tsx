// ============================================================
// app/dashboard/DashboardUI.tsx
//
// Presentational sub-components for the dashboard page.
// Split from page.tsx to keep that file under 300 lines.
// ============================================================

import Link from 'next/link'
import { OrganizationSwitcher } from '@clerk/nextjs'
import type { Student } from '@/lib/types'
import { formatGrade } from '@/lib/gradeLevel'
import EditStudentForm from '@/components/dashboard/EditStudentForm'
import StudentCardOverflow from '@/components/dashboard/StudentCardOverflow'
import type { DashboardView } from './dashboardTypes'

// Archival palette constants (referenced in inline styles)
const GOLD   = '#B8A050'
const SEPIA  = '#5a4a3a'
const FAINT  = '#8a7558'

export function OrgPickerScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '2.5rem 3rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '0 0 0.75rem' }}>
          Hadar Living Portfolio
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--navy)', margin: '0 0 1.75rem' }}>
          Select your school
        </h1>
        <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/dashboard" />
      </div>
    </div>
  )
}

export function ParentPendingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '2.5rem 3rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '0 0 0.75rem' }}>
          Portfolio Access
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--navy)', margin: '0 0 1rem' }}>
          Your portfolio access is being set up.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-light)', margin: 0 }}>
          Please visit the link in your invitation email to access your child&apos;s portfolio, or contact your school.
        </p>
      </div>
    </div>
  )
}

export function PageHeader({
  schoolName,
  schoolLogoUrl,
  activeView,
  onViewChange,
  role,
  children,
}: {
  schoolName:     string
  schoolLogoUrl?: string | null
  activeView:     DashboardView
  onViewChange:   (view: DashboardView) => void
  role:           string
  children:       React.ReactNode
}) {
  const toggle = (view: DashboardView) =>
    onViewChange(activeView === view ? 'roster' : view)

  return (
    <header
      className="db-header"
      style={{
        padding:        '0.9rem 2rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {schoolLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={schoolLogoUrl}
            alt=""
            style={{ maxHeight: 28, mixBlendMode: 'screen', opacity: 0.9 }}
          />
        )}
        <span
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.72rem',
            letterSpacing: '0.16em',
            color:         GOLD,
            textTransform: 'uppercase',
          }}
        >
          {schoolName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <HeaderIconButton
          label="Year in Review"
          active={activeView === 'year-in-review'}
          onClick={() => toggle('year-in-review')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="1" />
            <line x1="3"  y1="10" x2="21" y2="10" />
            <line x1="8"  y1="3"  x2="8"  y2="7"  />
            <line x1="16" y1="3"  x2="16" y2="7"  />
          </svg>
        </HeaderIconButton>

        {role === 'admin' && (
          <Link
            href="/dashboard/settings"
            aria-label="Settings"
            title="Settings"
            className="db-header-icon-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        )}

        {children}
      </div>
    </header>
  )
}

function HeaderIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label:    string
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="db-header-icon-btn"
      data-active={active ? 'true' : 'false'}
    >
      {children}
    </button>
  )
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${path}`
}

export function StudentCard({ student, role }: { student: Student; role: string }) {
  const canEdit    = role === 'admin' || role === 'teacher'
  const canArchive = canEdit && !student.isDemo
  const initials   = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = buildPhotoUrl(student.profilePhotoPath ?? null)

  const metaParts: string[] = [formatGrade(student.gradeLevel), student.academicYear]

  // Future sprint: populate from bulk-fetched assessments.
  // Only chips with actual numeric values should be pushed here;
  // empty array → the chip row is skipped entirely below.
  const statChips: { label: string; value: string }[] = []

  return (
    <article className="db-student-card">
      {/*
        Link wraps ONLY the navigable card content.
        Action cluster (edit + overflow menu) is a sibling of the Link so
        button clicks never bubble to it and never trigger navigation.
      */}
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
          <EditStudentForm student={student} />
          {canArchive && <StudentCardOverflow studentId={student.id} />}
        </div>
      )}
    </article>
  )
}

export function EmptyState() {
  return (
    <div
      style={{
        textAlign:  'center',
        padding:    '4rem 2rem',
        border:     '1px solid rgba(160,130,80,0.3)',
        background: 'rgba(255,252,245,0.5)',
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle:  'italic',
          fontSize:   '1.25rem',
          color:      SEPIA,
          margin:     '0 0 0.5rem',
        }}
      >
        No students yet
      </p>
      <p
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize:   '0.95rem',
          color:      FAINT,
          margin:     0,
        }}
      >
        Use the Add Student button to create the first record.
      </p>
    </div>
  )
}
