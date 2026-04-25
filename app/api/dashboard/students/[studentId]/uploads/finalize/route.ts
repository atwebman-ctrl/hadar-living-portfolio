// ============================================================
// app/api/dashboard/students/[studentId]/uploads/finalize/route.ts
//
// POST /api/dashboard/students/[studentId]/uploads/finalize
//
// Companion to /sign. After the client PUTs the file to the signed
// URL, it calls this endpoint with the storage path + the metadata
// the legacy multipart route used to receive in form fields. We
// re-validate auth, re-validate the path against this user's
// (school, student, type) prefix, verify the object actually
// exists in the bucket, and insert the DB row.
//
// Body: { uploadType, path, metadata?: { ... } }
// Returns: { record, storagePath } (mirrors legacy /uploads on success)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  authErrorResponse,
  dbErrorResponse,
  rateLimit,
  rateLimitResponse,
} from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'
import { STORAGE_BUCKET, storagePathPrefix, type UploadType } from '@/lib/uploadValidation'
import {
  insertPhotoRow,
  insertHandwritingRow,
  insertParentUploadRow,
  InserterError,
} from '@/lib/uploadInserters'

type RouteContext = { params: Promise<{ studentId: string }> }

const ALLOWED_TYPES = ['photo', 'handwriting', 'parent_upload'] as const

interface FinalizeBody {
  uploadType:    UploadType
  path:          string
  academicYear?: string
  gradeLevel?:   string
  metadata?: {
    caption?:            string
    date_taken?:         string
    term?:               string
    category?:           string
    title?:              string
    description?:        string
    date?:               string
    parent_upload_type?: string
  }
}

function badRequest(error: string, code: string): NextResponse {
  return NextResponse.json({ error, code }, { status: 400 })
}

async function verifyObjectExists(path: string): Promise<boolean> {
  const lastSlash = path.lastIndexOf('/')
  const dir  = path.slice(0, lastSlash)
  const name = path.slice(lastSlash + 1)
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .list(dir, { search: name, limit: 100 })
  if (error) {
    console.error('[POST uploads/finalize] storage.list error:', error)
    return false
  }
  return Array.isArray(data) && data.some((entry) => entry.name === name)
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

  // 2. Rate limit (matches /sign)
  if (!rateLimit(`${ctx.userId}:uploads`, 10).ok) return rateLimitResponse()

  // 3. Parse body
  let body: FinalizeBody
  try {
    body = await req.json() as FinalizeBody
  } catch {
    return badRequest('Body must be valid JSON.', 'INVALID_BODY')
  }
  const { uploadType, path } = body
  if (!uploadType || !(ALLOWED_TYPES as readonly string[]).includes(uploadType)) {
    return badRequest(`uploadType must be one of: ${ALLOWED_TYPES.join(', ')}.`, 'INVALID_TYPE')
  }
  if (typeof path !== 'string' || !path) {
    return badRequest('path is required.', 'INVALID_PATH')
  }

  // 4. Role gate
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

  // 5. Path-spoofing guard — the path must live under this user's
  //    (school, student, type) prefix. Without this a parent could
  //    finalize a row pointing at another family's storage object.
  const expectedPrefix = storagePathPrefix(ctx.schoolId, studentId, uploadType)
  if (!path.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: 'Storage path does not match the requested student / type.', code: 'PATH_MISMATCH' },
      { status: 400 },
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

  // 7. Confirm the object actually landed in the bucket. Without this
  //    a malicious client could call /finalize without having uploaded,
  //    creating a DB row that points at an empty storage path.
  if (!(await verifyObjectExists(path))) {
    return NextResponse.json(
      { error: 'Uploaded file not found in storage.', code: 'OBJECT_NOT_FOUND' },
      { status: 404 },
    )
  }

  // 8. Insert DB row
  const academicYear = body.academicYear ?? ''
  const gradeLevel   = body.gradeLevel   ?? ''
  const meta         = body.metadata ?? {}

  const insertCtx = {
    userId:    ctx.userId,
    schoolId:  ctx.schoolId,
    studentId,
    storagePath: path,
  }

  try {
    let row: Record<string, unknown>
    if (uploadType === 'photo') {
      ({ row } = await insertPhotoRow(insertCtx, {
        caption:      meta.caption ?? null,
        dateTaken:    meta.date_taken ?? null,
        term:         meta.term ?? null,
        category:     meta.category ?? null,
        gradeLevel,
        academicYear,
      }))
    } else if (uploadType === 'handwriting') {
      if (!meta.term) {
        return badRequest('A term is required for handwriting samples.', 'MISSING_TERM')
      }
      ({ row } = await insertHandwritingRow(insertCtx, {
        term:         meta.term,
        teacherNotes: meta.description ?? null,
        academicYear,
      }))
    } else {
      ({ row } = await insertParentUploadRow(insertCtx, {
        title:        meta.title ?? '',
        description:  meta.description ?? null,
        date:         meta.date ?? null,
        category:     meta.parent_upload_type ?? null,
        gradeLevel,
        academicYear,
      }))
    }

    revalidatePortfolio(studentId)
    return NextResponse.json({ record: row, storagePath: path }, { status: 201 })
  } catch (err) {
    if (err instanceof InserterError) {
      return dbErrorResponse(err.pgError, {
        route: 'POST /uploads/finalize',
        op:    `insert ${uploadType}`,
      })
    }
    throw err
  }
}
