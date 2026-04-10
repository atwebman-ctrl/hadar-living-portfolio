// ============================================================
// app/api/dashboard/students/[studentId]/class-readings/route.ts
//
// GET — returns all readings for every student in the same
//       grade_level and academic_year as the given student,
//       scoped to the authenticated school.
//
// Auth: Clerk session, any authenticated role.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  // 1. Fetch the target student — establishes grade_level + academic_year
  const { data: student, error: studentErr } = await supabaseAdmin
    .from('students')
    .select('grade_level, academic_year')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('archived_at', null)
    .single()

  if (studentErr || !student) {
    return NextResponse.json({ error: 'Student not found.', code: 'NOT_FOUND' }, { status: 404 })
  }

  const { grade_level, academic_year } = student as { grade_level: string; academic_year: string }

  // 2. All non-archived students at the same school in the same grade
  const { data: classmates, error: classmatesErr } = await supabaseAdmin
    .from('students')
    .select('id, first_name')
    .eq('school_id', ctx.schoolId)
    .eq('grade_level', grade_level)
    .is('archived_at', null)

  if (classmatesErr || !classmates?.length) {
    return NextResponse.json({
      gradeLevel: grade_level, academicYear: academic_year,
      studentCount: 0, readings: [],
    })
  }

  const classmateIds  = classmates.map((s) => s.id as string)
  const studentMap: Record<string, string> = Object.fromEntries(
    classmates.map((s) => [s.id as string, s.first_name as string])
  )

  // 3. Readings for those students in the matching academic_year
  const { data: rows, error: readingsErr } = await supabaseAdmin
    .from('readings')
    .select('id, student_id, title, author, completed, student_rating, academic_year')
    .eq('school_id', ctx.schoolId)
    .eq('academic_year', academic_year)
    .in('student_id', classmateIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (readingsErr) {
    console.error('[GET class-readings]', readingsErr)
    return NextResponse.json({ error: 'Failed to fetch readings.', code: 'DB_ERROR' }, { status: 500 })
  }

  const readings = (rows ?? []).map((r) => ({
    id:               r.id as string,
    studentId:        r.student_id as string,
    studentFirstName: studentMap[r.student_id as string] ?? 'Unknown',
    title:            r.title as string,
    author:           r.author as string | null,
    completed:        r.completed as boolean,
    studentRating:    r.student_rating as number | null,
    academicYear:     r.academic_year as string,
  }))

  return NextResponse.json({
    gradeLevel:   grade_level,
    academicYear: academic_year,
    studentCount: classmates.length,
    readings,
  })
}
