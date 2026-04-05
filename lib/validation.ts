import { z } from "zod";

// ============================================================
// lib/validation.ts — Zod schemas for all API route inputs
//
// Every API route must validate its input against one of these
// schemas before touching Supabase. school_id is NEVER accepted
// from client input — it is always derived server-side via auth.ts.
// ============================================================

// ── Reusable primitives ───────────────────────────────────────

const uuid = z.string().uuid();
const academicYear = z.string().regex(/^\d{4}-\d{4}$/, "Expected format: YYYY-YYYY");
const nonEmptyString = z.string().min(1, "Cannot be empty");

// ── Students ──────────────────────────────────────────────────

export const CreateStudentSchema = z.object({
  firstName: nonEmptyString,
  lastName: nonEmptyString,
  gradeLevel: nonEmptyString,
  academicYear,
  parentUserIds: z.array(z.string()).default([]),
  profilePhotoPath: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  isDemo: z.boolean().default(false),
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

export const CreateAssessmentSchema = z.object({
  studentId: uuid,
  assessmentType: assessmentTypeEnum,
  score: z.number().nullable().optional(),
  percentile: z.number().min(0).max(100).nullable().optional(),
  ritScore: z.number().nullable().optional(),
  lexileValue: z.string().nullable().optional(),
  term: nonEmptyString,
  academicYear,
  notes: z.string().nullable().optional(),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.omit({ studentId: true }).partial();

export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;

// ── Readings ──────────────────────────────────────────────────

export const CreateReadingSchema = z.object({
  studentId: uuid,
  title: nonEmptyString,
  author: z.string().nullable().optional(),
  academicYear,
  completed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  whyChosen: z.string().nullable().optional(),
  valuesSkills: z.string().nullable().optional(),
  pageCount: z.number().int().positive().nullable().optional(),
});

export const UpdateReadingSchema = CreateReadingSchema.omit({ studentId: true }).partial();

export type CreateReadingInput = z.infer<typeof CreateReadingSchema>;
export type UpdateReadingInput = z.infer<typeof UpdateReadingSchema>;

// ── Writing samples ───────────────────────────────────────────

export const CreateWritingSampleSchema = z.object({
  studentId: uuid,
  language: z.enum(["english", "hebrew"]),
  gradeLevel: nonEmptyString,
  title: nonEmptyString,
  body: z.string().nullable().optional(),
  storagePath: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  ocrText: z.string().nullable().optional(),
  academicYear,
});

export const UpdateWritingSampleSchema = CreateWritingSampleSchema.omit({ studentId: true }).partial();

export type CreateWritingSampleInput = z.infer<typeof CreateWritingSampleSchema>;
export type UpdateWritingSampleInput = z.infer<typeof UpdateWritingSampleSchema>;

// ── Videos ───────────────────────────────────────────────────

const videoTypeEnum = z.enum([
  "rhetoric",
  "reading_aloud",
  "hebrew_speech",
  "presentation",
]);

export const CreateVideoSchema = z
  .object({
    studentId: uuid,
    videoType: videoTypeEnum,
    title: nonEmptyString,
    description: z.string().nullable().optional(),
    storagePath: z.string().nullable().optional(),
    externalUrl: z.string().url().nullable().optional(),
    thumbnailPath: z.string().nullable().optional(),
    recordedAt: z.string().date().nullable().optional(),
    academicYear,
  })
  .refine(
    (data) =>
      (data.storagePath != null) !== (data.externalUrl != null),
    "Exactly one of storagePath or externalUrl must be provided."
  );

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

// ── Character awards ──────────────────────────────────────────

export const CreateCharacterAwardSchema = z.object({
  studentId: uuid,
  virtueHebrew: nonEmptyString,
  virtueTransliteration: nonEmptyString,
  virtueEnglish: nonEmptyString,
  awardDate: z.string().date(),
  description: z.string().nullable().optional(),
});

export type CreateCharacterAwardInput = z.infer<typeof CreateCharacterAwardSchema>;

// ── Photos ────────────────────────────────────────────────────

export const CreatePhotoSchema = z.object({
  studentId: uuid,
  storagePath: nonEmptyString,
  caption: z.string().nullable().optional(),
  dateTaken: z.string().date().nullable().optional(),
  gradeLevel: nonEmptyString,
  academicYear,
});

export type CreatePhotoInput = z.infer<typeof CreatePhotoSchema>;

// ── Parent uploads ────────────────────────────────────────────

export const CreateParentUploadSchema = z.object({
  studentId: uuid,
  uploadType: z.enum(["art", "story", "poem", "recording", "other"]),
  title: nonEmptyString,
  storagePath: nonEmptyString,
  description: z.string().nullable().optional(),
  date: z.string().date().nullable().optional(),
  gradeLevel: nonEmptyString,
  academicYear,
});

export type CreateParentUploadInput = z.infer<typeof CreateParentUploadSchema>;

// ── AI drafts ─────────────────────────────────────────────────

const sectionTypeEnum = z.enum([
  "student_header",
  "academic_scores",
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
 * context is a free-form JSON blob of relevant student data (e.g. assessment
 * rows, writing sample text) that the route passes to the Claude API.
 * referenceId is optional: when provided it identifies the specific content
 * row this draft belongs to. Falls back to studentId when omitted.
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
  status: z.enum(["accepted", "rejected"]),
});

export type UpdateAiDraftInput = z.infer<typeof UpdateAiDraftSchema>;

// ── School settings (admin only) ──────────────────────────────

export const UpdateSchoolSchema = z.object({
  name: nonEmptyString.optional(),
  logoUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  themeJson: z
    .object({
      colors: z.record(z.string(), z.string()).optional(),
      fonts: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  enabledSections: z
    .array(
      z.enum([
        "student_header",
        "academic_scores",
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
      ])
    )
    .optional(),
});

export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;

// ── Parent invite ─────────────────────────────────────────────

export const InviteParentSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export type InviteParentInput = z.infer<typeof InviteParentSchema>;

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
