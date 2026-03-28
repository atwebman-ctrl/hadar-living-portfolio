import { supabaseAdmin } from "./supabaseAdmin";
import type {
  PortfolioData,
  SchoolConfig,
  Student,
  Assessment,
  Reading,
  WritingSample,
  HandwritingSample,
  Video,
  CharacterAward,
  Photo,
  ParentUpload,
  Teacher,
  AiDraft,
  SectionType,
  ThemeConfig,
} from "./types";

// ============================================================
// lib/getStudentPortfolio.ts
//
// Single source of truth for all student portfolio data fetching.
// Always called server-side (API routes or server components).
// Every query double-filters by both student_id AND school_id —
// school_id isolation is enforced here, not just by RLS.
//
// Note: handwriting_samples, photos, parent_uploads, and teachers
// tables are created in Sprint 3. safeQuery() returns [] gracefully
// if a table doesn't exist yet.
// ============================================================

// Wraps a Supabase query and returns an empty array on error instead
// of throwing, so a missing Sprint-3 table doesn't crash the whole fetch.
async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const { data, error } = await queryFn();
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getStudentPortfolio] query failed:", error);
    }
    return [];
  }
  return data ?? [];
}

// ── Row mappers (snake_case DB → camelCase TS) ────────────────

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    gradeLevel: row.grade_level as string,
    academicYear: row.academic_year as string,
    parentUserIds: (row.parent_user_ids as string[]) ?? [],
    profilePhotoPath: (row.profile_photo_path as string) ?? null,
    summary: (row.summary as string) ?? null,
    isDemo: row.is_demo as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSchool(row: Record<string, unknown>): SchoolConfig {
  const themeJson = (row.theme_json as ThemeConfig) ?? {};
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string) ?? null,
    theme: themeJson,
    enabledSections: (row.enabled_sections as SectionType[]) ?? [],
    websiteUrl: (row.website_url as string) ?? null,
    clerkOrgId: (row.clerk_org_id as string) ?? null,
  };
}

function mapAssessment(row: Record<string, unknown>): Assessment {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    assessmentType: row.assessment_type as Assessment["assessmentType"],
    score: (row.score as number) ?? null,
    percentile: (row.percentile as number) ?? null,
    ritScore: (row.rit_score as number) ?? null,
    lexileValue: (row.lexile_value as string) ?? null,
    term: row.term as string,
    academicYear: row.academic_year as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapReading(row: Record<string, unknown>): Reading {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    title: row.title as string,
    author: (row.author as string) ?? null,
    academicYear: row.academic_year as string,
    completed: row.completed as boolean,
    sortOrder: row.sort_order as number,
    whyChosen: (row.why_chosen as string) ?? null,
    valuesSkills: (row.values_skills as string) ?? null,
    pageCount: (row.page_count as number) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapWritingSample(row: Record<string, unknown>): WritingSample {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    language: row.language as WritingSample["language"],
    gradeLevel: row.grade_level as string,
    title: row.title as string,
    body: (row.body as string) ?? null,
    storagePath: (row.storage_path as string) ?? null,
    imagePath: (row.image_path as string) ?? null,
    ocrText: (row.ocr_text as string) ?? null,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
  };
}

function mapHandwritingSample(row: Record<string, unknown>): HandwritingSample {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    imagePath: row.image_path as string,
    ocrText: (row.ocr_text as string) ?? null,
    teacherNotes: (row.teacher_notes as string) ?? null,
    term: row.term as string,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
  };
}

function mapVideo(row: Record<string, unknown>): Video {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    videoType: row.video_type as Video["videoType"],
    title: row.title as string,
    description: (row.description as string) ?? null,
    storagePath: (row.storage_path as string) ?? null,
    externalUrl: (row.external_url as string) ?? null,
    thumbnailPath: (row.thumbnail_path as string) ?? null,
    recordedAt: (row.recorded_at as string) ?? null,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
  };
}

function mapCharacterAward(row: Record<string, unknown>): CharacterAward {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    virtueHebrew: row.virtue_hebrew as string,
    virtueTransliteration: row.virtue_transliteration as string,
    virtueEnglish: row.virtue_english as string,
    awardDate: row.award_date as string,
    description: (row.description as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapPhoto(row: Record<string, unknown>): Photo {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    storagePath: row.storage_path as string,
    caption: (row.caption as string) ?? null,
    dateTaken: (row.date_taken as string) ?? null,
    gradeLevel: row.grade_level as string,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
  };
}

function mapParentUpload(row: Record<string, unknown>): ParentUpload {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    uploadType: row.upload_type as string,
    title: row.title as string,
    storagePath: row.storage_path as string,
    description: (row.description as string) ?? null,
    date: (row.date as string) ?? null,
    gradeLevel: row.grade_level as string,
    academicYear: row.academic_year as string,
    uploadedBy: row.uploaded_by as string,
    createdAt: row.created_at as string,
  };
}

function mapTeacher(row: Record<string, unknown>): Teacher {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    clerkUserId: (row.clerk_user_id as string) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    photoPath: (row.photo_path as string) ?? null,
    bio: (row.bio as string) ?? null,
    subjects: (row.subjects as string[]) ?? [],
    startYear: (row.start_year as number) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapAiDraft(row: Record<string, unknown>): AiDraft {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    sectionType: row.section_type as SectionType,
    referenceId: row.reference_id as string,
    contentDraft: row.content_draft as string,
    contentFinal: (row.content_final as string) ?? null,
    status: row.status as AiDraft["status"],
    reviewedBy: (row.reviewed_by as string) ?? null,
    reviewedAt: (row.reviewed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ── Main function ─────────────────────────────────────────────

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
  // safeQuery() returns [] instead of throwing for Sprint-3 tables
  // (handwriting_samples, photos, parent_uploads, teachers) that don't
  // exist yet. Remove safeQuery() wrapping when those tables land.
  const [
    assessmentRows,
    readingRows,
    writingSampleRows,
    handwritingRows,
    videoRows,
    characterAwardRows,
    photoRows,
    parentUploadRows,
    teacherRows,
    aiDraftRows,
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
    // Teachers: all teachers at this school. Narrowed to assigned
    // teachers once a student_teachers join table exists (Sprint 3).
    safeQuery(() =>
      supabaseAdmin
        .from("teachers")
        .select("*")
        .eq("school_id", schoolId)
        .order("last_name", { ascending: true })
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
  ]);

  return {
    student: mapStudent(studentRow as Record<string, unknown>),
    school: mapSchool(schoolRow as Record<string, unknown>),
    assessments: assessmentRows.map((r) => mapAssessment(r as Record<string, unknown>)),
    readings: readingRows.map((r) => mapReading(r as Record<string, unknown>)),
    writingSamples: writingSampleRows.map((r) => mapWritingSample(r as Record<string, unknown>)),
    handwritingSamples: handwritingRows.map((r) => mapHandwritingSample(r as Record<string, unknown>)),
    videos: videoRows.map((r) => mapVideo(r as Record<string, unknown>)),
    characterAwards: characterAwardRows.map((r) => mapCharacterAward(r as Record<string, unknown>)),
    photos: photoRows.map((r) => mapPhoto(r as Record<string, unknown>)),
    parentUploads: parentUploadRows.map((r) => mapParentUpload(r as Record<string, unknown>)),
    teachers: teacherRows.map((r) => mapTeacher(r as Record<string, unknown>)),
    aiDrafts: aiDraftRows.map((r) => mapAiDraft(r as Record<string, unknown>)),
  };
}
