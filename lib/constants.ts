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

/** Reading difficulty options (matches DB check constraint). */
export const READING_DIFFICULTY_OPTIONS = [
  { value: 'below_level', label: 'Below Level' },
  { value: 'on_level',    label: 'On Level'    },
  { value: 'above_level', label: 'Above Level' },
  { value: 'stretch',     label: 'Stretch'     },
] as const

export type ReadingDifficulty = typeof READING_DIFFICULTY_OPTIONS[number]['value']

/** Curriculum connection options (matches DB check constraint). */
export const CURRICULUM_CONNECTION_OPTIONS = [
  { value: 'torah_studies',    label: 'Torah Studies'    },
  { value: 'history',          label: 'History'          },
  { value: 'science',          label: 'Science'          },
  { value: 'literature',       label: 'Literature'       },
  { value: 'free_choice',      label: 'Free Choice'      },
  { value: 'class_read_aloud', label: 'Class Read-Aloud' },
] as const

export type CurriculumConnection = typeof CURRICULUM_CONNECTION_OPTIONS[number]['value']
