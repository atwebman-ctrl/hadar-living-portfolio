// ============================================================
// app/api/dashboard/students/[studentId]/uploads/route.ts
//
// POST /api/dashboard/students/[studentId]/uploads
//
// Accepts multipart form data, uploads the file to the
// portfolio-assets Supabase storage bucket, and inserts a row
// into the appropriate table (photos, handwriting_samples, or
// parent_uploads).
//
// Auth: admin or teacher for photo/handwriting.
//       admin, teacher, or parent for parent_upload.
//       Parents must also own the student (parentUserIds check).
//
// school_id is always derived server-side from the Clerk org.
// The studentId URL param is validated against school_id before
// any read or write occurs.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse } from '@/lib/apiHelpers'

type RouteContext = { params: Promise<{ studentId: string }> }

const ALLOWED_TYPES = ['photo', 'handwriting', 'parent_upload', 'video', 'profile_photo'] as const
type UploadType = typeof ALLOWED_TYPES[number]

const BUCKET = 'portfolio-assets'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

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

  // 3. Role gate
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

  // 4. Verify student belongs to this school
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

  // 5. Parent ownership check
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

  // 6. Profile photo — fixed path, upsert, update student row, return early
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
    return NextResponse.json({ storagePath: pPath }, { status: 200 })
  }

  // 7. Upload file to storage (timestamped path)
  const path = storagePath(ctx.schoolId, studentId, type, file.name)
  console.log(`[POST uploads] type=${type} path=${path} file=${file.name} size=${file.size}`)
  const { error: storageErr } = await uploadToStorage(path, file)
  if (storageErr) {
    console.error('[POST uploads] storage error:', storageErr)
    return NextResponse.json(
      { error: 'File upload failed.', code: 'STORAGE_ERROR' },
      { status: 502 },
    )
  }
  console.log('[POST uploads] storage upload OK')

  // 8. Insert DB row
  const academicYear = (formData.get('academic_year') as string | null) ?? ''
  const gradeLevel   = (formData.get('grade_level')   as string | null) ?? ''

  if (type === 'photo') {
    return insertPhoto({ schoolId: ctx.schoolId, studentId, path, formData, academicYear, gradeLevel })
  }
  if (type === 'handwriting') {
    return insertHandwriting({ schoolId: ctx.schoolId, studentId, path, formData, academicYear, userId: ctx.userId })
  }
  if (type === 'video') {
    // Storage-only: the student_videos DB row is created by the videos API route
    // after the user completes the form with title/grade/term/category.
    console.log('[POST uploads] video stored at', path)
    return NextResponse.json({ storagePath: path }, { status: 200 })
  }
  return insertParentUpload({ schoolId: ctx.schoolId, studentId, path, formData, academicYear, gradeLevel, uploadedBy: ctx.userId })
}

// ── Table inserters ───────────────────────────────────────────

async function insertPhoto(args: {
  schoolId: string; studentId: string; path: string
  formData: FormData; academicYear: string; gradeLevel: string
}) {
  const { schoolId, studentId, path, formData, academicYear, gradeLevel } = args
  const caption   = (formData.get('caption')    as string | null) || null
  const dateTaken = (formData.get('date_taken') as string | null) || null
  const term      = (formData.get('term')       as string | null) || null
  const category  = (formData.get('category')   as string | null) || null

  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({ school_id: schoolId, student_id: studentId, storage_path: path, caption, date_taken: dateTaken, term, category, grade_level: gradeLevel, academic_year: academicYear })
    .select()
    .single()

  if (error || !data) {
    console.error('[POST uploads] photos insert error:', error)
    return NextResponse.json({ error: 'Failed to save photo record.', code: 'DB_ERROR' }, { status: 500 })
  }
  return NextResponse.json({ record: data, storagePath: path }, { status: 201 })
}

async function insertHandwriting(args: {
  schoolId: string; studentId: string; path: string
  formData: FormData; academicYear: string; userId: string
}) {
  const { schoolId, studentId, path, formData, academicYear, userId } = args

  // DEBUG — log every FormData key/value received
  const allFields: Record<string, string> = {}
  formData.forEach((value, key) => {
    allFields[key] = value instanceof File ? `[File: ${value.name}, ${value.size}b]` : String(value)
  })
  console.log('[insertHandwriting] received FormData fields:', JSON.stringify(allFields))

  const term         = (formData.get('term')        as string | null) || null
  const teacherNotes = (formData.get('description') as string | null) || null

  if (!term) {
    console.error('[insertHandwriting] term is missing from FormData — cannot insert (term NOT NULL)')
    return NextResponse.json({ error: 'A term is required for handwriting samples.', code: 'MISSING_TERM' }, { status: 400 })
  }

  const payload = {
    school_id:     schoolId,
    student_id:    studentId,
    image_path:    path,
    ocr_text:      null,
    teacher_notes: teacherNotes,
    term,
    academic_year: academicYear,
    created_by:    userId,
    updated_by:    userId,
  }
  console.log('[insertHandwriting] INSERT payload:', JSON.stringify(payload))

  const { data, error } = await supabaseAdmin
    .from('handwriting_samples')
    .insert(payload)
    .select()
    .single()

  if (error || !data) {
    console.error('[insertHandwriting] Supabase error:', JSON.stringify(error))
    console.error('[insertHandwriting] error.code:', error?.code, '| error.message:', error?.message, '| error.details:', error?.details, '| error.hint:', error?.hint)
    return NextResponse.json({ error: 'Failed to save handwriting record.', code: 'DB_ERROR' }, { status: 500 })
  }
  console.log('[insertHandwriting] INSERT succeeded, id:', (data as Record<string, unknown>).id)
  return NextResponse.json({ record: data, storagePath: path }, { status: 201 })
}

async function insertParentUpload(args: {
  schoolId: string; studentId: string; path: string
  formData: FormData; academicYear: string; gradeLevel: string; uploadedBy: string
}) {
  const { schoolId, studentId, path, formData, academicYear, gradeLevel, uploadedBy } = args
  const title       = (formData.get('title')              as string | null) ?? 'Untitled'
  const description = (formData.get('description')        as string | null) || null
  const date        = (formData.get('date')               as string | null) || null
  const category    = (formData.get('parent_upload_type') as string | null) || 'other'

  const { data, error } = await supabaseAdmin
    .from('parent_uploads')
    .insert({ school_id: schoolId, student_id: studentId, upload_type: category, category, title, storage_path: path, description, date, grade_level: gradeLevel, academic_year: academicYear, uploaded_by: uploadedBy })
    .select()
    .single()

  if (error || !data) {
    console.error('[POST uploads] parent_uploads insert error:', error)
    return NextResponse.json({ error: 'Failed to save upload record.', code: 'DB_ERROR' }, { status: 500 })
  }
  return NextResponse.json({ record: data, storagePath: path }, { status: 201 })
}
