// ============================================================
// app/api/dashboard/students/[studentId]/report-cards/route.ts
//
// GET  — list report cards for this student (admin/teacher only)
// POST — upload a new report card (multipart; admin/teacher only)
//
// Report cards may predate enrollment at the current school:
// the route accepts any academic_year / term / grade_level string
// without FK validation. PDFs and images are both accepted.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapReportCard } from '@/lib/mappers'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

type RouteContext = { params: Promise<{ studentId: string }> }
type Row = Record<string, unknown>

const BUCKET = 'portfolio-assets'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

const MetaSchema = z.object({
  title:        z.string().min(1, 'Title is required').max(200),
  description:  z.string().max(1000).nullable().optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Expected format: YYYY-YYYY'),
  term:         z.string().nullable().optional(),
  gradeLevel:   z.string().nullable().optional(),
})

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function storagePath(schoolId: string, studentId: string, filename: string) {
  return `${schoolId}/${studentId}/reports/${Date.now()}_${sanitizeFilename(filename)}`
}

async function requireStaffAndStudent(studentId: string) {
  const ctx = await getAuthContext()
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return { error: NextResponse.json(
      { error: 'Only admins and teachers can manage report cards.', code: 'FORBIDDEN' },
      { status: 403 },
    )}
  }
  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', ctx.schoolId)
    .single()
  if (error || !student) {
    return { error: NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 },
    )}
  }
  return { ctx }
}

// ── GET ───────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  let gate!: Awaited<ReturnType<typeof requireStaffAndStudent>>
  try {
    gate = await requireStaffAndStudent(studentId)
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }
  if (gate.error) return gate.error

  const { data, error } = await supabaseAdmin
    .from('report_cards')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', gate.ctx.schoolId)
    .is('deleted_at', null)
    .order('academic_year', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET report-cards]', error)
    return NextResponse.json(
      { error: 'Failed to load report cards.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json((data ?? []).map((r) => mapReportCard(r as Row)))
}

// ── POST ──────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { studentId } = await params

  let gate!: Awaited<ReturnType<typeof requireStaffAndStudent>>
  try {
    gate = await requireStaffAndStudent(studentId)
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }
  if (gate.error) return gate.error
  const { ctx } = gate

  if (!rateLimit(`${ctx.userId}:report-cards`, 10).ok) return rateLimitResponse()

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

  const parsed = MetaSchema.safeParse({
    title:        (formData.get('title')        as string | null) ?? '',
    description:  (formData.get('description')  as string | null) || null,
    academicYear: (formData.get('academicYear') as string | null) ?? '',
    term:         (formData.get('term')         as string | null) || null,
    gradeLevel:   (formData.get('gradeLevel')   as string | null) || null,
  })
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return NextResponse.json(
      { error: msg, code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  const meta = parsed.data

  const path = storagePath(ctx.schoolId, studentId, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: storageErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type })
  if (storageErr) {
    console.error('[POST report-cards] storage error:', storageErr)
    return NextResponse.json(
      { error: 'File upload failed.', code: 'STORAGE_ERROR' },
      { status: 502 },
    )
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from('report_cards')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    studentId,
      title:         meta.title,
      description:   meta.description ?? null,
      academic_year: meta.academicYear,
      term:          meta.term ?? null,
      grade_level:   meta.gradeLevel ?? null,
      storage_path:  path,
      file_type:     file.type || 'application/pdf',
      uploaded_by:   ctx.userId,
    })
    .select()
    .single()

  if (dbErr || !data) {
    console.error('[POST report-cards] db error:', dbErr)
    return NextResponse.json(
      { error: 'Failed to save report card record.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  revalidatePortfolio(studentId)
  return NextResponse.json(mapReportCard(data as Row), { status: 201 })
}
