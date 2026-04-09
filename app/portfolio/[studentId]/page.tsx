// ============================================================
// app/portfolio/[studentId]/page.tsx
//
// Server component. Verifies the viewer's Clerk session,
// derives school_id server-side from their Clerk org, fetches
// the full PortfolioData via getStudentPortfolio(), enforces
// parent access control, then renders the layout shell.
//
// Sprint 2: original 6 sections wired to typed PortfolioData slices.
// Sprint 3: 6 additional stub sections added below.
// ============================================================

// This page is always server-rendered on demand — never statically generated.
// Authenticated, personalized content cannot be pre-rendered at build time.
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
// Shared portfolio stylesheet — also consumed by /demo
import '../../demo/portfolio.css'

type Props = {
  params: Promise<{ studentId: string }>
}

export default async function PortfolioPage({ params }: Props) {
  const { studentId } = await params

  // Auth context is derived entirely server-side from the Clerk session.
  // school_id is never accepted from the client or from query params.
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())

  // getStudentPortfolio throws if the student doesn't exist or doesn't
  // belong to this school — map that to a 404.
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())

  // Parents may only view portfolios for their own children.
  // Admins and teachers have broad access within their school.
  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  const studentName = `${portfolio.student.firstName} ${portfolio.student.lastName}`

  return (
    <>
      <RevealObserver />
      <SideNav schoolName={portfolio.school.name} studentName={studentName} role={role} />
      <PortfolioClient portfolio={portfolio} studentId={studentId} role={role} />
    </>
  )
}

// ── Parent access guard ───────────────────────────────────────
//
// Replaces the legacy parentUserIds array check with the
// parent_students table, which supports the invite flow.
//
// Match logic (OR):
//   a) parent_clerk_user_id = userId  — returning parent
//   b) invited_email = primaryEmail   — first visit after invite
//
// On first match by email (parent_clerk_user_id is null), the row
// is updated to link the Clerk user ID and flip status to 'active'.
// This is idempotent: subsequent visits match via parent_clerk_user_id.
//
// Calls notFound() (throws) if no matching row exists.

async function enforceParentAccess(
  userId: string,
  schoolId: string,
  studentId: string,
): Promise<void> {
  // Resolve parent's primary email from Clerk
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId).catch(() => null)
  const primaryEmail =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null

  // Build OR filter: match by Clerk user ID or invited email
  const orParts = [`parent_clerk_user_id.eq.${userId}`]
  if (primaryEmail) orParts.push(`invited_email.eq.${primaryEmail.toLowerCase()}`)

  const { data: row } = await supabaseAdmin
    .from('parent_students')
    .select('id, parent_clerk_user_id')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .or(orParts.join(','))
    .limit(1)
    .maybeSingle()

  if (!row) notFound()

  // First visit: link the Clerk user ID to the pending invitation
  if (!row.parent_clerk_user_id) {
    await supabaseAdmin
      .from('parent_students')
      .update({ parent_clerk_user_id: userId, status: 'active' })
      .eq('id', row.id)
  }
}
