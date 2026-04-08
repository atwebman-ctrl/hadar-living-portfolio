// ============================================================
// lib/gradeLevel.ts
//
// Grade level constants, display formatting, and sort ordering.
// Used by UI components (pills, dropdowns, section headers) and
// the Add Student form. Keep in sync with the CHECK constraint
// in 0010_grade_level_enum.sql.
// ============================================================

export const GRADE_LEVELS = [
  'pre-k', 'k',
  '1', '2', '3', '4', '5', '6',
  '7', '8', '9', '10', '11', '12',
] as const

export type GradeLevel = typeof GRADE_LEVELS[number]

// Index map for deterministic sort order
const GRADE_ORDER: Record<string, number> = Object.fromEntries(
  GRADE_LEVELS.map((g, i) => [g, i])
)

/**
 * Format a raw grade value for display.
 * 'pre-k' → 'Pre-K' | 'k' → 'Kindergarten' | '3' → 'Grade 3'
 * Falls back to the raw string for unrecognised/legacy values.
 */
export function formatGrade(grade: string): string {
  if (!grade) return ''
  if (grade === 'pre-k') return 'Pre-K'
  if (grade === 'k') return 'Kindergarten'
  const n = parseInt(grade, 10)
  if (!isNaN(n) && n >= 1 && n <= 12) return `Grade ${n}`
  return grade // legacy fallback — display as-is
}

/**
 * Sort an array of grade strings by canonical order.
 * Unknown/legacy values sort to the end.
 */
export function sortGrades(grades: string[]): string[] {
  return [...grades].sort((a, b) => {
    const ai = GRADE_ORDER[a] ?? Infinity
    const bi = GRADE_ORDER[b] ?? Infinity
    return ai - bi
  })
}

/** Options for a <select> dropdown — value is the DB enum, label is display text. */
export const GRADE_SELECT_OPTIONS = GRADE_LEVELS.map((value) => ({
  value,
  label: formatGrade(value),
}))
