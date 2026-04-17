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
  const [{ data: schoolRow, error: schoolError }, { data: studentRow, error: studentError }] =
    await Promise.all([
      supabaseAdmin.from("schools").select("*").eq("id", schoolId).single(),
      supabaseAdmin
        .from("students")
        .select("*")
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
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("readings")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("sort_order", { ascending: true })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("writing_samples")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("handwriting_samples")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: true })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("videos")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("recorded_at", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("character_awards")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("award_date", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("photos")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("date_taken", { ascending: false })
    ),
    safeQuery(() =>
      supabaseAdmin
        .from("parent_uploads")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("date", { ascending: false })
    ),
    // teacher_notes: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("teacher_notes")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    ),
    // scope_and_sequence: Sprint 3 table — safeQuery returns [] until migration lands.
    safeQuery(() =>
      supabaseAdmin
        .from("scope_and_sequence")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("subject", { ascending: true })
    ),
    // ai_drafts: accepted only — parents never see draft or rejected content.
    safeQuery(() =>
      supabaseAdmin
        .from("ai_drafts")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .eq("status", "accepted")
    ),
    // student_videos: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("student_videos")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true })
    ),
    // report_cards: deleted_at filter applied in-memory below.
    safeQuery(() =>
      supabaseAdmin
        .from("report_cards")
        .select("*")
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
