// ============================================================
// app/api/dashboard/students/[studentId]/parent-uploads/[uploadId]/route.ts
//
// PATCH — update title, category, description (metadata only)
// DELETE — soft-delete (sets deleted_at)
//
// Auth: Clerk session, role admin or teacher.
// Verifies upload belongs to this student + school before any mutation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { validate, UpdateParentUploadSchema, ValidationError } from '@/lib/validation'
import type { UpdateParentUploadInput } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapParentUpload } from '@/lib/mappers'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

type RouteContext = { params: Promise<{ studentId: string; uploadId: string }> }

async function resolveAndAuthorize(uploadId: string, studentId: string, schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('parent_uploads')
    .select('id')
    .eq('id', uploadId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()
  return { found: !error && !!data }
}

async function getCtx(req: NextRequest) {
  void req
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return { ctx: null, res: authErrorResponse(err) }
    throw err
  }
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return { ctx: null, res: NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 }) }
  }
  return { ctx, res: null }
}

// ── PATCH ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { studentId, uploadId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'INVALID_BODY' }, { status: 400 })
  }

  let input: UpdateParentUploadInput
  try {
    input = validate(UpdateParentUploadSchema, body)
  } catch (err) {
    if (err instanceof ValidationError)
      return NextResponse.json({ error: err.message, code: 'VALIDATION_ERROR' }, { status: 400 })
    throw err
  }

  const { ctx, res } = await getCtx(req)
  if (!ctx) return res!
  if (!rateLimit(`${ctx.userId}:parent-uploads-update`, 30).ok) return rateLimitResponse()

  const { found } = await resolveAndAuthorize(uploadId, studentId, ctx.schoolId)
  if (!found)
    return NextResponse.json({ error: 'Upload not found.', code: 'NOT_FOUND' }, { status: 404 })

  const patch: Record<string, unknown> = { updated_by: ctx.userId, updated_at: new Date().toISOString() }
  if (input.title       !== undefined) patch.title       = input.title
  if (input.category    !== undefined) patch.category    = input.category
  if (input.description !== undefined) patch.description = input.description

  const { data, error: dbError } = await supabaseAdmin
    .from('parent_uploads')
    .update(patch)
    .eq('id', uploadId)
    .select()
    .single()

  if (dbError || !data) {
    console.error('[PATCH parent-uploads/:id]', dbError)
    return NextResponse.json({ error: 'Failed to update upload.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePortfolio(studentId)
  return NextResponse.json(mapParentUpload(data as Record<string, unknown>))
}

// ── DELETE (soft) ─────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { studentId, uploadId } = await params

  const { ctx, res } = await getCtx(req)
  if (!ctx) return res!
  if (!rateLimit(`${ctx.userId}:parent-uploads-delete`, 30).ok) return rateLimitResponse()

  const { found } = await resolveAndAuthorize(uploadId, studentId, ctx.schoolId)
  if (!found)
    return NextResponse.json({ error: 'Upload not found.', code: 'NOT_FOUND' }, { status: 404 })

  const { error: dbError } = await supabaseAdmin
    .from('parent_uploads')
    .update({ deleted_at: new Date().toISOString(), updated_by: ctx.userId })
    .eq('id', uploadId)

  if (dbError) {
    console.error('[DELETE parent-uploads/:id]', dbError)
    return NextResponse.json({ error: 'Failed to delete upload.', code: 'DB_ERROR' }, { status: 500 })
  }

  revalidatePortfolio(studentId)
  return new NextResponse(null, { status: 204 })
}
