// ============================================================
// POST /api/dashboard/profiles/[profileId]/reset-demo
//
// Admin-only. Flips a published profile back to in_review for a
// demo student so the review queue can be re-run during a demo.
// Gated to students with is_demo=true; never exposed for real
// student data.
//
// Clears reviewer fields (published_at, reviewed_at, reviewed_by)
// and review_feedback so the next review starts clean.
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

  if (!rateLimit(`${ctx.userId}:profile-reset-demo`, 30).ok) return rateLimitResponse()

  const { data: profileRow, error: loadError } = await supabaseAdmin
    .from('profiles')
    .select('id, status, student_id')
    .eq('id', profileId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (loadError) {
    console.error('[POST profiles/:id/reset-demo] load', loadError)
    return NextResponse.json({ error: 'Failed to load profile.', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!profileRow)
    return NextResponse.json({ error: 'Profile not found.', code: 'NOT_FOUND' }, { status: 404 })

  if (profileRow.status !== 'published') {
    return NextResponse.json(
      {
        error: `Profile must be published to reset (current status: ${profileRow.status}).`,
        code:  'INVALID_STATE',
      },
      { status: 409 },
    )
  }

  // Demo-student gate — only ever flip profiles whose student is_demo=true.
  const { data: studentRow, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, is_demo')
    .eq('id', profileRow.student_id)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .maybeSingle()

  if (studentError) {
    console.error('[POST profiles/:id/reset-demo] student load', studentError)
    return NextResponse.json({ error: 'Failed to load student.', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!studentRow)
    return NextResponse.json({ error: 'Student not found.', code: 'NOT_FOUND' }, { status: 404 })

  if (studentRow.is_demo !== true) {
    return NextResponse.json(
      { error: 'Reset is only available for demo students.', code: 'NOT_DEMO' },
      { status: 403 },
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      status:          'in_review',
      published_at:    null,
      reviewed_at:     null,
      reviewed_by:     null,
      review_feedback: null,
      updated_at:      now,
      updated_by:      ctx.userId,
    })
    .eq('id', profileId)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[POST profiles/:id/reset-demo] update', updateError)
    return NextResponse.json({ error: 'Failed to reset profile.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/review-queue')
  revalidatePath(`/portfolio/${profileRow.student_id}/full`)

  return NextResponse.json({
    profile: mapProfile(updated as Parameters<typeof mapProfile>[0]),
  })
}
