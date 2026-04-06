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

export default async function DashboardPage() {
  // Check for active org before calling getAuthContext(), which throws
  // AUTH_NO_ORG when orgId is absent. Users authenticated but not yet in
  // an org (e.g. just signed up) get the org picker instead of a redirect.
  const { userId, orgId } = await auth()

  if (!userId) redirect('/sign-in')

  if (!orgId) {
    return <OrgPickerScreen />
  }

  // Derive auth context entirely server-side.
  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  if (ctx.role === 'parent') {
    // Resolve the parent's primary email for the email-based fallback.
    // On first login parent_clerk_user_id is null — the row was created
    // with only invited_email, so we must match by email as well.
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(ctx.userId).catch(() => null)
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser?.emailAddresses[0]?.emailAddress ??
      null

    // OR filter: match by Clerk user ID (returning parent) or invited email (first visit).
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
      // First visit matched by email — link the Clerk user ID to the row.
      if (!link.parent_clerk_user_id) {
        await supabaseAdmin
          .from('parent_students')
          .update({ parent_clerk_user_id: ctx.userId, status: 'active' })
          .eq('id', link.id)
      }
      redirect(`/portfolio/${link.student_id}`)
    }

    // No matched row — invitation pending or not yet sent.
    return <ParentPendingScreen />
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    redirect('/')
  }

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
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
            className="student-grid"
            style={{ display: 'grid', gap: '1.25rem' }}
          >
            {students.map((s) => (
              <StudentCard key={s.id} student={s} role={ctx.role} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
