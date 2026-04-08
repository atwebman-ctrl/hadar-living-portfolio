import { z } from "zod";

// ============================================================
// lib/validationExtended.ts — Zod schemas for media, AI, and
// school-admin API routes. Split from lib/validation.ts to
// keep both files under 300 lines.
//
// Re-exports validate() and ValidationError from validation.ts
// so callers only need one import.
// ============================================================

// Re-export helpers so routes don't need two imports
export { validate, ValidationError } from "./validation";

// Primitives shared with validation.ts — redefined locally to
// avoid a circular dependency.
const uuid          = z.string().uuid();
const academicYear  = z.string().regex(/^\d{4}-\d{4}$/, "Expected format: YYYY-YYYY");
const nonEmptyString = z.string().min(1, "Cannot be empty");

// ── Photos ────────────────────────────────────────────────────

export const CreatePhotoSchema = z.object({
  studentId:   uuid,
  storagePath: nonEmptyString,
  caption:     z.string().nullable().optional(),
  dateTaken:   z.string().date().nullable().optional(),
  gradeLevel:  nonEmptyString,
  academicYear,
});

export type CreatePhotoInput = z.infer<typeof CreatePhotoSchema>;

// ── Parent uploads ────────────────────────────────────────────

export const CreateParentUploadSchema = z.object({
  studentId:   uuid,
  uploadType:  z.enum(["art", "story", "poem", "recording", "other"]),
  title:       nonEmptyString,
  storagePath: nonEmptyString,
  description: z.string().nullable().optional(),
  date:        z.string().date().nullable().optional(),
  gradeLevel:  nonEmptyString,
  academicYear,
});

export type CreateParentUploadInput = z.infer<typeof CreateParentUploadSchema>;

// ── AI drafts ─────────────────────────────────────────────────

const sectionTypeEnum = z.enum([
  "student_header",
  "academic_scores",
  "math_scores",
  "english_scores",
  "immersion",
  "reading_bookshelf",
  "writing",
  "handwriting",
  "rhetoric",
  "virtue_badges",
  "photos",
  "parent_uploads",
  "teacher_profiles",
  "scope_sequence",
  "state_of_union",
]);

/**
 * Body for POST /api/ai/draft — requests an AI-generated narrative draft.
 * context is a free-form JSON blob of relevant student data that the route
 * passes to the Claude API. referenceId identifies the specific content row
 * this draft belongs to (falls back to studentId when omitted).
 */
export const CreateAiDraftRequestSchema = z.object({
  studentId:   uuid,
  sectionType: sectionTypeEnum,
  context:     z.record(z.string(), z.unknown()),
  referenceId: uuid.optional(),
});

export type CreateAiDraftRequestInput = z.infer<typeof CreateAiDraftRequestSchema>;

export const UpdateAiDraftSchema = z.object({
  contentFinal: z.string().min(1, "Final content cannot be empty"),
  status:       z.enum(["accepted", "rejected"]),
});

export type UpdateAiDraftInput = z.infer<typeof UpdateAiDraftSchema>;

// ── School settings (admin only) ──────────────────────────────

export const UpdateSchoolSchema = z.object({
  name:       nonEmptyString.optional(),
  logoUrl:    z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  themeJson: z
    .object({
      colors: z.record(z.string(), z.string()).optional(),
      fonts:  z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  enabledSections: z
    .array(
      z.enum([
        "student_header", "academic_scores", "math_scores", "english_scores",
        "immersion", "reading_bookshelf", "writing", "handwriting", "rhetoric",
        "virtue_badges", "photos", "parent_uploads", "teacher_profiles",
        "scope_sequence", "state_of_union",
      ]),
    )
    .optional(),
});

export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;

// ── Parent invite ─────────────────────────────────────────────

export const InviteParentSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export type InviteParentInput = z.infer<typeof InviteParentSchema>;

// ── Student videos (0008 migration) ──────────────────────────

const studentVideoCategoryEnum = z.enum([
  "hebrew_speaking",
  "poetry_recitation",
  "socratic_reflection",
  "immersion",
  "other",
]);

/** Body for POST /api/dashboard/students/[studentId]/videos */
export const CreateStudentVideoBodySchema = z.object({
  title:      nonEmptyString,
  videoUrl:   z.string().url("Must be a valid URL (https://...)"),
  gradeLevel: nonEmptyString,
  term:       nonEmptyString,
  category:   studentVideoCategoryEnum,
});

export type CreateStudentVideoBodyInput = z.infer<typeof CreateStudentVideoBodySchema>;

// ── Book catalog ──────────────────────────────────────────────

export const CreateBookCatalogSchema = z.object({
  title:              nonEmptyString,
  author:             nonEmptyString,
  gradeLevel:         nonEmptyString,
  yearPublished:      z.number().int().min(1000).max(9999).nullable().optional(),
  pageCount:          z.number().int().positive().nullable().optional(),
  learningObjectives: z.string().nullable().optional(),
});

export type CreateBookCatalogInput = z.infer<typeof CreateBookCatalogSchema>;
