// ============================================================
// app/dashboard/DashboardUI.tsx
//
// Presentational sub-components for the dashboard page.
// Split from page.tsx to keep that file under 300 lines.
// ============================================================

import Link from 'next/link'
import { OrganizationSwitcher } from '@clerk/nextjs'
import type { Student } from '@/lib/types'
import DeleteStudentButton from '@/components/dashboard/DeleteStudentButton'

// Archival palette constants (referenced in inline styles)
const GOLD   = '#B8A050'
const INK    = '#2c1f0e'
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
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  return (
    <header
      className="db-header"
      style={{
        // db-header class supplies background texture; inline values for layout
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.65rem',
            letterSpacing: '0.14em',
            color:         GOLD,
            textTransform: 'uppercase',
            margin:        '0 0 0.25rem',
          }}
        >
          {role === 'admin' ? 'Admin' : 'Teacher'} Dashboard
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
            fontStyle:  'italic',
            fontSize:   '1.75rem',
            color:      '#e8d9b0',
            margin:     0,
          }}
        >
          Students
        </h1>
      </div>
      {children}
    </header>
  )
}

export function StudentCard({ student, role }: { student: Student; role: string }) {
  const canArchive = (role === 'admin' || role === 'teacher') && !student.isDemo
  return (
    <article className="db-student-card">
      {/* Brass clip centered above the card */}
      <img src="/images/clip.png" className="db-card-clip" alt="" aria-hidden="true" />

      <Link href={`/portfolio/${student.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            borderBottom: '1px solid rgba(160,130,80,0.3)',
            paddingBottom: '0.75rem',
            marginBottom:  '0.75rem',
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
              fontSize:   '1.25rem',
              color:      INK,
              margin:     0,
              lineHeight: 1.2,
            }}
          >
            {student.firstName} {student.lastName}
          </h2>
          {student.isDemo && (
            <span
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         FAINT,
                border:        `1px solid rgba(138,117,88,0.3)`,
                padding:       '0.1rem 0.4rem',
                marginTop:     '0.35rem',
                display:       'inline-block',
              }}
            >
              Demo
            </span>
          )}
        </div>
        <dl style={{ margin: 0 }}>
          <MetaRow label="Grade" value={student.gradeLevel} />
          <MetaRow label="Year"  value={student.academicYear} />
        </dl>
        <p
          style={{
            marginTop:  '1rem',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle:  'italic',
            fontSize:   '0.95rem',
            color:      GOLD,
          }}
        >
          View Portfolio →
        </p>
      </Link>
      {canArchive && <DeleteStudentButton studentId={student.id} />}
    </article>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
      <dt
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.58rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         SEPIA,
          minWidth:      '3.5rem',
          paddingTop:    '0.1rem',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize:   '0.95rem',
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
