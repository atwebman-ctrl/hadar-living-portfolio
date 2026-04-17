import { z } from 'zod'

// ============================================================
// lib/validation/profileBuilder.ts — Zod schemas for the
// Learning Profile Builder API surface. Re-exported from
// lib/validation.ts so callers can keep importing from
// '@/lib/validation'.
// ============================================================

export const CreateProfileBodySchema = z.object({
  studentId:          z.string().uuid(),
  season:             z.enum(['fall', 'spring']),
  academicYearLabel:  z.string().regex(/^\d{4}-\d{4}$/, 'Expected format: YYYY-YYYY'),
})

export type CreateProfileBodyInput = z.infer<typeof CreateProfileBodySchema>

// PATCH body for /api/dashboard/profiles/[profileId]/sections/[sectionId].
// Every field is optional; the refine guard ensures at least one field
// is present so we don't burn an UPDATE with no changes.
export const UpdateProfileSectionBodySchema = z.object({
  narrativeText:  z.string().max(10000).nullable().optional(),
  narrativeDraft: z.string().max(10000).nullable().optional(),
  status:         z.enum(['not_started', 'in_progress', 'awaiting_review', 'complete']).optional(),
}).refine(
  (data) =>
    data.narrativeText !== undefined ||
    data.narrativeDraft !== undefined ||
    data.status !== undefined,
  { message: 'At least one of narrativeText, narrativeDraft, or status must be provided.' },
)

export type UpdateProfileSectionBodyInput = z.infer<typeof UpdateProfileSectionBodySchema>
