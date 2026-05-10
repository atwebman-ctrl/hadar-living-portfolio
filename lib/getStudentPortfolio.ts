// ============================================================
// lib/getStudentPortfolio.ts
//
// Single source of truth for all student portfolio data fetching.
// Always called server-side (API routes or server components).
// Every query double-filters by both student_id AND school_id —
// school_id isolation is enforced here, not just by RLS.
//
// Row mappers live in lib/mappers.ts.
//
// Note: some Sprint 3 tables use safeQuery() to return [] gracefully
// if a table doesn't exist yet. teachers table has no migration yet —
// teachers: [] is returned directly until that migration lands.
// ============================================================

import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from "./supabaseAdmin";
import type { PortfolioData } from "./types";
import {
  mapStudent,
  mapSchool,
  mapAssessment,
  mapReading,
  mapWritingSample,
  mapHandwritingSample,
  mapVideo,
  mapCharacterAward,
  mapPhoto,
  mapParentUpload,
  mapReportCard,
  mapTeacherNote,
  mapScopeAndSequence,
  mapAiDraft,
  mapStudentVideo,
} from "./mappers";

import { storagePublicUrl } from './storage'

// Wraps a Supabase query and returns an empty array on error instead
// of throwing, so a missing Sprint-3 table doesn't crash the whole fetch.
async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const { data, error } = await queryFn();
  if (error) {
    console.warn("[getStudentPortfolio] query failed:", error);
    return [];
  }
  return data ?? [];
}

// Raw fetch — no caching. Use when you need guaranteed fresh data
// (e.g., in API write handlers immediately after a mutation).
export async function getStudentPortfolioUncached(
  studentId: string,
  schoolId: string
): Promise<PortfolioData> {
  // Fetch school and student first — these must succeed.
  // Column lists track exactly what each mapper reads. Anything added to a
  // mapper must also be added here, or the field will silently be undefined.
  const SCHOOL_COLS = 'id, name, slug, logo_url, theme_json, enabled_sections, website_url, clerk_org_id, pedagogical_schools, third_languages'
  const STUDENT_COLS = 'id, school_id, first_name, last_name, grade_level, grade_level_legacy, academic_year, parent_user_ids, profile_photo_path, summary, progress_summary, is_demo, deleted_at, created_at, updated_at, gender, date_of_birth, enrollment_status'

  const [{ data: schoolRow, error: schoolError }, { data: studentRow, error: studentError }] =
    await Promise.all([
      supabaseAdmin.from("schools").select(SCHOOL_COLS).eq("id", schoolId).single(),
      supabaseAdmin
        .from("students")
        .select(STUDENT_COLS)
        .eq("id", studentId)
        .eq("school_id", schoolId)
        .single(),
    ]);

  if (schoolError || !schoolRow) {
    throw new Error(`School not found: ${schoolId}`);
  }
  if (studentError || !studentRow) {
    throw new Error(`Student not found or does not belong to school: ${studentId}`);
  }

  // Per-table column lists. These mirror the snake_case columns each mapper
  // in lib/mappers.ts reads. Tables that participate in the soft-delete filter
  // below MUST include `deleted_at`; otherwise the in-memory `notDeleted`
  // check would always pass and soft-deleted rows would leak.
  const ASSESSMENT_COLS       = 'id, school_id, student_id, assessment_type, score, percentile, rit_score, lexile_value, term, academic_year, notes, pdf_path, created_at, deleted_at'
  const READING_COLS          = 'id, school_id, student_id, title, author, academic_year, completed, sort_order, why_chosen, values_skills, page_count, teacher_notes, reading_difficulty, student_rating, date_started, date_finished, key_quote, curriculum_connection, created_at, deleted_at'
  const WRITING_SAMPLE_COLS   = 'id, school_id, student_id, language, grade_level, title, body, storage_path, image_path, ocr_text, academic_year, created_at, genre, excerpt, teacher_comments, term, file_path, deleted_at'
  const HANDWRITING_COLS      = 'id, school_id, student_id, image_path, ocr_text, teacher_notes, term, academic_year, created_at, deleted_at'
  const VIDEO_COLS            = 'id, school_id, student_id, video_type, title, description, storage_path, external_url, thumbnail_path, recorded_at, academic_year, created_at'
  const CHARACTER_AWARD_COLS  = 'id, school_id, student_id, virtue_hebrew, virtue_transliteration, virtue_english, award_date, description, created_at, deleted_at'
  const PHOTO_COLS            = 'id, school_id, student_id, storage_path, caption, term, category, date_taken, grade_level, academic_year, created_at, deleted_at'
  const PARENT_UPLOAD_COLS    = 'id, school_id, student_id, upload_type, category, title, storage_path, description, date, grade_level, academic_year, uploaded_by, created_at, deleted_at'
  const TEACHER_NOTE_COLS     = 'id, school_id, student_id, section_type, section_category, author_name, text, term, highlight_quote, visible_to_parents, section_anchor, created_at, deleted_at'
  const SCOPE_COLS            = 'subject, unit, completion_pct, notes'
  const AI_DRAFT_COLS         = 'id, school_id, student_id, section_type, reference_id, content_draft, content_final, status, reviewed_by, reviewed_at, created_at'
  const STUDENT_VIDEO_COLS    = 'id, school_id, student_id, title, video_url, video_storage_path, grade_level, term, category, language, created_at, deleted_at'
  const REPORT_CARD_COLS      = 'id, school_id, student_id, title, description, academic_year, term, grade_level, storage_path, file_type, uploaded_by, created_at, deleted_at'

  // Run all content queries in parallel.
  const [
    assessmentRows,
    readingRows,
    writingSampleRows,
    handwritingRows,
    videoRows,
    characterAwardRows,
    photoRows,
    parentUploadRows,
    teacherNoteRows,
    scopeRows,
    aiDraftRows,
    studentVideoRows,
    reportCardRows,
  ] = await Promise.all([
    // deleted_at filter applied in-memory below so the query works both before
    // and after migration 0012 is applied to production.
    safeQuery(() =>
      supabaseAdmin
        .from("assessments")
        .select(ASSESSMENT_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("readings")
        .select(READING_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("sort_order", { ascending: true })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("writing_samples")
        .select(WRITING_SAMPLE_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("handwriting_samples")
        .select(HANDWRITING_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: true })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("videos")
        .select(VIDEO_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("recorded_at", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("character_awards")
        .select(CHARACTER_AWARD_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("award_date", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("photos")
        .select(PHOTO_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("date_taken", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("parent_uploads")
        .select(PARENT_UPLOAD_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("date", { ascending: false })
    ),
    // teacher_notes: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("teacher_notes")
        .select(TEACHER_NOTE_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    ),
    // scope_and_sequence: Sprint 3 table — safeQuery returns [] until migration lands.
    safeQuery(() =>
      supabaseAdmin
        .from("scope_and_sequence")
        .select(SCOPE_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("subject", { ascending: true })
    ),
    // ai_drafts: accepted only — parents never see draft or rejected content.
    safeQuery(() =>
      supabaseAdmin
        .from("ai_drafts")
        .select(AI_DRAFT_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .eq("status", "accepted")
    ),
    // student_videos: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("student_videos")
        .select(STUDENT_VIDEO_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true })
    ),
    // report_cards: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("report_cards")
        .select(REPORT_CARD_COLS)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: false })
    ),
  ]);

  type Row = Record<string, unknown>;

  // In-memory soft-delete filter: works before AND after the deleted_at column
  // migration is applied. When the column doesn't exist, r.deleted_at is
  // undefined (falsy) so all rows pass. Once the column exists, rows with a
  // timestamp are excluded and rows with null pass.
  const notDeleted = (r: unknown) => !(r as Row).deleted_at

  return {
    student: mapStudent(studentRow as Row),
    school: mapSchool(schoolRow as Row),
    assessments: assessmentRows.filter(notDeleted).map((r) => {
      const a = mapAssessment(r as Row)
      return { ...a, pdfPublicUrl: storagePublicUrl(a.pdfPath) }
    }),
    readings: readingRows.filter(notDeleted).map((r) => mapReading(r as Row)),
    writingSamples: writingSampleRows.filter(notDeleted).map((r) => mapWritingSample(r as Row)),
    handwritingSamples: handwritingRows.filter(notDeleted).map((r) => {
      const s = mapHandwritingSample(r as Row)
      return { ...s, publicUrl: storagePublicUrl(s.imagePath) }
    }),
    videos: videoRows.map((r) => mapVideo(r as Row)),
    characterAwards: characterAwardRows.filter(notDeleted).map((r) => mapCharacterAward(r as Row)),
    photos: photoRows.filter(notDeleted).map((r) => {
      const p = mapPhoto(r as Row)
      return { ...p, publicUrl: storagePublicUrl(p.storagePath) }
    }),
    parentUploads: parentUploadRows.filter(notDeleted).map((r) => {
      const u = mapParentUpload(r as Row)
      return { ...u, publicUrl: storagePublicUrl(u.storagePath) }
    }),
    teachers: [],
    scopeAndSequence: scopeRows.map((r) => mapScopeAndSequence(r as Row)),
    teacherNotes: teacherNoteRows.filter(notDeleted).map((r) => mapTeacherNote(r as Row)),
    aiDrafts: aiDraftRows.map((r) => mapAiDraft(r as Row)),
    studentVideos: studentVideoRows.filter(notDeleted).map((r) => {
      const v = mapStudentVideo(r as Row)
      return { ...v, videoPublicUrl: storagePublicUrl(v.videoStoragePath) }
    }),
    reportCards: reportCardRows.filter(notDeleted).map((r) => {
      const c = mapReportCard(r as Row)
      return { ...c, publicUrl: storagePublicUrl(c.storagePath) }
    }),
  };
}

// ── Cached version (default export) ──────────────────────────
//
// Wraps the raw fetch in Next.js unstable_cache with:
//   - 60 second TTL (revalidate: 60)
//   - Per-student tag: `portfolio-${studentId}`
//
// Call revalidatePortfolio(studentId) from any write route to
// bust the cache immediately after a mutation.
//
// The cache key includes studentId + schoolId so different schools
// can never see each other's cached data.
export function getStudentPortfolio(
  studentId: string,
  schoolId: string,
): Promise<PortfolioData> {
  return unstable_cache(
    () => getStudentPortfolioUncached(studentId, schoolId),
    ['portfolio', studentId, schoolId],
    { revalidate: 60, tags: [`portfolio-${studentId}`, `school-${schoolId}`] },
  )()
}
