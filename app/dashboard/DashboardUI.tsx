// ============================================================
// app/dashboard/DashboardUI.tsx
//
// Presentational sub-components for the dashboard page.
// Split from page.tsx to keep that file under 300 lines.
// ============================================================

import Link from 'next/link'
import { OrganizationSwitcher } from '@clerk/nextjs'
import type { Student } from '@/lib/types'

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
      style={{
        background: 'var(--navy)',
        borderBottom: '2px solid var(--gold)',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            margin: '0 0 0.25rem',
          }}
        >
          {role === 'admin' ? 'Admin' : 'Teacher'} Dashboard
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            color: 'var(--gold-pale)',
            margin: 0,
          }}
        >
          Students
        </h1>
      </div>
      {children}
    </header>
  )
}

export function StudentCard({ student }: { student: Student }) {
  return (
    <Link href={`/portfolio/${student.id}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: 'var(--parchment)',
          border: '1px solid var(--rule)',
          padding: '1.25rem 1.5rem',
          height: '100%',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid var(--rule)',
            paddingBottom: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              color: 'var(--navy)',
              margin: 0,
            }}
          >
            {student.firstName} {student.lastName}
          </h2>
          {student.isDemo && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                border: '1px solid var(--rule)',
                padding: '0.1rem 0.4rem',
                marginTop: '0.35rem',
                display: 'inline-block',
              }}
            >
              Demo
            </span>
          )}
        </div>
        <dl style={{ margin: 0 }}>
          <MetaRow label="Grade" value={student.gradeLevel} />
          <MetaRow label="Year" value={student.academicYear} />
        </dl>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
          }}
        >
          View Portfolio →
        </p>
      </article>
    </Link>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
      <dt
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-light)',
          minWidth: '3.5rem',
          paddingTop: '0.1rem',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          color: 'var(--ink)',
          margin: 0,
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
        textAlign: 'center',
        padding: '4rem 2rem',
        border: '1px solid var(--rule)',
        background: 'var(--parchment)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.25rem',
          color: 'var(--ink-mid)',
          margin: '0 0 0.5rem',
        }}
      >
        No students yet
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          color: 'var(--ink-light)',
          margin: 0,
        }}
      >
        Use the Add Student button to create the first record.
      </p>
    </div>
  )
}
