// ============================================================
// app/api/dashboard/students/[studentId]/videos/route.ts
//
// POST /api/dashboard/students/[studentId]/videos
//   Upsert a YouTube/Vimeo/Drive video link for a student.
//   Idempotent on (student_id, category, term): if a row already
//   exists for that triple, it is UPDATED with the new fields;
//   otherwise a new row is INSERTed. This lets per-section
//   editors (e.g. Poetry Recitation) save a URL repeatedly
//   without creating duplicate rows.
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
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

type RouteContext = { params: Promise<{ studentId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

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

  if (!rateLimit(`${ctx.userId}:videos`, 30).ok) return rateLimitResponse()

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

  // Upsert by (student_id, category, term). The Poetry Recitation
  // editor saves the same triple repeatedly and must not duplicate.
  const { data: existing } = await supabaseAdmin
    .from('student_videos')
    .select('id')
    .eq('student_id', studentId)
    .eq('school_id',  ctx.schoolId)
    .eq('category',   input.category)
    .eq('term',       input.term)
    .is('deleted_at', null)
    .maybeSingle()

  let row: Record<string, unknown> | null = null
  let dbError: unknown = null

  if (existing?.id) {
    const r = await supabaseAdmin
      .from('student_videos')
      .update({
        title:              input.title,
        video_url:          input.videoUrl          ?? null,
        video_storage_path: input.videoStoragePath  ?? null,
        grade_level:        input.gradeLevel,
        updated_by:         ctx.userId,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    row = r.data as Record<string, unknown> | null
    dbError = r.error
  } else {
    const r = await supabaseAdmin
      .from('student_videos')
      .insert({
        school_id:          ctx.schoolId,
        student_id:         studentId,
        title:              input.title,
        video_url:          input.videoUrl          ?? null,
        video_storage_path: input.videoStoragePath  ?? null,
        grade_level:        input.gradeLevel,
        term:               input.term,
        category:           input.category,
        created_by:         ctx.userId,
        updated_by:         ctx.userId,
      })
      .select()
      .single()
    row = r.data as Record<string, unknown> | null
    dbError = r.error
  }

  if (dbError || !row) {
    console.error('[POST /api/dashboard/students/:id/videos]', dbError)
    return NextResponse.json(
      { error: 'Failed to save video.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  revalidatePortfolio(studentId)
  return NextResponse.json(
    mapStudentVideo(row),
    { status: existing?.id ? 200 : 201 },
  )
}
