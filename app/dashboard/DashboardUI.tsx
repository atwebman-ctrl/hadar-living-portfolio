// ============================================================
// app/dashboard/DashboardUI.tsx
//
// Presentational sub-components for the dashboard page.
// Split from page.tsx to keep that file under 300 lines.
// ============================================================

import Link from 'next/link'
import Image from 'next/image'
import { OrganizationSwitcher } from '@clerk/nextjs'
import type { DashboardView } from './dashboardTypes'

// Re-exported so existing import sites (StudentGrid, ByGradeView) keep
// working after the StudentCard split. New code should import directly
// from './StudentCard'.
export { StudentCard } from './StudentCard'

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
      <Link
        href="/dashboard"
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '0.75rem',
          textDecoration: 'none',
          color:          'inherit',
        }}
      >
        {schoolLogoUrl && (
          <Image
            src={schoolLogoUrl}
            alt=""
            width={120}
            height={28}
            style={{ height: 28, width: 'auto', mixBlendMode: 'screen', opacity: 0.9 }}
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
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <HeaderIconButton
          label="Teacher Workbench"
          active={activeView === 'workbench'}
          onClick={() => toggle('workbench')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </HeaderIconButton>

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
