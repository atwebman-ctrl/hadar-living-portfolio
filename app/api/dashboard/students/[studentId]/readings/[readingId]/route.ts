// ============================================================
// app/api/dashboard/students/[studentId]/readings/[readingId]/route.ts
//
// PATCH — update a reading entry (all fields optional)
// DELETE — soft-delete (sets deleted_at; never hard-deletes)
// Currently no UI caller; reserved for future remove-book admin action.
//
// Auth: Clerk session, role admin or teacher.
// Verifies student + reading both belong to the authenticated school.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { validate, UpdateReadingSchema, ValidationError } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapReading } from '@/lib/mappers'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

type RouteContext = { params: Promise<{ studentId: string; readingId: string }> }

async function resolveAndAuthorize(studentId: string, readingId: string, schoolId: string) {
  // Confirm reading belongs to this student + school and is not deleted
  const { data, error } = await supabaseAdmin
    .from('readings')
    .select('id')
    .eq('id', readingId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()
  return { found: !error && !!data }
}

// ── PATCH ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { studentId, readingId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  let input: import('@/lib/validation').UpdateReadingInput
  try {
    input = validate(UpdateReadingSchema, body)
  } catch (err) {
    if (err instanceof ValidationError)
      return NextResponse.json({ error: err.message, code: 'VALIDATION_ERROR' }, { status: 400 })
    throw err
  }

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })

  if (!rateLimit(`${ctx.userId}:readings-update`, 30).ok) return rateLimitResponse()

  const { found } = await resolveAndAuthorize(studentId, readingId, ctx.schoolId)
  if (!found)
    return NextResponse.json({ error: 'Reading not found.', code: 'NOT_FOUND' }, { status: 404 })

  const { data, error: dbError } = await supabaseAdmin
    .from('readings')
    .update({
      title:                 input.title                 ?? undefined,
      author:                input.author                ?? null,
      academic_year:         input.academicYear          ?? undefined,
      completed:             input.completed             ?? undefined,
      why_chosen:            input.whyChosen             ?? null,
      values_skills:         input.valuesSkills          ?? null,
      page_count:            input.pageCount             ?? null,
      teacher_notes:         input.teacherNotes          ?? null,
      reading_difficulty:    input.readingDifficulty     ?? null,
      student_rating:        input.studentRating         ?? null,
      date_started:          input.dateStarted           ?? null,
      date_finished:         input.dateFinished          ?? null,
      key_quote:             input.keyQuote              ?? null,
      curriculum_connection: input.curriculumConnection  ?? null,
      updated_by:            ctx.userId,
      updated_at:            new Date().toISOString(),
    })
    .eq('id', readingId)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[PATCH readings/:id]', dbError)
    return NextResponse.json({ error: 'Failed to update reading.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePortfolio(studentId)
  return NextResponse.json(mapReading(data as Record<string, unknown>))
}

// ── DELETE (soft) ─────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { studentId, readingId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })

  if (!rateLimit(`${ctx.userId}:readings-delete`, 30).ok) return rateLimitResponse()

  const { found } = await resolveAndAuthorize(studentId, readingId, ctx.schoolId)
  if (!found)
    return NextResponse.json({ error: 'Reading not found.', code: 'NOT_FOUND' }, { status: 404 })

  const { error: dbError } = await supabaseAdmin
    .from('readings')
    .update({ deleted_at: new Date().toISOString(), updated_by: ctx.userId })
    .eq('id', readingId)

  if (dbError) {
    console.error('[DELETE readings/:id]', dbError)
    return NextResponse.json({ error: 'Failed to delete reading.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePortfolio(studentId)
  return new NextResponse(null, { status: 204 })
}
