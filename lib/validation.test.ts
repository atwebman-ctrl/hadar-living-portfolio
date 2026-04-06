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
    gradeLevel:   '4th Grade',
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
