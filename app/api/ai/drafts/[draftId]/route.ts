// ============================================================
// app/api/ai/drafts/[draftId]/route.ts
//
// PATCH /api/ai/drafts/[draftId]
//
// Allows an admin or teacher to accept, edit, or reject an
// AI-generated draft stored in ai_drafts.
//
// Request body: { contentFinal: string, status: 'accepted' | 'rejected' }
//   - 'accepted': contentFinal is stored as-is from the AI draft
//     (or overridden by the teacher's edited text).
//   - 'rejected': contentFinal is still required (the UI passes the
//     original draft text) but status is set to 'rejected'.
//
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived from the Clerk org — never from the request.
//
// UPDATE uses supabaseAdmin (service role). The authenticated UPDATE
// policy in 0003 requires school_id = current_school_id() which
// depends on a Clerk JWT claim; during development the service role
// is safer until the JWT hook is wired in Supabase dashboard.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  validate,
  UpdateAiDraftSchema,
  type UpdateAiDraftInput,
  ValidationError,
} from '@/lib/validation'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ draftId: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  // 1. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // 2. Validate
  let input: UpdateAiDraftInput
  try {
    input = validate(UpdateAiDraftSchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    throw err
  }

  // 3. Auth — admin or teacher only
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can review AI drafts.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // 4. Resolve draftId
  const { draftId } = await params

  // 5. Verify draft exists and belongs to this school
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('ai_drafts')
    .select('id, status')
    .eq('id', draftId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { error: 'Draft not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Guard: don't allow re-reviewing an already-resolved draft
  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: `Draft has already been ${existing.status}.`, code: 'ALREADY_RESOLVED' },
      { status: 409 }
    )
  }

  // 6. Apply the review
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('ai_drafts')
    .update({
      content_final: input.contentFinal,
      status:        input.status,
      reviewed_by:   ctx.userId,
      reviewed_at:   new Date().toISOString(),
    })
    .eq('id', draftId)
    .eq('school_id', ctx.schoolId)
    .select('id, status, reviewed_at')
    .single()

  if (updateErr || !updated) {
    console.error('[PATCH /api/ai/drafts/:id] DB update error:', updateErr)
    return NextResponse.json(
      { error: 'Failed to update draft.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    draftId:    updated.id,
    status:     updated.status,
    reviewedAt: updated.reviewed_at,
  })
}
