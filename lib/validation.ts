import { z } from "zod";

// ============================================================
// lib/validation.ts — Core Zod schemas for API route inputs
//
// Every API route must validate its input against one of these
// schemas before touching Supabase. school_id is NEVER accepted
// from client input — it is always derived server-side via auth.ts.
//
// Extended schemas (photos, AI drafts, school settings, etc.)
// live in lib/validationExtended.ts to keep this file under
// the 300-line limit.
// ============================================================

// ── Reusable primitives ───────────────────────────────────────

const uuid           = z.string().uuid();
const academicYear   = z.string().regex(/^\d{4}-\d{4}$/, "Expected format: YYYY-YYYY");
const nonEmptyString = z.string().min(1, "Cannot be empty");

// ── Students ──────────────────────────────────────────────────

const gradeLevelEnum = z.enum([
  'pre-k','k',
  '1','2','3','4','5','6',
  '7','8','9','10','11','12',
]);

export const CreateStudentSchema = z.object({
  firstName:        nonEmptyString,
  lastName:         nonEmptyString,
  gradeLevel:       gradeLevelEnum,
  academicYear,
  parentUserIds:    z.array(z.string()).default([]),
  profilePhotoPath: z.string().nullable().optional(),
  summary:          z.string().nullable().optional(),
  isDemo:           z.boolean().default(false),
  // 0011 profile fields — preprocess coerces empty string → null (form sends '' for unselected fields)
  gender:           z.preprocess(v => v === '' ? null : v, z.enum(['boy', 'girl']).nullable().optional()),
  dateOfBirth:      z.preprocess(v => v === '' ? null : v, z.string().date().nullable().optional()),
  enrollmentStatus: z.enum(['active', 'withdrawn', 'graduated', 'transferred']).default('active').optional(),
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;

// ── Assessments ───────────────────────────────────────────────

const assessmentTypeEnum = z.enum([
  "maps_math",
  "maps_english",
  "avant_speaking",
  "avant_reading",
  "avant_listening",
  "avant_writing",
  "lexile",
]);

// MAP RIT scores: 100–350 (industry standard range for K-12)
// AVANT proficiency scores: 1–10 (AVANT's published scale)
// Only applied when score is present — null/undefined always allowed.

function refineScoreRange(
  data: { assessmentType: string; score?: number | null },
  ctx: z.RefinementCtx,
): void {
  if (data.score == null) return;
  const { assessmentType: type, score } = data;

  if (type === "maps_math" || type === "maps_english") {
    if (score < 100 || score > 350) {
      ctx.addIssue({ code: "custom" as const, path: ["score"], message: "MAP RIT score must be between 100 and 350." });
    }
  } else if (["avant_reading", "avant_listening", "avant_speaking", "avant_writing"].includes(type)) {
    if (score < 1 || score > 10) {
      ctx.addIssue({ code: "custom" as const, path: ["score"], message: "AVANT proficiency score must be between 1 and 10." });
    }
  }
}

// Base object — plain ZodObject so .omit() / .partial() work on it.
const assessmentBaseObject = z.object({
  studentId:      uuid,
  assessmentType: assessmentTypeEnum,
  score:          z.number().nullable().optional(),
  percentile:     z.number().min(0).max(100).nullable().optional(),
  ritScore:       z.number().nullable().optional(),
  lexileValue:    z.string().nullable().optional(),
  term:           nonEmptyString,
  academicYear,
  notes:          z.string().nullable().optional(),
});

// Full create schema (includes studentId for internal use / type derivation)
export const CreateAssessmentSchema = assessmentBaseObject.superRefine(refineScoreRange);

// Body schema for POST /api/.../assessments — studentId from URL, not body.
export const CreateAssessmentBodySchema = assessmentBaseObject
  .omit({ studentId: true })
  .superRefine(refineScoreRange);

// Partial update — range check omitted (PATCH may omit assessmentType).
export const UpdateAssessmentSchema = assessmentBaseObject.omit({ studentId: true }).partial();

export type CreateAssessmentInput     = z.infer<typeof CreateAssessmentSchema>;
export type CreateAssessmentBodyInput = z.infer<typeof CreateAssessmentBodySchema>;
export type UpdateAssessmentInput     = z.infer<typeof UpdateAssessmentSchema>;

// ── Readings ──────────────────────────────────────────────────

const readingDifficultyEnum = z.enum(['below_level','on_level','above_level','stretch'])
const curriculumConnectionEnum = z.enum(['torah_studies','history','science','literature','free_choice','class_read_aloud'])

export const CreateReadingSchema = z.object({
  studentId:            uuid,
  title:                nonEmptyString,
  author:               z.string().nullable().optional(),
  academicYear,
  completed:            z.boolean().default(false),
  sortOrder:            z.number().int().default(0),
  whyChosen:            z.string().nullable().optional(),
  valuesSkills:         z.string().nullable().optional(),
  pageCount:            z.number().int().positive().nullable().optional(),
  // 0013 enhanced fields
  teacherNotes:         z.string().nullable().optional(),
  readingDifficulty:    readingDifficultyEnum.nullable().optional(),
  studentRating:        z.number().int().min(1).max(5).nullable().optional(),
  dateStarted:          z.string().nullable().optional(),
  dateFinished:         z.string().nullable().optional(),
  keyQuote:             z.string().nullable().optional(),
  curriculumConnection: curriculumConnectionEnum.nullable().optional(),
});

export const UpdateReadingSchema = CreateReadingSchema.omit({ studentId: true }).partial();

export type CreateReadingInput  = z.infer<typeof CreateReadingSchema>;
export type UpdateReadingInput  = z.infer<typeof UpdateReadingSchema>;

// ── Writing samples (full model schema) ───────────────────────

export const CreateWritingSampleSchema = z.object({
  studentId:   uuid,
  language:    z.enum(["english", "hebrew"]),
  gradeLevel:  nonEmptyString,
  title:       nonEmptyString,
  body:        z.string().nullable().optional(),
  storagePath: z.string().nullable().optional(),
  imagePath:   z.string().nullable().optional(),
  ocrText:     z.string().nullable().optional(),
  academicYear,
});

export const UpdateWritingSampleSchema = CreateWritingSampleSchema.omit({ studentId: true }).partial();

export type CreateWritingSampleInput  = z.infer<typeof CreateWritingSampleSchema>;
export type UpdateWritingSampleInput  = z.infer<typeof UpdateWritingSampleSchema>;

// ── Writing sample body (inline form — 0009 columns) ─────────

const writingGenreEnum = z.enum([
  "Essay",
  "Poetry",
  "Short Story",
  "Journal",
  "Research",
  "Other",
]);

/** Body for POST /api/dashboard/students/[studentId]/writing-samples */
export const CreateWritingSampleBodySchema = z.object({
  title:           nonEmptyString,
  genre:           writingGenreEnum,
  excerpt:         z.string().nullable().optional(),
  teacherComments: z.string().nullable().optional(),
  term:            nonEmptyString,
  academicYear,
});

export type CreateWritingSampleBodyInput = z.infer<typeof CreateWritingSampleBodySchema>;

// ── Character awards ──────────────────────────────────────────

export const CreateCharacterAwardSchema = z.object({
  studentId:             uuid,
  virtueHebrew:          nonEmptyString,
  virtueTransliteration: nonEmptyString,
  virtueEnglish:         nonEmptyString,
  awardDate:             z.string().date(),
  description:           z.string().nullable().optional(),
});

export type CreateCharacterAwardInput = z.infer<typeof CreateCharacterAwardSchema>;

/**
 * Body for POST /api/dashboard/students/[studentId]/character-awards.
 * award_date is derived from term + academicYear in the route handler.
 */
export const CreateCharacterAwardBodySchema = z.object({
  awardName:    nonEmptyString,
  description:  z.string().nullable().optional(),
  term:         nonEmptyString,
  academicYear,
});

export type CreateCharacterAwardBodyInput = z.infer<typeof CreateCharacterAwardBodySchema>;

// ── Teacher notes ─────────────────────────────────────────────

export const SECTION_CATEGORY_VALUES = [
  "intellectual_arc",
  "immersion_engine",
  "the_canon",
  "creative_evolution",
  "rhetoric_room",
  "character_arc",
  "general",
] as const;

const sectionCategoryEnum = z.enum(SECTION_CATEGORY_VALUES);

/** Body for POST /api/dashboard/students/[studentId]/teacher-notes */
export const CreateTeacherNoteBodySchema = z.object({
  noteText:         z.string().min(1, "Note text cannot be empty"),
  sectionCategory:  sectionCategoryEnum.default("general"),
  term:             z.string().optional(),
  date:             z.string().date().optional(),
  highlightQuote:   z.string().optional(),
  visibleToParents: z.boolean().default(true),
});

export type CreateTeacherNoteBodyInput = z.infer<typeof CreateTeacherNoteBodySchema>;

// ── Parent uploads ────────────────────────────────────────────

export const PARENT_UPLOAD_CATEGORY_VALUES = [
  "art_craft", "home_project", "recording",
  "certificate", "photo", "other",
] as const;

const parentUploadCategoryEnum = z.enum(PARENT_UPLOAD_CATEGORY_VALUES);

/** Body for PATCH /api/dashboard/students/[studentId]/parent-uploads/[uploadId] */
export const UpdateParentUploadSchema = z.object({
  title:       z.string().min(1).optional(),
  category:    parentUploadCategoryEnum.optional(),
  description: z.string().nullable().optional(),
});

export type UpdateParentUploadInput = z.infer<typeof UpdateParentUploadSchema>;

// ── Helper ────────────────────────────────────────────────────

/**
 * Parse and validate API input. Returns typed data or throws a
 * structured error that API routes can catch and return as 400.
 */
export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new ValidationError(messages);
  }

  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Re-export InviteParentSchema so validation.test.ts and any other
// callers that import it from this module continue to work.
export { InviteParentSchema, type InviteParentInput } from './validationExtended'
