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
