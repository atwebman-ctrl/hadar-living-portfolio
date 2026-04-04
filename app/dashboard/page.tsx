// ============================================================
// app/dashboard/page.tsx
//
// Server component. Lists all students for the authenticated school.
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived server-side from the Clerk org — never from
// the client or from any request parameter.
// ============================================================

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import type { Student } from '@/lib/types'
import AddStudentForm from './AddStudentForm'

export default async function DashboardPage() {
  // Derive auth context entirely server-side. Unauthenticated users are
  // redirected to sign-in; users without the correct role go to home.
  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    redirect('/')
  }

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) {
    console.error('[Dashboard] Failed to fetch students', error)
  }

  const students: Student[] = (data ?? []).map((row) =>
    mapStudent(row as Record<string, unknown>)
  )

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <PageHeader role={ctx.role}>
        <AddStudentForm />
      </PageHeader>
      <main style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto' }}>
        {students.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {students.map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function PageHeader({
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

function StudentCard({ student }: { student: Student }) {
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

function EmptyState() {
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
