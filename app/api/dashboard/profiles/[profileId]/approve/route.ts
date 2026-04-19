// ============================================================
// POST /api/dashboard/profiles/[profileId]/approve
//
// Admin-only (Head of School). Approves an in_review profile:
// sets status='published', stamps published_at + reviewed_by +
// reviewed_at, clears review_feedback. Parent view at
// /portfolio/[studentId]/full/[profileId] becomes accessible.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapProfile } from '@/lib/mappers/profileBuilder'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ profileId: string }> }

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { profileId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })

  if (!rateLimit(`${ctx.userId}:profile-approve`, 30).ok) return rateLimitResponse()

  const { data: profileRow, error: loadError } = await supabaseAdmin
    .from('profiles')
    .select('id, status, student_id')
    .eq('id', profileId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (loadError) {
    console.error('[POST profiles/:id/approve] load', loadError)
    return NextResponse.json({ error: 'Failed to load profile.', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!profileRow)
    return NextResponse.json({ error: 'Profile not found.', code: 'NOT_FOUND' }, { status: 404 })

  if (profileRow.status !== 'in_review') {
    return NextResponse.json(
      {
        error: `Profile must be in review to approve (current status: ${profileRow.status}).`,
        code:  'INVALID_STATE',
      },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      status:          'published',
      published_at:    now,
      reviewed_by:     ctx.userId,
      reviewed_at:     now,
      review_feedback: null,
      updated_at:      now,
      updated_by:      ctx.userId,
    })
    .eq('id', profileId)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[POST profiles/:id/approve] update', updateError)
    return NextResponse.json({ error: 'Failed to approve profile.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/review-queue')
  revalidatePath(`/portfolio/${profileRow.student_id}/full`)

  return NextResponse.json({
    profile: mapProfile(updated as Parameters<typeof mapProfile>[0]),
  })
}
