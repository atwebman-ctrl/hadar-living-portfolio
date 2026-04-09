// ============================================================
// lib/portfolioAuth.ts
//
// Server-only helper. Enforces that a parent viewer can only
// access portfolios for their own children.
//
// Used by: /portfolio/[studentId], /portfolio/[studentId]/full,
//          /portfolio/[studentId]/section/[slug]
//
// DO NOT import this from client components.
// ============================================================

import { notFound } from 'next/navigation'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function enforceParentAccess(
  userId:    string,
  schoolId:  string,
  studentId: string,
): Promise<void> {
  // Resolve parent's primary email from Clerk
  const clerk     = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId).catch(() => null)
  const primaryEmail =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null

  // Match by Clerk user ID (returning parent) OR invited email (first visit)
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

  // First visit: link the Clerk user ID and activate the invitation
  if (!row.parent_clerk_user_id) {
    await supabaseAdmin
      .from('parent_students')
      .update({ parent_clerk_user_id: userId, status: 'active' })
      .eq('id', row.id)
  }
}
