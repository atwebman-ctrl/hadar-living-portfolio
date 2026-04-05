// ============================================================
// lib/types.ts — Shared TypeScript types
// Mirrors the database schema. All fields are camelCase on the
// TypeScript side; Supabase returns snake_case which is mapped
// at the query layer or via explicit select aliases.
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type UserRole = "admin" | "teacher" | "parent";

export type AiDraftStatus = "draft" | "accepted" | "rejected";

export type SectionType =
  | "student_header"
  | "academic_scores"
  | "immersion"
  | "reading_bookshelf"
  | "writing"
  | "handwriting"
  | "rhetoric"
  | "virtue_badges"
  | "photos"
  | "parent_uploads"
  | "teacher_profiles"
  | "scope_sequence"
  | "state_of_union";

export type AssessmentType =
  | "maps_math"
  | "maps_english"
  | "avant_speaking"
  | "avant_reading"
  | "avant_listening"
  | "avant_writing"
  | "lexile";

export type VideoType =
  | "rhetoric"
  | "reading_aloud"
  | "hebrew_speech"
  | "presentation";

// ── School ───────────────────────────────────────────────────

export interface ThemeConfig {
  colors: Record<string, string>; // CSS variable values, e.g. { navy: "#1B3A6B" }
  fonts?: Record<string, string>; // font family overrides (V2)
}

export interface SchoolConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: ThemeConfig;
  enabledSections: SectionType[];
  websiteUrl: string | null;
  clerkOrgId: string | null;
}

// ── Student ──────────────────────────────────────────────────

export interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;       // e.g. "3rd Grade"
  academicYear: string;     // e.g. "2025-2026"
  parentUserIds: string[];  // Clerk user IDs
  profilePhotoPath: string | null;
  summary: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Content tables ───────────────────────────────────────────

export interface Assessment {
  id: string;
  schoolId: string;
  studentId: string;
  assessmentType: AssessmentType;
  score: number | null;
  percentile: number | null;
  ritScore: number | null;     // MAPS-specific
  lexileValue: string | null;  // e.g. "820L"
  term: string;                // e.g. "Fall 2025"
  academicYear: string;
  notes: string | null;
  createdAt: string;
}

export interface Reading {
  id: string;
  schoolId: string;
  studentId: string;
  title: string;
  author: string | null;
  academicYear: string;
  completed: boolean;
  sortOrder: number;
  whyChosen: string | null;
  valuesSkills: string | null;
  pageCount: number | null;
  createdAt: string;
}

export interface WritingSample {
  id: string;
  schoolId: string;
  studentId: string;
  language: "english" | "hebrew";
  gradeLevel: string;
  title: string;
  body: string | null;
  storagePath: string | null;
  imagePath: string | null;  // original handwritten image
  ocrText: string | null;    // AI-extracted transcription
  academicYear: string;
  createdAt: string;
}

export interface HandwritingSample {
  id: string;
  schoolId: string;
  studentId: string;
  imagePath: string;
  ocrText: string | null;
  teacherNotes: string | null;
  term: string;
  academicYear: string;
  createdAt: string;
}

export interface Video {
  id: string;
  schoolId: string;
  studentId: string;
  videoType: VideoType;
  title: string;
  description: string | null;
  storagePath: string | null;   // mutually exclusive with externalUrl
  externalUrl: string | null;   // YouTube / Vimeo
  thumbnailPath: string | null;
  recordedAt: string | null;
  academicYear: string;
  createdAt: string;
}

export interface CharacterAward {
  id: string;
  schoolId: string;
  studentId: string;
  virtueHebrew: string;
  virtueTransliteration: string;
  virtueEnglish: string;
  awardDate: string;
  description: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  schoolId: string;
  studentId: string;
  storagePath: string;
  caption: string | null;
  dateTaken: string | null;
  gradeLevel: string;
  academicYear: string;
  createdAt: string;
}

export interface ParentUpload {
  id: string;
  schoolId: string;
  studentId: string;
  uploadType: string;  // e.g. "art" | "story" | "poem" | "recording"
  title: string;
  storagePath: string;
  description: string | null;
  date: string | null;
  gradeLevel: string;
  academicYear: string;
  uploadedBy: string;  // Clerk user ID of the parent
  createdAt: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  clerkUserId: string | null;
  firstName: string;
  lastName: string;
  photoPath: string | null;
  bio: string | null;
  subjects: string[];
  startYear: number | null;
  createdAt: string;
}

export interface AiDraft {
  id: string;
  schoolId: string;
  studentId: string;
  sectionType: SectionType;
  referenceId: string;      // ID of the content row this draft belongs to
  contentDraft: string;     // AI-generated, unedited
  contentFinal: string | null;
  status: AiDraftStatus;
  reviewedBy: string | null;   // Clerk user ID
  reviewedAt: string | null;
  createdAt: string;
}

export interface SchoolMember {
  id: string;
  schoolId: string;
  clerkUserId: string;
  role: UserRole;
  createdAt: string;
}

// ── Sprint 3 new types ────────────────────────────────────────

/** One subject's curriculum progress within a grade level. */
export interface SubjectProgress {
  subject: string;        // e.g. "Mathematics"
  unit: string | null;    // e.g. "Fractions & Decimals"
  completionPct: number;  // 0–100
  notes: string | null;
}

/**
 * Teacher-authored narrative attached to a portfolio section.
 * DB table: teacher_notes (Sprint 3 migration).
 */
export interface TeacherNote {
  id: string;
  schoolId: string;
  studentId: string;
  sectionType: SectionType;
  authorName: string;   // denormalized display name
  text: string;
  createdAt: string;
}

// ── Aggregated portfolio response ────────────────────────────

export interface PortfolioData {
  student: Student;
  school: SchoolConfig;
  assessments: Assessment[];
  readings: Reading[];
  writingSamples: WritingSample[];
  handwritingSamples: HandwritingSample[];
  videos: Video[];
  characterAwards: CharacterAward[];
  photos: Photo[];
  parentUploads: ParentUpload[];
  teachers: Teacher[];
  scopeAndSequence: SubjectProgress[];
  teacherNotes: TeacherNote[];
  aiDrafts: AiDraft[];  // only accepted drafts in parent view
}

// ── API response shapes ───────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}
