// ============================================================
// app/api/dashboard/assessments/bulk/route.ts
//
// POST /api/dashboard/assessments/bulk
//   Insert multiple assessment scores in one request.
//   Each entry is inserted individually — partial success is
//   accepted (better than all-or-nothing for bulk data entry).
//
// Auth: Clerk session required. Role: admin or teacher.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

const BulkAssessmentSchema = z.object({
  entries: z.array(z.object({
    studentId:      z.string().uuid(),
    assessmentType: z.enum([
      'maps_math', 'maps_english',
      'avant_reading', 'avant_listening', 'avant_writing', 'avant_speaking',
    ]),
    score:      z.number().nullable().optional(),
    percentile: z.number().min(0).max(100).nullable().optional(),
    ritScore:   z.number().nullable().optional(),
    term:       z.string().min(1),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  })).min(1).max(50),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  const parsed = BulkAssessmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed.', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (!rateLimit(`${ctx.userId}:bulk-assessments`, 5).ok) return rateLimitResponse()

  // Verify all referenced students belong to this school
  const studentIds = [...new Set(parsed.data.entries.map((e) => e.studentId))]
  const { data: validStudents } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('school_id', ctx.schoolId)
    .in('id', studentIds)

  const validSet = new Set((validStudents ?? []).map((s) => s.id))

  let inserted = 0
  const errors: string[] = []
  const revalidateIds = new Set<string>()

  for (const entry of parsed.data.entries) {
    if (!validSet.has(entry.studentId)) {
      errors.push(`Student ${entry.studentId} not found in this school.`)
      continue
    }

    const { error: dbError } = await supabaseAdmin
      .from('assessments')
      .insert({
        school_id:       ctx.schoolId,
        student_id:      entry.studentId,
        assessment_type: entry.assessmentType,
        score:           entry.score ?? null,
        percentile:      entry.percentile ?? null,
        rit_score:       entry.ritScore ?? null,
        term:            entry.term,
        academic_year:   entry.academicYear,
        created_by:      ctx.userId,
        updated_by:      ctx.userId,
      })

    if (dbError) {
      errors.push(`Failed for student ${entry.studentId}: ${dbError.message}`)
    } else {
      inserted++
      revalidateIds.add(entry.studentId)
    }
  }

  for (const id of revalidateIds) revalidatePortfolio(id)

  return NextResponse.json({ inserted, errors }, { status: 201 })
}
