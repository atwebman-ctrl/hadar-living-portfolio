// ============================================================
// app/api/dashboard/profiles/[profileId]/sections/[sectionId]/route.ts
//
// PATCH — update a profile section's narrative text, narrative
// draft, and/or status. Mirrors the readings PATCH pattern.
//
// Auth: Clerk session, role admin or teacher.
// Verifies the section belongs to the given profile + school
// (via JOIN to profiles) and is not soft-deleted.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  UpdateProfileSectionBodySchema,
  ValidationError,
  type UpdateProfileSectionBodyInput,
} from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapProfileSection } from '@/lib/mappers/profileBuilder'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ profileId: string; sectionId: string }> }

interface AuthorizedSection {
  studentId: string
  season:    string
}

async function resolveAndAuthorize(
  profileId: string,
  sectionId: string,
  schoolId:  string,
): Promise<{ found: true; ctx: AuthorizedSection } | { found: false }> {
  const { data, error } = await supabaseAdmin
    .from('profile_sections')
    .select('id, profile_id, school_id, profiles!inner(student_id, season, school_id, deleted_at)')
    .eq('id', sectionId)
    .eq('profile_id', profileId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return { found: false }

  const profileJoin = data.profiles as unknown as {
    student_id: string
    season:     string
    school_id:  string
    deleted_at: string | null
  } | null

  if (
    !profileJoin ||
    profileJoin.school_id !== schoolId ||
    profileJoin.deleted_at !== null
  ) {
    return { found: false }
  }

  return {
    found: true,
    ctx:   { studentId: profileJoin.student_id, season: profileJoin.season },
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { profileId, sectionId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  let input: UpdateProfileSectionBodyInput
  try {
    input = validate(UpdateProfileSectionBodySchema, body)
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

  if (!rateLimit(`${ctx.userId}:profile-sections-update`, 30).ok) return rateLimitResponse()

  const resolved = await resolveAndAuthorize(profileId, sectionId, ctx.schoolId)
  if (!resolved.found)
    return NextResponse.json({ error: 'Section not found.', code: 'NOT_FOUND' }, { status: 404 })

  const updateRow: Record<string, unknown> = {
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  }
  if (input.narrativeText  !== undefined) updateRow.narrative_text  = input.narrativeText
  if (input.narrativeDraft !== undefined) updateRow.narrative_draft = input.narrativeDraft
  if (input.status         !== undefined) updateRow.status          = input.status

  const { data, error: dbError } = await supabaseAdmin
    .from('profile_sections')
    .update(updateRow)
    .eq('id', sectionId)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[PATCH profile_sections/:id]', dbError)
    return NextResponse.json({ error: 'Failed to update section.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePath(`/dashboard/profiles/${resolved.ctx.studentId}/${resolved.ctx.season}`)
  return NextResponse.json(mapProfileSection(data as Parameters<typeof mapProfileSection>[0]))
}
