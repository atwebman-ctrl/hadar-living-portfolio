// ============================================================
// app/api/dashboard/students/route.ts
//
// POST /api/dashboard/students — Create a new student record.
// GET  /api/dashboard/students — (Sprint 2, next session) List all
//   students for the authenticated school.
//
// Auth:     Clerk session required.
// Role:     admin or teacher.
// school_id is derived from the Clerk org — never from the request.
//
// Every API route in this codebase must:
//   1. Validate input with Zod
//   2. Derive school_id from Clerk (never from request body)
//   3. Check role authorisation
//   4. Filter/scope all queries by school_id
//   5. Return { error: string, code: string } on failure
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

// ── Shared auth-error helper ──────────────────────────────────────────────────
// Maps lib/auth.ts error prefixes to HTTP status codes and safe messages.

function authErrorResponse(err: Error): NextResponse {
  const msg = err.message
  if (msg.startsWith('AUTH_FORBIDDEN') || msg.startsWith('AUTH_INVALID_ROLE')) {
    return NextResponse.json(
      { error: 'You do not have permission to perform this action.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  // AUTH_UNAUTHENTICATED | AUTH_NO_ORG | AUTH_NO_SCHOOL
  return NextResponse.json(
    { error: 'Authentication required.', code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}

// ── POST /api/dashboard/students ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse body ───────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // ── 2. Validate — school_id is never accepted from the client ───────────────
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

  // ── 3. Auth + role check ────────────────────────────────────────────────────
  // getAuthContext() resolves userId, schoolId, and role in one Clerk call.
  // Declaring with definite assignment (!) — the catch block always
  // returns or re-throws, so ctx is guaranteed assigned past this block.
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

  // ── 4. Insert ───────────────────────────────────────────────────────────────
  // school_id comes from auth, never from the request body.
  // is_demo is always false — demo students are only created via seed.ts.
  const { data, error: dbError } = await supabaseAdmin
    .from('students')
    .insert({
      school_id:          ctx.schoolId,
      first_name:         input.firstName,
      last_name:          input.lastName,
      grade_level:        input.gradeLevel,
      academic_year:      input.academicYear,
      parent_user_ids:    input.parentUserIds,
      profile_photo_path: input.profilePhotoPath ?? null,
      summary:            input.summary ?? null,
      is_demo:            false,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students]', dbError)
    return NextResponse.json(
      { error: 'Failed to create student record.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  // ── 5. Return the created record mapped to camelCase ────────────────────────
  return NextResponse.json(
    mapStudent(data as Record<string, unknown>),
    { status: 201 }
  )
}
