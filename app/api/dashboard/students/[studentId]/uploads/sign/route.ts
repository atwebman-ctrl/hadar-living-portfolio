// ============================================================
// app/api/dashboard/students/[studentId]/uploads/sign/route.ts
//
// POST /api/dashboard/students/[studentId]/uploads/sign
//
// Issues a signed upload URL so the client can PUT a file directly
// to Supabase storage, bypassing Vercel's ~4.5 MB serverless body
// cap. Companion to /finalize, which inserts the DB row after the
// upload completes.
//
// Body: { uploadType, filename, mime, size }
// Returns: { token, path, signedUrl }
//
// Auth/role gate matches the legacy /uploads route. school_id is
// derived server-side; ownership for parents is checked against
// students.parent_user_ids.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, dbErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import {
  MAX_FILE_BYTES,
  MIME_ALLOWLIST,
  STORAGE_BUCKET,
  TYPE_LABEL,
  buildStoragePath,
  type UploadType,
} from '@/lib/uploadValidation'

type RouteContext = { params: Promise<{ studentId: string }> }

const ALLOWED_TYPES = ['photo', 'handwriting', 'parent_upload'] as const

interface SignBody {
  uploadType: UploadType
  filename:   string
  mime:       string
  size:       number
}

function badRequest(error: string, code: string): NextResponse {
  return NextResponse.json({ error, code }, { status: 400 })
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  // 1. Auth
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  // 2. Rate limit (matches legacy /uploads at 10/min)
  if (!rateLimit(`${ctx.userId}:uploads`, 10).ok) return rateLimitResponse()

  // 3. Parse + shape-check body
  let body: SignBody
  try {
    body = await req.json() as SignBody
  } catch {
    return badRequest('Body must be valid JSON.', 'INVALID_BODY')
  }
  const { uploadType, filename, mime, size } = body
  if (!uploadType || !(ALLOWED_TYPES as readonly string[]).includes(uploadType)) {
    return badRequest(`uploadType must be one of: ${ALLOWED_TYPES.join(', ')}.`, 'INVALID_TYPE')
  }
  if (typeof filename !== 'string' || !filename.trim()) {
    return badRequest('filename is required.', 'INVALID_FILENAME')
  }
  if (typeof mime !== 'string' || !mime) {
    return badRequest('mime is required.', 'INVALID_MIME')
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return badRequest('size must be a positive number.', 'INVALID_SIZE')
  }

  // 4. MIME + size gates
  if (!MIME_ALLOWLIST[uploadType].test(mime)) {
    return badRequest(
      `File type not allowed. Please choose ${TYPE_LABEL[uploadType]} file.`,
      'INVALID_MIME',
    )
  }
  if (size > MAX_FILE_BYTES[uploadType]) {
    const maxMB = Math.round(MAX_FILE_BYTES[uploadType] / (1024 * 1024))
    return NextResponse.json(
      { error: `File exceeds the ${maxMB} MB limit for ${uploadType}.`, code: 'FILE_TOO_LARGE' },
      { status: 413 },
    )
  }

  // 5. Role gate
  const isStaff = ctx.role === 'admin' || ctx.role === 'teacher'
  if (uploadType !== 'parent_upload' && !isStaff) {
    return NextResponse.json(
      { error: 'Only admins and teachers can upload photos or handwriting.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }
  if (uploadType === 'parent_upload' && !isStaff && ctx.role !== 'parent') {
    return NextResponse.json(
      { error: 'Only admins, teachers, or parents can upload.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 6. Tenant + ownership check
  const { data: student, error: stuErr } = await supabaseAdmin
    .from('students')
    .select('id, parent_user_ids')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (stuErr || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  if (ctx.role === 'parent') {
    const parentIds: string[] = Array.isArray(student.parent_user_ids)
      ? (student.parent_user_ids as string[])
      : []
    if (!parentIds.includes(ctx.userId)) {
      return NextResponse.json(
        { error: 'You are not authorised to upload for this student.', code: 'FORBIDDEN' },
        { status: 403 },
      )
    }
  }

  // 7. Build path + issue signed URL
  const path = buildStoragePath(ctx.schoolId, studentId, uploadType, filename)
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('[POST uploads/sign] createSignedUploadUrl error:', error)
    return dbErrorResponse(null, { route: 'POST /uploads/sign', op: 'createSignedUploadUrl' })
  }

  return NextResponse.json(
    { token: data.token, path: data.path, signedUrl: data.signedUrl },
    { status: 200 },
  )
}
