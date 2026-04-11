// ============================================================
// app/api/dashboard/students/route.ts
//
// GET  /api/dashboard/students — List all students for the school.
// POST /api/dashboard/students — Create a new student record.
//
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived from the Clerk org — never from the request.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateStudentSchema,
  ValidationError,
  type CreateStudentInput,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudent } from '@/lib/mappers'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'

// ── GET /api/dashboard/students ───────────────────────────────────────────────

export async function GET(_req: NextRequest) {
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
      { error: 'Only admins and teachers can list students.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // Fetch all non-archived students scoped to the authenticated school
  const { data, error: dbError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (dbError) {
    console.error('[GET /api/dashboard/students]', dbError)
    return NextResponse.json(
      { error: 'Failed to fetch students.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    (data ?? []).map((row) => mapStudent(row as Record<string, unknown>))
  )
}

// ── POST /api/dashboard/students ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  // 2. Validate — school_id is never accepted from the client
  let input: CreateStudentInput
  try {
    input = validate(CreateStudentSchema, body)
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
      { error: 'Only admins and teachers can create students.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (!rateLimit(`${ctx.userId}:students-create`, 30).ok) return rateLimitResponse()

  // 4. Insert — school_id from auth; is_demo always false via API.
  // profile_photo_path and summary are set later via PATCH (edit student form),
  // so we omit them here. This keeps the INSERT compatible with production tables
  // that may not yet have those columns (migrations 0011/0019 may not be applied).
  const insertPayload = {
    school_id:         ctx.schoolId,
    first_name:        input.firstName,
    last_name:         input.lastName,
    grade_level:       input.gradeLevel,
    academic_year:     input.academicYear,
    parent_user_ids:   input.parentUserIds ?? [],
    is_demo:           false,
    gender:            input.gender ?? null,
    date_of_birth:     input.dateOfBirth ?? null,
    enrollment_status: input.enrollmentStatus ?? 'active',
    updated_at:        new Date().toISOString(),
  }

  console.log('[POST /api/dashboard/students] inserting:', JSON.stringify(insertPayload))

  const { data, error: dbError } = await supabaseAdmin
    .from('students')
    .insert(insertPayload)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students] DB error:', JSON.stringify(dbError))
    console.error('[POST /api/dashboard/students] error code:', dbError?.code)
    console.error('[POST /api/dashboard/students] error message:', dbError?.message)
    console.error('[POST /api/dashboard/students] error details:', dbError?.details)
    return NextResponse.json(
      { error: 'Failed to create student record.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    mapStudent(data as Record<string, unknown>),
    { status: 201 }
  )
}
