// ============================================================
// app/api/dashboard/profiles/route.ts
//
// POST /api/dashboard/profiles
//   Create a new Learning Profile for a student/season pair.
//   Status starts at 'draft'. The 9 required sections are
//   pre-seeded as 'not_started' rows.
//
// Auth: Clerk session required. Role: admin or teacher.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateProfileBodySchema,
  type CreateProfileBodyInput,
  ValidationError,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapProfile } from '@/lib/mappers'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { getOrCreateAcademicYearId } from '@/lib/academicYears'
import { REQUIRED_SECTION_KINDS } from '@/lib/types/profileBuilder'

export async function POST(req: NextRequest) {
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
  let input: CreateProfileBodyInput
  try {
    input = validate(CreateProfileBodySchema, body)
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
      { error: 'Only admins and teachers can create profiles.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 4. Rate limit — 20 per minute per user
  if (!rateLimit(`${ctx.userId}:profile-create`, 20).ok) return rateLimitResponse()

  // 5. Verify the student belongs to this school
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', input.studentId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (studentError) {
    console.error('[POST /api/dashboard/profiles] student lookup', studentError)
    return NextResponse.json(
      { error: 'Failed to verify student.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }
  if (!student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  // 6. Resolve academic_year_id (create-on-miss is intentional)
  let academicYearId: string
  try {
    academicYearId = await getOrCreateAcademicYearId(ctx.schoolId, input.academicYearLabel)
  } catch (err) {
    console.error('[POST /api/dashboard/profiles] academic year resolve', err)
    return NextResponse.json(
      { error: 'Failed to resolve academic year.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  // 7. Conflict check — one profile per (student, season, academic_year)
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('season', input.season)
    .eq('academic_year_id', academicYearId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existingError) {
    console.error('[POST /api/dashboard/profiles] conflict check', existingError)
    return NextResponse.json(
      { error: 'Failed to check for existing profile.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }
  if (existing) {
    return NextResponse.json(
      { error: 'Profile already exists for this student/season', code: 'CONFLICT' },
      { status: 409 },
    )
  }

  // 8. Compose term + insert profile
  const term = `${input.season === 'fall' ? 'Fall' : 'Spring'} ${input.academicYearLabel}`

  const { data: profileRow, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      school_id:        ctx.schoolId,
      student_id:       input.studentId,
      academic_year_id: academicYearId,
      term,
      season:           input.season,
      status:           'draft',
      drafted_by:       ctx.userId,
      created_by:       ctx.userId,
      updated_by:       ctx.userId,
    })
    .select()
    .single()

  if (insertError || !profileRow) {
    console.error('[POST /api/dashboard/profiles] profile insert', insertError)
    return NextResponse.json(
      { error: 'Failed to create profile.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  // 9. Insert the required section rows in a single batch.
  // 'scripture' is a placeholder kind — seeded as 'complete' so it
  // renders a "coming soon" card in both the workspace and the
  // published report without blocking submit-for-review. Teachers do
  // not need to author it until the real Scripture wiring lands.
  const sectionRows = REQUIRED_SECTION_KINDS.map((kind, idx) => ({
    profile_id:    profileRow.id as string,
    school_id:     ctx.schoolId,
    section_kind:  kind,
    section_order: idx,
    is_required:   true,
    status:        (kind === 'scripture' ? 'complete' : 'not_started') as 'complete' | 'not_started',
    created_by:    ctx.userId,
    updated_by:    ctx.userId,
  }))

  const { error: sectionsError } = await supabaseAdmin
    .from('profile_sections')
    .insert(sectionRows)

  if (sectionsError) {
    console.error('[POST /api/dashboard/profiles] sections insert', sectionsError)
    return NextResponse.json(
      { error: 'Failed to seed profile sections.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  // 10. Revalidate the overview page
  revalidatePath(`/dashboard/profiles/${input.studentId}/${input.season}`)

  return NextResponse.json(
    { profile: mapProfile(profileRow as Parameters<typeof mapProfile>[0]) },
    { status: 201 },
  )
}
