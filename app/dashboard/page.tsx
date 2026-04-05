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
import { auth } from '@clerk/nextjs/server'
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
    // Parents don't have a student list — send them straight to their child's portfolio.
    const { data: link } = await supabaseAdmin
      .from('parent_students')
      .select('student_id')
      .eq('parent_clerk_user_id', ctx.userId)
      .eq('school_id', ctx.schoolId)
      .limit(1)
      .maybeSingle()

    if (link?.student_id) {
      redirect(`/portfolio/${link.student_id}`)
    }

    // Invited but hasn't visited their portfolio yet — student_id not linked.
    return <ParentPendingScreen />
  }

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
