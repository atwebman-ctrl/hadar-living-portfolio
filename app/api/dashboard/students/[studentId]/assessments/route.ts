// ============================================================
// app/api/dashboard/students/[studentId]/assessments/route.ts
//
// POST /api/dashboard/students/[studentId]/assessments
//   Add an assessment score to a student.
//
// Auth: Clerk session required. Role: admin or teacher.
// studentId comes from the URL — not the request body.
// The student must belong to the authenticated school (verified
// with a school_id check before inserting).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateAssessmentBodySchema,
  type CreateAssessmentBodyInput,
  ValidationError,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapAssessment } from '@/lib/mappers'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

// studentId is sourced from the URL, not the request body.
// CreateAssessmentBodySchema omits studentId and applies score-range superRefine.
type AssessmentBodyInput = CreateAssessmentBodyInput

// ── POST /api/dashboard/students/[studentId]/assessments ─────────────────────

export async function POST(req: NextRequest, { params }: RouteContext) {
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

  // 2. Validate body (studentId excluded — it comes from the URL)
  let input: AssessmentBodyInput
  try {
    input = validate(CreateAssessmentBodySchema, body)
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
      { error: 'Only admins and teachers can add assessments.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // 4. Verify the student belongs to the authenticated school.
  // This prevents a teacher at school A from inserting assessments
  // for a student at school B by guessing their UUID.
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 5. Insert assessment — school_id and student_id both from server, never client
  const { data, error: dbError } = await supabaseAdmin
    .from('assessments')
    .insert({
      school_id:      ctx.schoolId,
      student_id:     studentId,
      assessment_type: input.assessmentType,
      score:          input.score ?? null,
      percentile:     input.percentile ?? null,
      rit_score:      input.ritScore ?? null,
      lexile_value:   input.lexileValue ?? null,
      term:           input.term,
      academic_year:  input.academicYear,
      notes:          input.notes ?? null,
      created_by:     ctx.userId,
      updated_by:     ctx.userId,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/assessments]', dbError)
    return NextResponse.json(
      { error: 'Failed to create assessment.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    mapAssessment(data as Record<string, unknown>),
    { status: 201 }
  )
}
