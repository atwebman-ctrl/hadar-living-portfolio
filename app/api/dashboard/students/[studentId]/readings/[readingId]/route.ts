// ============================================================
// app/api/dashboard/students/[studentId]/readings/[readingId]/route.ts
//
// PATCH — update a reading entry (all fields optional)
// DELETE — soft-delete (sets deleted_at; never hard-deletes)
//
// Auth: Clerk session, role admin or teacher.
// Verifies student + reading both belong to the authenticated school.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { validate, UpdateReadingSchema, ValidationError } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapReading } from '@/lib/mappers'
import { authErrorResponse } from '@/lib/apiHelpers'

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

  const { found } = await resolveAndAuthorize(studentId, readingId, ctx.schoolId)
  if (!found)
    return NextResponse.json({ error: 'Reading not found.', code: 'NOT_FOUND' }, { status: 404 })

  const { data, error: dbError } = await supabaseAdmin
    .from('readings')
    .update({
      ...(input.title        !== undefined && { title:                 input.title }),
      ...(input.author       !== undefined && { author:               input.author }),
      ...(input.academicYear !== undefined && { academic_year:        input.academicYear }),
      ...(input.completed    !== undefined && { completed:            input.completed }),
      ...(input.whyChosen    !== undefined && { why_chosen:           input.whyChosen }),
      ...(input.valuesSkills !== undefined && { values_skills:        input.valuesSkills }),
      ...(input.pageCount    !== undefined && { page_count:           input.pageCount }),
      ...(input.teacherNotes !== undefined && { teacher_notes:        input.teacherNotes }),
      ...(input.readingDifficulty    !== undefined && { reading_difficulty:    input.readingDifficulty }),
      ...(input.studentRating        !== undefined && { student_rating:        input.studentRating }),
      ...(input.dateStarted          !== undefined && { date_started:          input.dateStarted }),
      ...(input.dateFinished         !== undefined && { date_finished:         input.dateFinished }),
      ...(input.keyQuote             !== undefined && { key_quote:             input.keyQuote }),
      ...(input.curriculumConnection !== undefined && { curriculum_connection: input.curriculumConnection }),
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', readingId)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[PATCH readings/:id]', dbError)
    return NextResponse.json({ error: 'Failed to update reading.', code: 'DB_ERROR' }, { status: 500 })
  }

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

  return new NextResponse(null, { status: 204 })
}
