// ============================================================
// app/api/dashboard/students/[studentId]/writing-samples/route.ts
//
// POST /api/dashboard/students/[studentId]/writing-samples
//   Add a writing sample via the inline Composition form.
//
// Body fields (0009 columns):
//   title, genre, excerpt (optional), teacherComments (optional),
//   term, academicYear
//
// Server-side: language defaults to 'english'; grade_level is
// looked up from the student record so the form doesn't need it.
// school_id and student_id are always taken from auth/URL.
//
// Auth: Clerk session required. Role: admin or teacher.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateWritingSampleBodySchema,
  type CreateWritingSampleBodyInput,
  ValidationError,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

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
  let input: CreateWritingSampleBodyInput
  try {
    input = validate(CreateWritingSampleBodySchema, body)
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
      { error: 'Only admins and teachers can add writing samples.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  if (!rateLimit(`${ctx.userId}:writing-samples`, 30).ok) return rateLimitResponse()

  // 4. Verify student belongs to this school + fetch grade_level
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, grade_level')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  // 5. Insert — server-only fields: school_id, student_id, language, grade_level
  const { data, error: dbError } = await supabaseAdmin
    .from('writing_samples')
    .insert({
      school_id:        ctx.schoolId,
      student_id:       studentId,
      language:         'english',
      grade_level:      (student as { grade_level: string }).grade_level,
      title:            input.title,
      genre:            input.genre,
      excerpt:          input.excerpt ?? null,
      teacher_comments: input.teacherComments ?? null,
      term:             input.term,
      academic_year:    input.academicYear,
      created_by:       ctx.userId,
      updated_by:       ctx.userId,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/writing-samples]', dbError)
    return NextResponse.json(
      { error: 'Failed to save writing sample.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  revalidatePortfolio(studentId)
  return NextResponse.json(data, { status: 201 })
}
