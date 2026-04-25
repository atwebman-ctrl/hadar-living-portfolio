// ============================================================
// app/api/dashboard/students/[studentId]/uploads/route.ts
//
// POST /api/dashboard/students/[studentId]/uploads
//
// Legacy multipart upload route. Receives multipart/form-data,
// uploads the file to the portfolio-assets bucket, and inserts a
// row into the appropriate table. Bounded by Vercel's ~4.5 MB
// serverless body cap regardless of the local MAX_FILE_BYTES.
//
// Photo / handwriting / parent_upload inserts now go through
// lib/uploadInserters so the new /finalize route can share the
// same DB-write logic. profile_photo and video paths stay inline
// (separate scope).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, dbErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'
import {
  insertPhotoRow,
  insertHandwritingRow,
  insertParentUploadRow,
  InserterError,
} from '@/lib/uploadInserters'

type RouteContext = { params: Promise<{ studentId: string }> }

const ALLOWED_TYPES = ['photo', 'handwriting', 'parent_upload', 'video', 'profile_photo'] as const
type UploadType = typeof ALLOWED_TYPES[number]

const BUCKET = 'portfolio-assets'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB — Vercel's body cap kicks in earlier

// ── Helpers ───────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function storagePath(schoolId: string, studentId: string, type: UploadType, filename: string) {
  return `${schoolId}/${studentId}/${type}/${Date.now()}_${sanitizeFilename(filename)}`
}

function profilePhotoPath(schoolId: string, studentId: string, ext: string) {
  return `${schoolId}/${studentId}/profile/photo.${ext}`
}

async function uploadToStorage(
  path: string,
  file: File,
  upsert = false,
): Promise<{ error: string | null }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert })
  return { error: error?.message ?? null }
}

// ── Route handler ─────────────────────────────────────────────

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

  // 2. Parse form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data.', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'A non-empty file is required.', code: 'MISSING_FILE' },
      { status: 400 },
    )
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'File exceeds the 20 MB limit.', code: 'FILE_TOO_LARGE' },
      { status: 413 },
    )
  }

  const uploadType = formData.get('upload_type') as string | null
  if (!uploadType || !(ALLOWED_TYPES as readonly string[]).includes(uploadType)) {
    return NextResponse.json(
      { error: `upload_type must be one of: ${ALLOWED_TYPES.join(', ')}.`, code: 'INVALID_TYPE' },
      { status: 400 },
    )
  }
  const type = uploadType as UploadType

  // 3. Rate limit — uploads are expensive; cap at 10/min per user
  if (!rateLimit(`${ctx.userId}:uploads`, 10).ok) return rateLimitResponse()

  // 4. Role gate
  const isStaff = ctx.role === 'admin' || ctx.role === 'teacher'
  if ((type === 'profile_photo') && !isStaff) {
    return NextResponse.json(
      { error: 'Only admins and teachers can update profile photos.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }
  if (type !== 'parent_upload' && type !== 'profile_photo' && !isStaff) {
    return NextResponse.json(
      { error: 'Only admins and teachers can upload photos or handwriting.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }
  if (type === 'parent_upload' && !isStaff && ctx.role !== 'parent') {
    return NextResponse.json(
      { error: 'Only admins, teachers, or parents can upload.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // 5. Verify student belongs to this school
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

  // 6. Parent ownership check
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

  // 7. Profile photo — fixed path, upsert, update student row, return early
  if (type === 'profile_photo') {
    const ext   = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const pPath = profilePhotoPath(ctx.schoolId, studentId, ext)
    const { error: storageErr } = await uploadToStorage(pPath, file, true)
    if (storageErr) {
      return NextResponse.json({ error: 'File upload failed.', code: 'STORAGE_ERROR' }, { status: 502 })
    }
    const { error: dbErr } = await supabaseAdmin
      .from('students')
      .update({ profile_photo_path: pPath, updated_at: new Date().toISOString() })
      .eq('id', studentId).eq('school_id', ctx.schoolId)
    if (dbErr) {
      return NextResponse.json({ error: 'Failed to update student profile.', code: 'DB_ERROR' }, { status: 500 })
    }
    revalidatePortfolio(studentId)
    return NextResponse.json({ storagePath: pPath }, { status: 200 })
  }

  // 8. Upload file to storage (timestamped path)
  const path = storagePath(ctx.schoolId, studentId, type, file.name)
  const { error: storageErr } = await uploadToStorage(path, file)
  if (storageErr) {
    console.error('[POST uploads] storage error:', storageErr)
    return NextResponse.json(
      { error: 'File upload failed.', code: 'STORAGE_ERROR' },
      { status: 502 },
    )
  }

  // 9. Insert DB row via shared helpers (storage-only for video)
  const academicYear = (formData.get('academic_year') as string | null) ?? ''
  const gradeLevel   = (formData.get('grade_level')   as string | null) ?? ''

  if (type === 'video') {
    // Storage-only: the student_videos DB row is created by the videos API route
    // after the user completes the form with title/grade/term/category.
    revalidatePortfolio(studentId)
    return NextResponse.json({ storagePath: path }, { status: 200 })
  }

  const insertCtx = { userId: ctx.userId, schoolId: ctx.schoolId, studentId, storagePath: path }

  try {
    let row: Record<string, unknown>
    if (type === 'photo') {
      ({ row } = await insertPhotoRow(insertCtx, {
        caption:      (formData.get('caption')    as string | null) || null,
        dateTaken:    (formData.get('date_taken') as string | null) || null,
        term:         (formData.get('term')       as string | null) || null,
        category:     (formData.get('category')   as string | null) || null,
        gradeLevel,
        academicYear,
      }))
    } else if (type === 'handwriting') {
      const term = (formData.get('term') as string | null) || null
      if (!term) {
        return NextResponse.json(
          { error: 'A term is required for handwriting samples.', code: 'MISSING_TERM' },
          { status: 400 },
        )
      }
      ({ row } = await insertHandwritingRow(insertCtx, {
        term,
        teacherNotes: (formData.get('description') as string | null) || null,
        academicYear,
      }))
    } else {
      ({ row } = await insertParentUploadRow(insertCtx, {
        title:       (formData.get('title')              as string | null) ?? '',
        description: (formData.get('description')        as string | null) || null,
        date:        (formData.get('date')               as string | null) || null,
        category:    (formData.get('parent_upload_type') as string | null) || null,
        gradeLevel,
        academicYear,
      }))
    }
    revalidatePortfolio(studentId)
    return NextResponse.json({ record: row, storagePath: path }, { status: 201 })
  } catch (err) {
    if (err instanceof InserterError) {
      return dbErrorResponse(err.pgError, { route: 'POST /uploads', op: `insert ${type}` })
    }
    throw err
  }
}
