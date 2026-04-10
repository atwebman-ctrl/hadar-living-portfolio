// ============================================================
// app/api/dashboard/students/[studentId]/photos/[photoId]/route.ts
//
// PATCH — update caption, term, category
// DELETE — soft-delete (sets deleted_at)
//
// Auth: Clerk session, role admin or teacher.
// Verifies photo belongs to this student + school before mutation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string; photoId: string }> }

async function getStaffCtx(req: NextRequest) {
  void req
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return { ctx: null, res: authErrorResponse(err) }
    throw err
  }
  if (ctx.role !== 'admin' && ctx.role !== 'teacher')
    return { ctx: null, res: NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 }) }
  return { ctx, res: null }
}

async function verifyOwnership(photoId: string, studentId: string, schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()
  return !error && !!data
}

// ── PATCH ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { studentId, photoId } = await params
  const { ctx, res } = await getStaffCtx(req)
  if (!ctx) return res!

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  if (!await verifyOwnership(photoId, studentId, ctx.schoolId))
    return NextResponse.json({ error: 'Photo not found.', code: 'NOT_FOUND' }, { status: 404 })

  const patch: Record<string, unknown> = {
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  }
  if (body.caption  !== undefined) patch.caption  = body.caption
  if (body.term     !== undefined) patch.term     = body.term
  if (body.category !== undefined) patch.category = body.category

  const { data, error: dbErr } = await supabaseAdmin
    .from('photos')
    .update(patch)
    .eq('id', photoId)
    .select()
    .single()

  if (dbErr || !data) {
    console.error('[PATCH photos/:id]', dbErr)
    return NextResponse.json({ error: 'Failed to update photo.', code: 'DB_ERROR' }, { status: 500 })
  }
  return NextResponse.json(data)
}

// ── DELETE (soft) ─────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { studentId, photoId } = await params
  const { ctx, res } = await getStaffCtx(req)
  if (!ctx) return res!

  if (!await verifyOwnership(photoId, studentId, ctx.schoolId))
    return NextResponse.json({ error: 'Photo not found.', code: 'NOT_FOUND' }, { status: 404 })

  const { error: dbErr } = await supabaseAdmin
    .from('photos')
    .update({ deleted_at: new Date().toISOString(), updated_by: ctx.userId })
    .eq('id', photoId)

  if (dbErr) {
    console.error('[DELETE photos/:id]', dbErr)
    return NextResponse.json({ error: 'Failed to delete photo.', code: 'DB_ERROR' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
