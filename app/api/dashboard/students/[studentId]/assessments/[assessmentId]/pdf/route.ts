import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import { revalidatePortfolio } from '@/lib/revalidate'

type RouteContext = { params: Promise<{ studentId: string; assessmentId: string }> }

const BUCKET = 'portfolio-assets'
const MAX_FILE_BYTES = 20 * 1024 * 1024

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { studentId, assessmentId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden.', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (!rateLimit(`${ctx.userId}:assessment-pdf`, 10).ok) return rateLimitResponse()

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Request must be multipart/form-data.', code: 'INVALID_BODY' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A non-empty file is required.', code: 'MISSING_FILE' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 20 MB limit.', code: 'FILE_TOO_LARGE' }, { status: 413 })
  }

  const { data: assessment, error: aErr } = await supabaseAdmin
    .from('assessments')
    .select('id')
    .eq('id', assessmentId)
    .eq('student_id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .single()

  if (aErr || !assessment) {
    return NextResponse.json({ error: 'Assessment not found.', code: 'NOT_FOUND' }, { status: 404 })
  }

  const storagePath = `${ctx.schoolId}/${studentId}/assessment_pdf/${Date.now()}_${sanitizeFilename(file.name)}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: storageErr } = await supabaseAdmin.storage
    .from(BUCKET).upload(storagePath, buffer, { contentType: file.type })

  if (storageErr) {
    return NextResponse.json({ error: 'File upload failed.', code: 'STORAGE_ERROR' }, { status: 502 })
  }

  const { error: dbErr } = await supabaseAdmin
    .from('assessments')
    .update({ pdf_path: storagePath, updated_by: ctx.userId, updated_at: new Date().toISOString() })
    .eq('id', assessmentId)
    .eq('school_id', ctx.schoolId)

  if (dbErr) {
    return NextResponse.json({ error: 'Failed to update assessment.', code: 'DB_ERROR' }, { status: 500 })
  }

  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
  revalidatePortfolio(studentId)
  return NextResponse.json({ pdfPath: storagePath, publicUrl }, { status: 200 })
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { studentId, assessmentId } = await params

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  const { data: assessment, error: aErr } = await supabaseAdmin
    .from('assessments')
    .select('pdf_path')
    .eq('id', assessmentId)
    .eq('student_id', studentId)
    .eq('school_id', ctx.schoolId)
    .is('deleted_at', null)
    .single()

  if (aErr || !assessment) {
    return NextResponse.json({ error: 'Assessment not found.', code: 'NOT_FOUND' }, { status: 404 })
  }

  const pdfPath = assessment.pdf_path as string | null
  if (!pdfPath) {
    return NextResponse.json({ error: 'No PDF attached.', code: 'NOT_FOUND' }, { status: 404 })
  }

  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(pdfPath).data.publicUrl
  return NextResponse.json({ pdfPath, publicUrl }, { status: 200 })
}
