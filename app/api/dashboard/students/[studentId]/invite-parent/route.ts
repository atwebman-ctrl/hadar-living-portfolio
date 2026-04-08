// ============================================================
// app/api/dashboard/students/[studentId]/invite-parent/route.ts
//
// POST /api/dashboard/students/[studentId]/invite-parent
//
// Invites a parent by email to view a specific student's portfolio.
//
// Steps:
//   1. Validate { email } body.
//   2. Auth: admin or teacher only.
//   3. Derive orgId from Clerk session (for invitation API call).
//   4. Verify the student belongs to this school.
//   5. Insert a pending row into parent_students.
//      Unique constraint (school_id, student_id, invited_email)
//      prevents duplicates — returns 409 if already invited.
//   6. Call Clerk's createOrganizationInvitation to email the parent.
//   7. Return { status: 'invited', email }.
//
// Auth: Clerk session required. Role: admin or teacher.
// school_id and orgId are derived server-side — never from the request.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  validate,
  InviteParentSchema,
  ValidationError,
  type InviteParentInput,
} from '@/lib/validationExtended'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  // 1. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  // 2. Validate
  let input: InviteParentInput
  try {
    input = validate(InviteParentSchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    throw err
  }

  // 3. Auth — admin or teacher only
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can invite parents.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 4. Get Clerk orgId (needed for the invitation API call)
  const { orgId } = await auth()
  if (!orgId) {
    return NextResponse.json(
      { error: 'No active organization.', code: 'NO_ORG' },
      { status: 403 },
    )
  }

  // 5. Verify student belongs to this school
  const { data: student, error: stuErr } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (stuErr || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  // 6. Insert pending invitation row
  const { error: insertErr } = await supabaseAdmin
    .from('parent_students')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    studentId,
      invited_email: input.email.toLowerCase(),
      status:        'pending',
    })

  if (insertErr) {
    // Unique constraint violation — parent already invited for this student
    if (insertErr.code === '23505') {
      return NextResponse.json(
        { error: 'This email has already been invited for this student.', code: 'ALREADY_INVITED' },
        { status: 409 },
      )
    }
    console.error('[POST invite-parent] DB insert error:', insertErr)
    return NextResponse.json(
      { error: 'Failed to create invitation record.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  // 7. Send Clerk org invitation
  // Role key must match a custom role created in the Clerk Dashboard.
  // Custom roles are always prefixed with org: (e.g. org:parent).
  // orgId is the Clerk org ID (org_xxx) from the session JWT — not the DB UUID.
  console.log('[POST invite-parent] Clerk orgId:', orgId, 'inviterUserId:', ctx.userId)
  try {
    const clerk = await clerkClient()
    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress:   input.email.toLowerCase(),
      role:           'org:parent',
      inviterUserId:  ctx.userId,
    })
  } catch (err) {
    const clerkErr = err as Record<string, unknown>
    console.error('[POST invite-parent] Clerk invitation error (full):', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    if (clerkErr.errors) console.error('[POST invite-parent] Clerk errors array:', JSON.stringify(clerkErr.errors))
    // The DB row was inserted. The admin can retry sending the invite
    // without triggering a duplicate; Clerk's failure is logged only.
    return NextResponse.json(
      { error: 'Invitation record saved, but email delivery failed. Please retry.', code: 'CLERK_ERROR' },
      { status: 502 },
    )
  }

  return NextResponse.json(
    { status: 'invited', email: input.email.toLowerCase() },
    { status: 201 },
  )
}
