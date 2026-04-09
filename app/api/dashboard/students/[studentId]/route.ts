// ============================================================
// app/api/dashboard/students/[studentId]/route.ts
//
// GET   /api/dashboard/students/[studentId] — Fetch one student.
// PATCH /api/dashboard/students/[studentId] — Update student fields.
//
// Auth: Clerk session required. Role: admin or teacher.
// Both handlers verify the student belongs to the authenticated
// school before reading or writing — never trust the URL param alone.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  UpdateStudentSchema,
  ValidationError,
  type UpdateStudentInput,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

// ── GET /api/dashboard/students/[studentId] ───────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  // Auth + role
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can view student records.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // Fetch student — eq on both id AND school_id enforces tenant isolation
  const { data, error: dbError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .single()

  if (dbError || !data) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json(mapStudent(data as Record<string, unknown>))
}

// ── DELETE /api/dashboard/students/[studentId] ────────────────────────────────
//
// Soft delete: sets archived_at to now. The student record is preserved;
// all dashboard queries filter on archived_at IS NULL to exclude it.
// Demo students cannot be archived via this API.

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  // Auth + role
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can archive students.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // Verify student belongs to the authenticated school and is not a demo student.
  const { data: student, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('id, is_demo')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .single()

  if (fetchError || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  if ((student as Record<string, unknown>).is_demo) {
    return NextResponse.json(
      { error: 'Demo students cannot be archived.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const { error: dbError } = await supabaseAdmin
    .from('students')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)

  if (dbError) {
    console.error('[DELETE /api/dashboard/students/:id]', dbError)
    return NextResponse.json(
      { error: 'Failed to archive student.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}

// ── PATCH /api/dashboard/students/[studentId] ─────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  // 1. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // 2. Validate — UpdateStudentSchema is a full partial of CreateStudentSchema
  let input: UpdateStudentInput
  try {
    input = validate(UpdateStudentSchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
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
      { error: 'Only admins and teachers can update students.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // 4. Build the update object — only include fields present in the body.
  // updated_at is set explicitly (no auto-update trigger in the DB schema).
  // is_demo is intentionally excluded — it is immutable via this API.
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.firstName !== undefined)        updates.first_name         = input.firstName
  if (input.lastName !== undefined)         updates.last_name          = input.lastName
  if (input.gradeLevel !== undefined)       updates.grade_level        = input.gradeLevel
  if (input.academicYear !== undefined)     updates.academic_year      = input.academicYear
  if (input.parentUserIds !== undefined)    updates.parent_user_ids    = input.parentUserIds
  if (input.profilePhotoPath !== undefined) updates.profile_photo_path = input.profilePhotoPath
  if (input.summary !== undefined)          updates.summary            = input.summary
  // 0011 profile fields
  if (input.gender !== undefined)           updates.gender             = input.gender
  if (input.dateOfBirth !== undefined)      updates.date_of_birth      = input.dateOfBirth
  if (input.enrollmentStatus !== undefined) updates.enrollment_status  = input.enrollmentStatus

  // 5. Update — scoped to both studentId AND school_id
  const { data, error: dbError } = await supabaseAdmin
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .select()
    .single()

  if (dbError || !data) {
    // If no row matched the id+school_id filter, Supabase returns no data
    if (!data) {
      return NextResponse.json(
        { error: 'Student not found.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    console.error('[PATCH /api/dashboard/students/:id]', dbError)
    return NextResponse.json(
      { error: 'Failed to update student record.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(mapStudent(data as Record<string, unknown>))
}
