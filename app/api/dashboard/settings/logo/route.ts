// ============================================================
// app/api/dashboard/settings/logo/route.ts
//
// POST /api/dashboard/settings/logo
//
// Accepts multipart form data with an image file, uploads it to
// the portfolio-assets Supabase storage bucket under
// `{school_id}/logo.{ext}`, writes the resulting public URL to
// `schools.logo_url`, and busts every cached portfolio in the
// school so the new branding shows up on next render.
//
// Auth: admin role only. Teachers and parents get 403.
// school_id is always derived server-side from the Clerk org.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidateSchool } from '@/lib/revalidate'

const BUCKET         = 'portfolio-assets'
const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_EXTS   = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'] as const

export async function POST(req: NextRequest) {
  // 1. Auth
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  // 2. Role gate — admins only
  if (ctx.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only administrators can update the school logo.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 3. Rate limit — logo uploads are infrequent
  if (!rateLimit(`${ctx.userId}:logo-upload`, 5).ok) return rateLimitResponse()

  // 4. Parse multipart form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data.', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  // 5. Validate file
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'A non-empty image file is required.', code: 'MISSING_FILE' },
      { status: 400 },
    )
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Logo must be an image file.', code: 'INVALID_TYPE' },
      { status: 400 },
    )
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { error: 'Logo exceeds the 2 MB limit.', code: 'FILE_TOO_LARGE' },
      { status: 413 },
    )
  }

  // 6. Build storage path. Normalise extension so upsert works and
  //    we never land on something weird like `logo.JPEG`.
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  const ext    = (ALLOWED_EXTS as readonly string[]).includes(rawExt) ? rawExt : 'png'
  const path   = `${ctx.schoolId}/logo.${ext}`

  // 7. Upload first (upsert so a same-extension re-upload replaces cleanly).
  //    We keep any prior logo files in place until both the upload and the
  //    DB write succeed — otherwise a failed upload would leave the school
  //    with no logo at all.
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: storageErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })
  if (storageErr) {
    return NextResponse.json(
      { error: 'Logo upload failed.', code: 'STORAGE_ERROR' },
      { status: 502 },
    )
  }

  // 8. Derive public URL and cache-bust so browsers don't hold an
  //    old image keyed to the same path.
  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

  // 9. Persist on the school row
  const { error: dbErr } = await supabaseAdmin
    .from('schools')
    .update({ logo_url: logoUrl })
    .eq('id', ctx.schoolId)
  if (dbErr) {
    return NextResponse.json(
      { error: 'Failed to update school record.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  // 10. Now that the new logo is committed in both Storage and the DB, clean
  //     up any prior logo files with a different extension. Failure here is
  //     non-fatal — the new logo is already serving; an orphan file is a
  //     storage-cost issue, not a correctness issue.
  try {
    const { data: existing } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(ctx.schoolId, { limit: 100 })
    const stale = (existing ?? [])
      .filter((f) => f.name.startsWith('logo.') && f.name !== `logo.${ext}`)
      .map((f) => `${ctx.schoolId}/${f.name}`)
    if (stale.length > 0) {
      await supabaseAdmin.storage.from(BUCKET).remove(stale)
    }
  } catch {
    // ignore — orphan cleanup is a best-effort follow-up
  }

  // 11. Revalidate every portfolio in this school
  revalidateSchool(ctx.schoolId)

  return NextResponse.json({ logoUrl }, { status: 200 })
}
