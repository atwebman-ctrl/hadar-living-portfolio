// ============================================================
// app/api/dashboard/students/[studentId]/character-awards/route.ts
//
// POST /api/dashboard/students/[studentId]/character-awards
//   Add a character virtue award to a student.
//
// The simplified body (awardName, description, term, academicYear)
// is mapped server-side to the character_awards table columns:
//   virtue_english = virtue_transliteration = virtue_hebrew = awardName
//   award_date derived from term + academicYear
//
// Auth: Clerk session required. Role: admin or teacher.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateCharacterAwardBodySchema,
  type CreateCharacterAwardBodyInput,
  ValidationError,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapCharacterAward } from '@/lib/mappers'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

// ── Derive award_date from term + academicYear ────────────────
//
// "Fall 2025"   → 2025-09-01
// "Winter 2026" → 2026-01-01
// "Spring 2026" → 2026-04-01
// Anything else → first year of academicYear + -09-01 fallback

function deriveAwardDate(term: string, academicYear: string): string {
  const parts = term.trim().split(/\s+/)
  const season = parts[0]?.toLowerCase() ?? ''
  const termYear = parts[1] ?? ''

  const fallbackYear = academicYear.split('-')[0] ?? String(new Date().getFullYear())

  if (season === 'fall')   return `${termYear || fallbackYear}-09-01`
  if (season === 'winter') return `${termYear || fallbackYear}-01-01`
  if (season === 'spring') return `${termYear || fallbackYear}-04-01`
  return `${fallbackYear}-09-01`
}

// ── POST ──────────────────────────────────────────────────────

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
  let input: CreateCharacterAwardBodyInput
  try {
    input = validate(CreateCharacterAwardBodySchema, body)
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
      { error: 'Only admins and teachers can add character awards.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 4. Verify student belongs to this school
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
  const awardDate = deriveAwardDate(input.term, input.academicYear)

  const { data, error: dbError } = await supabaseAdmin
    .from('character_awards')
    .insert({
      school_id:             ctx.schoolId,
      student_id:            studentId,
      virtue_english:        input.awardName,
      virtue_transliteration: input.awardName,
      virtue_hebrew:         input.awardName,
      award_date:            awardDate,
      description:           input.description ?? null,
      created_by:            ctx.userId,
      updated_by:            ctx.userId,
    })
    .select()
    .single()

  if (dbError || !data) {
    console.error('[POST /api/dashboard/students/:id/character-awards]', dbError)
    return NextResponse.json(
      { error: 'Failed to save award.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    mapCharacterAward(data as Record<string, unknown>),
    { status: 201 },
  )
}
