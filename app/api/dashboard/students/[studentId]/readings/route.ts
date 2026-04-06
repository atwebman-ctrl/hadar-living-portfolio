// ============================================================
// app/api/dashboard/students/[studentId]/readings/route.ts
//
// POST /api/dashboard/students/[studentId]/readings
//   Add a book to a student's reading list.
//
// Auth: Clerk session required. Role: admin or teacher.
// studentId comes from the URL — not the request body.
// The student must belong to the authenticated school.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { validate, CreateReadingSchema, ValidationError } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapReading } from '@/lib/mappers'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

// studentId comes from the URL, not the body
const ReadingBodySchema = CreateReadingSchema.omit({ studentId: true })
type ReadingBodyInput = Omit<import('@/lib/validation').CreateReadingInput, 'studentId'>

// ── POST /api/dashboard/students/[studentId]/readings ─────────────────────────

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

  // 2. Validate
  let input: ReadingBodyInput
  try {
    input = validate(ReadingBodySchema, body)
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
      { error: 'Only admins and teachers can add readings.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // 4. Verify the student belongs to the authenticated school.
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .single()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 5. Insert — school_id and student_id both from server, never client
  const { data, error: dbError } = await supabaseAdmin
    .from('readings')
    .insert({
      school_id:    ctx.schoolId,
      student_id:   studentId,
      title:        input.title,
      author:       input.author ?? null,
      academic_year: input.academicYear,
      completed:    input.completed,
      sort_order:   input.sortOrder,
      why_chosen:   input.whyChosen ?? null,
      values_skills: input.valuesSkills ?? null,
      page_count:   input.pageCount ?? null,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/readings]', dbError)
    return NextResponse.json(
      { error: 'Failed to add reading.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    mapReading(data as Record<string, unknown>),
    { status: 201 }
  )
}
