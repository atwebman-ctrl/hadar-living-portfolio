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
import { getAcademicYearId } from '@/lib/academicYears'
import { getProfileStatusesForStudents, type StudentProfileStatus } from '@/lib/profileStatus'
import { OrgPickerScreen, ParentPendingScreen } from './DashboardUI'
import DashboardClient from './DashboardClient'
import './dashboard.css'

// TODO: derive from academic_years.is_current once the year-management
// admin UI lands. Hardcoded for now; mirrored in
// app/dashboard/profiles/[studentId]/[season]/page.tsx.
const CURRENT_ACADEMIC_YEAR_LABEL = '2025-2026'
const CURRENT_SEASON: 'fall' | 'spring' = 'spring'

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

  const { data: schoolRow } = await supabaseAdmin
    .from('schools')
    .select('name, logo_url, pedagogical_schools')
    .eq('id', ctx.schoolId)
    .maybeSingle()

  const schoolName    = (schoolRow?.name     as string | undefined) ?? ''
  const schoolLogoUrl = (schoolRow?.logo_url as string | null | undefined) ?? null
  const pedagogicalSchools =
    (schoolRow?.pedagogical_schools as import('@/lib/types').PedagogicalSchool[] | null | undefined) ?? []

  // ── Profile status for the current term ───────────────────
  // Read-only resolution: if no academic_years row exists for this
  // label yet, every student renders as 'not_started'. We do NOT
  // create the row here — that's reserved for the POST flow.
  const academicYearId = await getAcademicYearId(ctx.schoolId, CURRENT_ACADEMIC_YEAR_LABEL).catch(() => null)
  const statusMap = await getProfileStatusesForStudents(
    students.map((s) => s.id),
    ctx.schoolId,
    CURRENT_SEASON,
    academicYearId,
  )
  const profileStatuses: Record<string, StudentProfileStatus> = Object.fromEntries(statusMap)

  return (
    <div className="db-page">
      <DashboardClient
        students={students}
        role={ctx.role}
        schoolName={schoolName}
        schoolLogoUrl={schoolLogoUrl}
        pedagogicalSchools={pedagogicalSchools}
        profileStatuses={profileStatuses}
      />
    </div>
  )
}
