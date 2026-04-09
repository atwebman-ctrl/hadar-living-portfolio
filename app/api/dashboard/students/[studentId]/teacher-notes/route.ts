// ============================================================
// app/api/dashboard/students/[studentId]/teacher-notes/route.ts
//
// POST /api/dashboard/students/[studentId]/teacher-notes
//   Add a teacher narrative note to a student's portfolio.
//
// Mapping:
//   noteText  → text
//   category  → section_type (e.g. 'academic_progress')
//   date      → created_at override (YYYY-MM-DD → timestamptz)
//   author_name resolved from the authenticated Clerk user
//
// Auth: Clerk session required. Role: admin or teacher.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateTeacherNoteBodySchema,
  type CreateTeacherNoteBodyInput,
  ValidationError,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapTeacherNote } from '@/lib/mappers'
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
  let input: CreateTeacherNoteBodyInput
  try {
    input = validate(CreateTeacherNoteBodySchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    throw err
  }

  // 3. Auth + role
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can add notes.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 4. Verify student belongs to this school
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  // 5. Resolve author name from Clerk
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(ctx.userId).catch(() => null)
  const authorName = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Teacher'
    : 'Teacher'

  // 6. Insert — school_id and student_id from server only
  const insertRow: Record<string, unknown> = {
    school_id:    ctx.schoolId,
    student_id:   studentId,
    section_type: input.category,
    author_name:  authorName,
    text:         input.noteText,
    created_by:   ctx.userId,
    updated_by:   ctx.userId,
  }

  // Override created_at with the submitted date when provided
  if (input.date) {
    insertRow.created_at = `${input.date}T00:00:00Z`
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('teacher_notes')
    .insert(insertRow)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/teacher-notes]', dbError)
    return NextResponse.json(
      { error: 'Failed to save note.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    mapTeacherNote(data as Record<string, unknown>),
    { status: 201 },
  )
}
