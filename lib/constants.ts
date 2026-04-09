// ============================================================
// lib/constants.ts — Shared form constants
//
// Single source of truth for enum-like values used across
// multiple form components. Update here when a new term starts
// or a new grade level is added.
// ============================================================

// Re-export so every form imports from this one module
export { GRADE_SELECT_OPTIONS } from './gradeLevel'

/** Academic year options in chronological order. */
export const ACADEMIC_YEAR_OPTIONS = [
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
] as const

export type AcademicYearOption = typeof ACADEMIC_YEAR_OPTIONS[number]

/** Academic term options in chronological order. */
export const TERM_OPTIONS = [
  'Fall 2024',
  'Winter 2025',
  'Spring 2025',
  'Fall 2025',
  'Winter 2026',
  'Spring 2026',
] as const

export type TermOption = typeof TERM_OPTIONS[number]

/** Gender options. */
export const GENDER_OPTIONS = [
  { value: 'boy',  label: 'Boy'  },
  { value: 'girl', label: 'Girl' },
] as const

/** Enrollment status options. */
export const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'active',      label: 'Active'      },
  { value: 'withdrawn',   label: 'Withdrawn'   },
  { value: 'graduated',   label: 'Graduated'   },
  { value: 'transferred', label: 'Transferred' },
] as const
