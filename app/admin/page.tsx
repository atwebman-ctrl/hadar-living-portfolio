// ============================================================
// app/admin/page.tsx
//
// Server component. Admin-only settings overview.
// Teachers are redirected to /dashboard; parents to /.
// school_id is derived server-side from the Clerk org.
// ============================================================

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function AdminPage() {
  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  if (ctx.role === 'teacher') redirect('/dashboard')
  if (ctx.role === 'parent')  redirect('/')

  // Fetch school name for display
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('id, name, slug')
    .eq('id', ctx.schoolId)
    .single()

  const schoolName = school?.name ?? '—'
  const schoolSlug = school?.slug ?? '—'

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Page header */}
      <header style={{ background: 'var(--navy)', borderBottom: '2px solid var(--gold)', padding: '1.5rem 2rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
          Admin
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--gold-pale)', margin: 0 }}>
          School Settings
        </h1>
      </header>

      <main style={{ padding: '2rem', maxWidth: '56rem', margin: '0 auto' }}>
        {/* School info card */}
        <section style={{ marginBottom: '2rem' }}>
          <SectionHeading>School</SectionHeading>
          <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '1.5rem' }}>
            <InfoRow label="Name"     value={schoolName} />
            <InfoRow label="Slug"     value={schoolSlug} />
            <InfoRow label="ID"       value={ctx.schoolId} mono />
          </div>
        </section>

        {/* Manage Teachers — Sprint 3 */}
        <section style={{ marginBottom: '2rem' }}>
          <SectionHeading>Manage Teachers</SectionHeading>
          <Placeholder />
        </section>

        {/* School Theme — Sprint 3 */}
        <section style={{ marginBottom: '2rem' }}>
          <SectionHeading>School Theme</SectionHeading>
          <Placeholder />
        </section>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-heading)',
      fontSize: '1.1rem',
      color: 'var(--navy)',
      margin: '0 0 0.75rem',
      paddingBottom: '0.4rem',
      borderBottom: '1px solid var(--rule)',
    }}>
      {children}
    </h2>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid var(--rule)' }}>
      <dt style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ink-light)', minWidth: '4rem', paddingTop: '0.15rem',
      }}>
        {label}
      </dt>
      <dd style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: mono ? '0.78rem' : '0.9rem',
        color: 'var(--ink)',
        margin: 0,
        wordBreak: 'break-all',
      }}>
        {value}
      </dd>
    </div>
  )
}

function Placeholder() {
  return (
    <div style={{
      background: 'var(--parchment)',
      border: '1px solid var(--rule)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold)',
        padding: '0.2rem 0.5rem', whiteSpace: 'nowrap',
      }}>
        Sprint 3
      </span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-light)', margin: 0 }}>
        Coming in Sprint 3.
      </p>
    </div>
  )
}
