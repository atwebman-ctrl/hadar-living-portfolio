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
  mapTeacherNote,
  mapScopeAndSequence,
  mapAiDraft,
  mapStudentVideo,
} from "./mappers";

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

export async function getStudentPortfolio(
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
  ] = await Promise.all([
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
    // teacher_notes: Sprint 3 table — safeQuery returns [] until migration lands.
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
    // student_videos: 0008 migration — safeQuery returns [] until migration lands.
    safeQuery(() =>
      supabaseAdmin
        .from("student_videos")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true })
    ),
  ]);

  type Row = Record<string, unknown>;

  return {
    student: mapStudent(studentRow as Row),
    school: mapSchool(schoolRow as Row),
    assessments: assessmentRows.map((r) => mapAssessment(r as Row)),
    readings: readingRows.map((r) => mapReading(r as Row)),
    writingSamples: writingSampleRows.map((r) => mapWritingSample(r as Row)),
    handwritingSamples: handwritingRows.map((r) => mapHandwritingSample(r as Row)),
    videos: videoRows.map((r) => mapVideo(r as Row)),
    characterAwards: characterAwardRows.map((r) => mapCharacterAward(r as Row)),
    photos: photoRows.map((r) => mapPhoto(r as Row)),
    parentUploads: parentUploadRows.map((r) => mapParentUpload(r as Row)),
    teachers: [],
    scopeAndSequence: scopeRows.map((r) => mapScopeAndSequence(r as Row)),
    teacherNotes: teacherNoteRows.map((r) => mapTeacherNote(r as Row)),
    aiDrafts: aiDraftRows.map((r) => mapAiDraft(r as Row)),
    studentVideos: studentVideoRows.map((r) => mapStudentVideo(r as Row)),
  };
}
