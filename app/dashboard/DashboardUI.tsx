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
import DeleteStudentButton from '@/components/dashboard/DeleteStudentButton'
import EditStudentForm from '@/components/dashboard/EditStudentForm'
import type { DashboardView } from './dashboardTypes'

// Archival palette constants (referenced in inline styles)
const GOLD   = '#B8A050'
const INK    = '#2c1f0e'
const SEPIA  = '#5a4a3a'
const FAINT  = '#8a7558'

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const born  = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const m = today.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--
  return age
}

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
  activeView,
  onViewChange,
  role,
  children,
}: {
  schoolName:   string
  activeView:   DashboardView
  onViewChange: (view: DashboardView) => void
  role:         string
  children:     React.ReactNode
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
      <p
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.72rem',
          letterSpacing: '0.16em',
          color:         GOLD,
          textTransform: 'uppercase',
          margin:        0,
        }}
      >
        {schoolName}
      </p>

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
          <HeaderIconButton
            label="Settings"
            active={activeView === 'settings'}
            onClick={() => toggle('settings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </HeaderIconButton>
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
  const age        = calcAge(student.dateOfBirth)
  const initials   = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = buildPhotoUrl(student.profilePhotoPath ?? null)
  return (
    <article className="db-student-card">

      {/*
        Link wraps ONLY the navigable card content.
        EditStudentForm and DeleteStudentButton are siblings of the Link so
        their clicks never bubble to it and never trigger navigation.
      */}
      <Link href={`/portfolio/${student.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {/* Profile photo / initials circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid rgba(184,160,80,0.3)', flexShrink: 0,
            background: 'linear-gradient(135deg, #1a3a6b 0%, #C49A2A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt={`${student.firstName} ${student.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', color: '#fff', fontWeight: 700, userSelect: 'none' }}>{initials}</span>
            }
          </div>
        </div>

        <div style={{ borderBottom: '1px solid rgba(160,130,80,0.3)', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontWeight: 700, fontSize: '1.375rem', color: INK, margin: 0, lineHeight: 1.2 }}>
            {student.firstName} {student.lastName}
          </h2>
          {student.enrollmentStatus !== 'active' && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(146,64,14,0.25)', padding: '0.15rem 0.45rem', whiteSpace: 'nowrap', display: 'inline-block', marginTop: '0.3rem' }}>
              {student.enrollmentStatus}
            </span>
          )}
          {student.isDemo && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: FAINT, border: `1px solid rgba(138,117,88,0.3)`, padding: '0.1rem 0.4rem', marginTop: '0.35rem', display: 'inline-block' }}>
              Demo
            </span>
          )}
        </div>

        <dl style={{ margin: 0 }}>
          <MetaRow label="Grade" value={formatGrade(student.gradeLevel)} />
          <MetaRow label="Year"  value={student.academicYear} />
          {student.gender && <MetaRow label="Gender" value={student.gender === 'boy' ? 'Boy' : 'Girl'} />}
          {age !== null   && <MetaRow label="Age"    value={`Age ${age}`} />}
        </dl>

        <p style={{ marginTop: '1.25rem', fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1.05rem', color: GOLD, textDecoration: 'underline', textDecorationColor: 'rgba(184,160,80,0.5)', textUnderlineOffset: '3px' }}>
          View Portfolio →
        </p>
      </Link>

      {/* Edit button — outside Link; clicks cannot bubble to the Link */}
      {canEdit && (
        <div style={{ position: 'absolute', top: '0.65rem', right: '0.75rem', zIndex: 2 }}>
          <EditStudentForm student={student} />
        </div>
      )}

      {/* Archive button — already outside Link */}
      {canArchive && (
        <div style={{ position: 'absolute', bottom: '0.65rem', right: '0.75rem', zIndex: 2 }}>
          <DeleteStudentButton studentId={student.id} />
        </div>
      )}
    </article>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.35rem' }}>
      <dt
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.58rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         SEPIA,
          minWidth:      '3.5rem',
          paddingTop:    '0.15rem',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize:   '1rem',
          color:      INK,
          margin:     0,
        }}
      >
        {value}
      </dd>
    </div>
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
