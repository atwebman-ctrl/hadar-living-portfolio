// ============================================================
// lib/utils.ts
// Shared utility functions used across portfolio components.
// ============================================================

import type { Assessment } from '@/lib/types'

/**
 * Returns the ordinal string for a number (1 → "1st", 2 → "2nd", etc.).
 */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/**
 * Returns the most recent assessment of the given type (by academicYear desc), or null.
 */
export function latestAssessment(assessments: Assessment[], type: string): Assessment | null {
  return assessments
    .filter((a) => a.assessmentType === type)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0] ?? null
}
