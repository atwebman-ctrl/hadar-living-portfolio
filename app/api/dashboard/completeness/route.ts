import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'

export interface StudentCompleteness {
  mapMath:    number
  mapEnglish: number
  avant:      number
  readings:   number
  notes:      number
  writing:    number
  photos:     number
  awards:     number
}

export async function GET() {
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (!rateLimit(`${ctx.userId}:completeness`, 10).ok) return rateLimitResponse()

  const sid = ctx.schoolId
  const [assessments, readings, notes, writing, photos, awards] = await Promise.all([
    supabaseAdmin.from('assessments').select('student_id, assessment_type').eq('school_id', sid).is('deleted_at', null),
    supabaseAdmin.from('readings').select('student_id').eq('school_id', sid).is('deleted_at', null),
    supabaseAdmin.from('teacher_notes').select('student_id').eq('school_id', sid).is('deleted_at', null),
    supabaseAdmin.from('writing_samples').select('student_id').eq('school_id', sid).is('deleted_at', null),
    supabaseAdmin.from('photos').select('student_id').eq('school_id', sid),
    supabaseAdmin.from('character_awards').select('student_id').eq('school_id', sid).is('deleted_at', null),
  ])

  const result: Record<string, StudentCompleteness> = {}

  function ensure(id: string): StudentCompleteness {
    if (!result[id]) result[id] = { mapMath: 0, mapEnglish: 0, avant: 0, readings: 0, notes: 0, writing: 0, photos: 0, awards: 0 }
    return result[id]
  }

  for (const row of assessments.data ?? []) {
    const c = ensure(row.student_id)
    if (row.assessment_type === 'maps_math') c.mapMath++
    else if (row.assessment_type === 'maps_english') c.mapEnglish++
    else if ((row.assessment_type as string).startsWith('avant_')) c.avant++
  }
  for (const row of readings.data ?? []) ensure(row.student_id).readings++
  for (const row of notes.data ?? []) ensure(row.student_id).notes++
  for (const row of writing.data ?? []) ensure(row.student_id).writing++
  for (const row of photos.data ?? []) ensure(row.student_id).photos++
  for (const row of awards.data ?? []) ensure(row.student_id).awards++

  return NextResponse.json({ students: result }, { status: 200 })
}
