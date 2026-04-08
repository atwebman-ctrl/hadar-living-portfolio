// ============================================================
// app/dashboard/page.tsx
//
// Server component. Fetches students + derives auth context,
// then hands everything to DashboardClient for rendering.
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived server-side from the Clerk org.
// Parents are redirected to their child's portfolio.
// ============================================================

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import type { Student } from '@/lib/types'
import { OrgPickerScreen, ParentPendingScreen } from './DashboardUI'
import DashboardClient from './DashboardClient'
import './dashboard.css'

export default async function DashboardPage() {
  const { userId, orgId } = await auth()

  if (!userId) redirect('/sign-in')
  if (!orgId)  return <OrgPickerScreen />

  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  // ── Parent: redirect to portfolio or show pending screen ──
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

  // ── Fetch students for this school ────────────────────────
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .order('last_name',  { ascending: true })
    .order('first_name', { ascending: true })

  if (error) console.error('[Dashboard] Failed to fetch students', error)

  const students: Student[] = (data ?? []).map((row) =>
    mapStudent(row as Record<string, unknown>)
  )

  return (
    <div className="db-page">
      <div className="db-book">
        <div className="db-book-inner">
          <DashboardClient students={students} role={ctx.role} />
        </div>
      </div>
    </div>
  )
}
