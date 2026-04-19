// ============================================================
// POST /api/dashboard/profiles/[profileId]/request-changes
//
// Admin-only. Returns an in_review profile to draft with reviewer
// feedback attached. The teacher sees the feedback on the profile
// overview until they re-submit (submit clears review_feedback).
//
// Body: { feedback: string (1..2000 chars) }
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapProfile } from '@/lib/mappers/profileBuilder'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import {
  validate,
  RequestProfileChangesBodySchema,
  ValidationError,
  type RequestProfileChangesBodyInput,
} from '@/lib/validation'

type RouteContext = { params: Promise<{ profileId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { profileId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  let input: RequestProfileChangesBodyInput
  try {
    input = validate(RequestProfileChangesBodySchema, body)
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

  if (ctx.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })

  if (!rateLimit(`${ctx.userId}:profile-request-changes`, 30).ok) return rateLimitResponse()

  const { data: profileRow, error: loadError } = await supabaseAdmin
    .from('profiles')
    .select('id, status')
    .eq('id', profileId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (loadError) {
    console.error('[POST profiles/:id/request-changes] load', loadError)
    return NextResponse.json({ error: 'Failed to load profile.', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!profileRow)
    return NextResponse.json({ error: 'Profile not found.', code: 'NOT_FOUND' }, { status: 404 })

  if (profileRow.status !== 'in_review') {
    return NextResponse.json(
      {
        error: `Profile must be in review to request changes (current status: ${profileRow.status}).`,
        code:  'INVALID_STATE',
      },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      status:          'draft',
      reviewed_by:     ctx.userId,
      reviewed_at:     now,
      review_feedback: input.feedback,
      updated_at:      now,
      updated_by:      ctx.userId,
    })
    .eq('id', profileId)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[POST profiles/:id/request-changes] update', updateError)
    return NextResponse.json({ error: 'Failed to request changes.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/review-queue')

  return NextResponse.json({
    profile: mapProfile(updated as Parameters<typeof mapProfile>[0]),
  })
}
