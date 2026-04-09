// ============================================================
// app/api/dashboard/students/[studentId]/videos/route.ts
//
// POST /api/dashboard/students/[studentId]/videos
//   Add a YouTube/Vimeo video link to a student's portfolio.
//
// Auth: Clerk session required. Role: admin or teacher.
// school_id derived server-side — never from client input.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateStudentVideoBodySchema,
  type CreateStudentVideoBodyInput,
  ValidationError,
} from '@/lib/validationExtended'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStudentVideo } from '@/lib/mappers'
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

  // 2. Validate body
  let input: CreateStudentVideoBodyInput
  try {
    input = validate(CreateStudentVideoBodySchema, body)
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
      { error: 'Only admins and teachers can add videos.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 4. Verify student belongs to the authenticated school
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

  // 5. Insert — school_id and student_id from server only
  const { data, error: dbError } = await supabaseAdmin
    .from('student_videos')
    .insert({
      school_id:   ctx.schoolId,
      student_id:  studentId,
      title:       input.title,
      video_url:   input.videoUrl,
      grade_level: input.gradeLevel,
      term:        input.term,
      category:    input.category,
      created_by:  ctx.userId,
      updated_by:  ctx.userId,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/videos]', dbError)
    return NextResponse.json(
      { error: 'Failed to save video.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    mapStudentVideo(data as Record<string, unknown>),
    { status: 201 },
  )
}
