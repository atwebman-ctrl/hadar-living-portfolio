// ============================================================
// lib/validation.test.ts
// Unit tests for Zod schemas in lib/validation.ts.
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  CreateStudentSchema,
  InviteParentSchema,
  CreateAssessmentSchema,
  validate,
  ValidationError,
} from './validation'

// Valid RFC 4122 v4 UUID for test data
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

describe('CreateStudentSchema', () => {
  const validInput = {
    firstName:    'Ayala',
    lastName:     'Cohen',
    gradeLevel:   '4',
    academicYear: '2025-2026',
  }

  it('accepts a complete valid input', () => {
    const result = CreateStudentSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.firstName).toBe('Ayala')
      expect(result.data.parentUserIds).toEqual([])   // default
      expect(result.data.isDemo).toBe(false)           // default
    }
  })

  it('rejects missing firstName', () => {
    const { firstName: _, ...rest } = validInput
    const result = CreateStudentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty firstName', () => {
    const result = CreateStudentSchema.safeParse({ ...validInput, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing lastName', () => {
    const { lastName: _, ...rest } = validInput
    const result = CreateStudentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing gradeLevel', () => {
    const { gradeLevel: _, ...rest } = validInput
    const result = CreateStudentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing academicYear', () => {
    const { academicYear: _, ...rest } = validInput
    const result = CreateStudentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects academicYear in wrong format', () => {
    const result = CreateStudentSchema.safeParse({ ...validInput, academicYear: '2025/2026' })
    expect(result.success).toBe(false)
  })

  it('rejects academicYear as plain year', () => {
    const result = CreateStudentSchema.safeParse({ ...validInput, academicYear: '2025' })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields as null', () => {
    const result = CreateStudentSchema.safeParse({
      ...validInput,
      profilePhotoPath: null,
      summary: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('InviteParentSchema', () => {
  it('accepts a valid email', () => {
    const result = InviteParentSchema.safeParse({ email: 'parent@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email (no @)', () => {
    const result = InviteParentSchema.safeParse({ email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email (no domain)', () => {
    const result = InviteParentSchema.safeParse({ email: 'user@' })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = InviteParentSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing email field', () => {
    const result = InviteParentSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('CreateAssessmentSchema', () => {
  const validInput = {
    studentId:      STUDENT_ID,
    assessmentType: 'maps_math' as const,
    term:           'Fall 2025',
    academicYear:   '2025-2026',
  }

  it('accepts a minimal valid assessment', () => {
    const result = CreateAssessmentSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts optional score and percentile', () => {
    const result = CreateAssessmentSchema.safeParse({
      ...validInput,
      score: 220,
      percentile: 85,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.score).toBe(220)
      expect(result.data.percentile).toBe(85)
    }
  })

  it('rejects percentile over 100', () => {
    const result = CreateAssessmentSchema.safeParse({ ...validInput, percentile: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects percentile below 0', () => {
    const result = CreateAssessmentSchema.safeParse({ ...validInput, percentile: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid assessmentType', () => {
    const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'sat_math' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-UUID studentId', () => {
    const result = CreateAssessmentSchema.safeParse({ ...validInput, studentId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  describe('score range superRefine', () => {
    // ── MAP tests (maps_math, maps_english) — valid range 100–350 ──

    it('accepts a MAP score at the lower boundary (100)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'maps_math', score: 100 })
      expect(result.success).toBe(true)
    })

    it('accepts a MAP score at the upper boundary (350)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'maps_english', score: 350 })
      expect(result.success).toBe(true)
    })

    it('accepts a typical MAP score in range (220)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, score: 220 })
      expect(result.success).toBe(true)
    })

    it('rejects a MAP score below the lower boundary (99)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, score: 99 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['score'])
        expect(result.error.issues[0].message).toMatch(/100/)
      }
    })

    it('rejects a MAP score above the upper boundary (351)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, score: 351 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['score'])
        expect(result.error.issues[0].message).toMatch(/350/)
      }
    })

    it('rejects a MAP score of 0', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, score: 0 })
      expect(result.success).toBe(false)
    })

    // ── AVANT tests — valid range 1–10 ──

    it('accepts an AVANT score at the lower boundary (1)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_reading', score: 1 })
      expect(result.success).toBe(true)
    })

    it('accepts an AVANT score at the upper boundary (10)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_writing', score: 10 })
      expect(result.success).toBe(true)
    })

    it('accepts a typical AVANT score in range (6)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_speaking', score: 6 })
      expect(result.success).toBe(true)
    })

    it('rejects an AVANT score below the lower boundary (0)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_listening', score: 0 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['score'])
        expect(result.error.issues[0].message).toMatch(/1/)
      }
    })

    it('rejects an AVANT score above the upper boundary (11)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_reading', score: 11 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['score'])
        expect(result.error.issues[0].message).toMatch(/10/)
      }
    })

    // ── Null / omitted score — always valid ──

    it('accepts null score for a MAP assessment (score entry is optional)', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, score: null })
      expect(result.success).toBe(true)
    })

    it('accepts null score for an AVANT assessment', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'avant_writing', score: null })
      expect(result.success).toBe(true)
    })

    it('accepts omitted score (score field not present)', () => {
      const result = CreateAssessmentSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    // ── lexile — no score range constraint ──

    it('accepts any score for a lexile assessment', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validInput, assessmentType: 'lexile', score: 820 })
      expect(result.success).toBe(true)
    })
  })
})

describe('validate helper', () => {
  it('returns parsed data for valid input', () => {
    const result = validate(InviteParentSchema, { email: 'ok@example.com' })
    expect(result.email).toBe('ok@example.com')
  })

  it('throws ValidationError for invalid input', () => {
    expect(() => validate(InviteParentSchema, { email: 'bad' })).toThrow(ValidationError)
  })

  it('ValidationError message contains field path', () => {
    try {
      validate(InviteParentSchema, { email: 'bad' })
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).message).toMatch(/email/)
    }
  })
})
