// ============================================================
// lib/constants.ts — Shared form constants
//
// Single source of truth for enum-like values used across
// multiple form components. Update here when a new term starts
// or a new grade level is added.
// ============================================================

// Re-export so every form imports from this one module
export { GRADE_SELECT_OPTIONS } from './gradeLevel'

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
