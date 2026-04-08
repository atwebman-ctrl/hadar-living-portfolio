// ============================================================
// app/dashboard/page.tsx
//
// Server component. Lists all students for the authenticated school.
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived server-side from the Clerk org — never from
// the client or from any request parameter.
//
// Parents are redirected to their child's portfolio. If the
// parent_students link hasn't been established yet (first visit
// before opening the portfolio link), a pending screen is shown.
// ============================================================

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import type { Student } from '@/lib/types'
import AddStudentForm from './AddStudentForm'
import {
  OrgPickerScreen,
  ParentPendingScreen,
  PageHeader,
  StudentCard,
  EmptyState,
} from './DashboardUI'
import './dashboard.css'

export default async function DashboardPage() {
  const { userId, orgId } = await auth()

  if (!userId) redirect('/sign-in')
  if (!orgId)  return <OrgPickerScreen />

  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  if (ctx.role === 'parent') {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(ctx.userId).catch(() => null)
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser?.emailAddresses[0]?.emailAddress ??
      null

    const orParts = [`parent_clerk_user_id.eq.${ctx.userId}`]
    if (primaryEmail) orParts.push(`invited_email.eq.${primaryEmail.toLowerCase()}`)

    const { data: link } = await supabaseAdmin
      .from('parent_students')
      .select('id, student_id, parent_clerk_user_id')
      .eq('school_id', ctx.schoolId)
      .or(orParts.join(','))
      .limit(1)
      .maybeSingle()

    if (link?.student_id) {
      if (!link.parent_clerk_user_id) {
        await supabaseAdmin
          .from('parent_students')
          .update({ parent_clerk_user_id: ctx.userId, status: 'active' })
          .eq('id', link.id)
      }
      redirect(`/portfolio/${link.student_id}`)
    }

    return <ParentPendingScreen />
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') redirect('/')

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) console.error('[Dashboard] Failed to fetch students', error)

  const students: Student[] = (data ?? []).map((row) =>
    mapStudent(row as Record<string, unknown>)
  )

  return (
    <>
      {/* Ambient desk props — candles fixed to viewport edges */}
      <img src="/images/candle.png" className="db-candle db-candle-left"  alt="" aria-hidden="true" />
      <img src="/images/candle.png" className="db-candle db-candle-right" alt="" aria-hidden="true" />

      <div className="db-page">
        <div className="db-book">

          {/* Corner ornaments on the binding */}
          <img src="/images/ornamant-edge-dashboard.png" className="db-corner db-corner-tl" alt="" aria-hidden="true" />
          <img src="/images/ornamant-edge-dashboard.png" className="db-corner db-corner-tr" alt="" aria-hidden="true" />
          <img src="/images/ornamant-edge-dashboard.png" className="db-corner db-corner-br" alt="" aria-hidden="true" />
          <img src="/images/ornamant-edge-dashboard.png" className="db-corner db-corner-bl" alt="" aria-hidden="true" />

          <div className="db-book-inner">
            {/* Watermark overlays — parchment page decorations */}
            <img src="/images/compass.png"          className="db-compass" alt="" aria-hidden="true" />
            <img src="/images/star-of-david-seal.png" className="db-seal" alt="" aria-hidden="true" />

            <PageHeader role={ctx.role}>
              <AddStudentForm />
            </PageHeader>

            <main className="db-main">
              <div className="db-official-badge">⊙ Official Record</div>
              <h2 className="db-registry-title">Registry of Advanced Scholars</h2>
              <div className="db-registry-rule" />
              <p className="db-registry-sub">
                Student records, academic progress, and portfolio archives for the current academic cycle.
              </p>

              {students.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="student-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                  {students.map((s) => (
                    <StudentCard key={s.id} student={s} role={ctx.role} />
                  ))}
                </div>
              )}
            </main>
          </div>

        </div>
      </div>
    </>
  )
}
