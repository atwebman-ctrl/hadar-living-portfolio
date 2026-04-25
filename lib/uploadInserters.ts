// ============================================================
// lib/uploadInserters.ts
//
// DB inserts for the three upload types behind UploadButton /
// DirectUploadButton. Extracted from the legacy uploads route so
// both the legacy multipart handler and the new /finalize handler
// can share one source of truth.
//
// Each function takes a typed metadata object (NOT FormData) and
// either returns { row } on success or throws on failure. The
// calling route is responsible for translating the throw into a
// NextResponse via dbErrorResponse().
//
// Server-only — never import in client components.
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'
import type { PostgrestError } from '@supabase/supabase-js'

export class InserterError extends Error {
  constructor(public pgError: PostgrestError | null, message = 'DB insert failed') {
    super(message)
    this.name = 'InserterError'
  }
}

// ── Common identity ──────────────────────────────────────────

interface InsertCtx {
  userId:    string
  schoolId:  string
  studentId: string
  /** Storage path produced by /sign or the legacy upload step. */
  storagePath: string
}

// ── Photo ────────────────────────────────────────────────────

export interface PhotoMetadata {
  caption?:      string | null
  dateTaken?:    string | null
  term?:         string | null
  category?:     string | null
  gradeLevel:    string
  academicYear:  string
}

export async function insertPhotoRow(
  ctx: InsertCtx,
  meta: PhotoMetadata,
): Promise<{ row: Record<string, unknown> }> {
  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    ctx.studentId,
      storage_path:  ctx.storagePath,
      caption:       meta.caption    ?? null,
      date_taken:    meta.dateTaken  ?? null,
      term:          meta.term       ?? null,
      category:      meta.category   ?? null,
      grade_level:   meta.gradeLevel,
      academic_year: meta.academicYear,
    })
    .select()
    .single()

  if (error || !data) throw new InserterError(error, 'photos insert failed')
  return { row: data }
}

// ── Handwriting ──────────────────────────────────────────────

export interface HandwritingMetadata {
  term:          string
  teacherNotes?: string | null
  academicYear:  string
}

export async function insertHandwritingRow(
  ctx: InsertCtx,
  meta: HandwritingMetadata,
): Promise<{ row: Record<string, unknown> }> {
  const { data, error } = await supabaseAdmin
    .from('handwriting_samples')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    ctx.studentId,
      image_path:    ctx.storagePath,
      ocr_text:      null,
      teacher_notes: meta.teacherNotes ?? null,
      term:          meta.term,
      academic_year: meta.academicYear,
      created_by:    ctx.userId,
      updated_by:    ctx.userId,
    })
    .select()
    .single()

  if (error || !data) throw new InserterError(error, 'handwriting_samples insert failed')
  return { row: data }
}

// ── Parent upload ────────────────────────────────────────────

export interface ParentUploadMetadata {
  title:        string
  description?: string | null
  date?:        string | null
  /** Parent-upload category (e.g. 'art_craft', 'home_project'). */
  category?:    string | null
  gradeLevel:   string
  academicYear: string
}

export async function insertParentUploadRow(
  ctx: InsertCtx,
  meta: ParentUploadMetadata,
): Promise<{ row: Record<string, unknown> }> {
  const category = meta.category ?? 'other'
  const { data, error } = await supabaseAdmin
    .from('parent_uploads')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    ctx.studentId,
      storage_path:  ctx.storagePath,
      upload_type:   category,
      category,
      title:         meta.title || 'Untitled',
      description:   meta.description ?? null,
      date:          meta.date        ?? null,
      grade_level:   meta.gradeLevel,
      academic_year: meta.academicYear,
      uploaded_by:   ctx.userId,
    })
    .select()
    .single()

  if (error || !data) throw new InserterError(error, 'parent_uploads insert failed')
  return { row: data }
}
