// ============================================================
// POST /api/dashboard/profiles/[profileId]/submit
//
// Teacher/admin submits a draft profile for Dr. Worth's review.
// Enforces state + completeness:
//   - profile.status must be 'draft' (else 409 INVALID_STATE)
//   - every required section must be 'complete'
//     (else 409 INCOMPLETE_SECTIONS with a list of missing kinds)
//
// On success: status -> 'in_review', review_feedback cleared,
// updated_at/by refreshed. Revalidates dashboard + review queue.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapProfile } from '@/lib/mappers/profileBuilder'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import {
  REQUIRED_SECTION_KINDS,
  type ProfileSectionKind,
} from '@/lib/types/profileBuilder'

type RouteContext = { params: Promise<{ profileId: string }> }

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { profileId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher')
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })

  if (!rateLimit(`${ctx.userId}:profile-submit`, 10).ok) return rateLimitResponse()

  const { data: profileRow, error: loadError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (loadError) {
    console.error('[POST profiles/:id/submit] load', loadError)
    return NextResponse.json({ error: 'Failed to load profile.', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!profileRow)
    return NextResponse.json({ error: 'Profile not found.', code: 'NOT_FOUND' }, { status: 404 })

  if (profileRow.status !== 'draft') {
    return NextResponse.json(
      {
        error: `Profile must be in draft to submit (current status: ${profileRow.status}).`,
        code:  'INVALID_STATE',
      },
      { status: 409 },
    )
  }

  const { data: sectionRows, error: sectionError } = await supabaseAdmin
    .from('profile_sections')
    .select('section_kind, status, is_required')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  if (sectionError) {
    console.error('[POST profiles/:id/submit] sections', sectionError)
    return NextResponse.json({ error: 'Failed to load sections.', code: 'DB_ERROR' }, { status: 500 })
  }

  const completeByKind = new Map<string, boolean>()
  for (const s of sectionRows ?? []) {
    completeByKind.set(s.section_kind as string, s.status === 'complete')
  }
  const incomplete: ProfileSectionKind[] = REQUIRED_SECTION_KINDS.filter(
    (kind) => completeByKind.get(kind) !== true,
  )

  if (incomplete.length > 0) {
    return NextResponse.json(
      {
        error: `Cannot submit: ${incomplete.length} required section(s) are not complete.`,
        code:  'INCOMPLETE_SECTIONS',
        incomplete,
      },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      status:          'in_review',
      review_feedback: null,
      updated_at:      now,
      updated_by:      ctx.userId,
    })
    .eq('id', profileId)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[POST profiles/:id/submit] update', updateError)
    return NextResponse.json({ error: 'Failed to submit profile.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/review-queue')

  return NextResponse.json({
    profile: mapProfile(updated as Parameters<typeof mapProfile>[0]),
  })
}
