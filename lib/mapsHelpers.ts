// ============================================================
// lib/mapsHelpers.ts
//
// Pure helpers for the MAPS profile section: deriving the
// historical grade for a given assessment row, mapping term
// strings to seasons (for NWEA norm lookup), and ordering
// terms within an academic year.
//
// No React, no Supabase, no side effects.
// ============================================================

import type { NormSeason } from './nweaNorms'

function firstYearOf(academicYear: string): number {
  const m = academicYear.match(/^(\d{4})/)
  return m ? Number(m[1]) : NaN
}

/**
 * Given the academic year an assessment row was taken in, the
 * student's CURRENT grade, and the student's CURRENT academic
 * year, return the grade the student was in at assessment time.
 *
 * Returns the unclamped value even if it falls outside [0, 12]
 * — only logs a warning, so the caller can still surface the row.
 */
export function deriveGradeFromAcademicYear(
  academicYear:               string,
  studentCurrentGrade:        number,
  studentCurrentAcademicYear: string,
): number {
  const assessmentFirstYear = firstYearOf(academicYear)
  const currentFirstYear    = firstYearOf(studentCurrentAcademicYear)
  if (Number.isNaN(assessmentFirstYear) || Number.isNaN(currentFirstYear)) {
    console.warn(
      `[deriveGradeFromAcademicYear] unparseable year strings: ${academicYear}, ${studentCurrentAcademicYear}`,
    )
    return studentCurrentGrade
  }
  const diff = currentFirstYear - assessmentFirstYear
  const result = studentCurrentGrade - diff
  if (result < 0 || result > 12) {
    console.warn(
      `[deriveGradeFromAcademicYear] derived grade ${result} is out of K-12 range`,
    )
  }
  return result
}

// Hadar test administrations cluster around five terms per
// academic year. Map each to the NWEA reporting season.
const TERM_TO_SEASON: Record<string, NormSeason> = {
  Aug: 'fall',
  Sep: 'fall',
  Oct: 'fall',
  Nov: 'fall',
  Dec: 'winter',
  Jan: 'winter',
  Feb: 'spring',
  Mar: 'spring',
  Apr: 'spring',
  May: 'spring',
  Jun: 'spring',
  Jul: 'spring',
}

/** Map a 'Mon YYYY' term string to a NWEA season bucket. */
export function termToSeason(term: string): NormSeason {
  const m = term.match(/^([A-Za-z]{3})/)
  const key = m ? m[1] : ''
  return TERM_TO_SEASON[key] ?? 'fall'
}

// Term ordering within an academic year — Aug starts a new year,
// May closes it. Anything outside this list sorts to the end.
const TERM_ORDER: Record<string, number> = {
  Aug: 0, Sep: 1, Oct: 2, Nov: 3, Dec: 4,
  Jan: 5, Feb: 6, Mar: 7, Apr: 8, May: 9, Jun: 10, Jul: 11,
}

/** Sort index for a 'Mon YYYY' term within its academic year. */
export function termSortIndex(term: string): number {
  const m = term.match(/^([A-Za-z]{3})/)
  const key = m ? m[1] : ''
  return TERM_ORDER[key] ?? 99
}

// ---- MAPSAssessment merge helper --------------------------------

export interface MAPSAssessment {
  id:             string
  term:           string
  academicYear:   string
  grade:          number
  mathRIT:        number | null
  mathPercentile: number | null
  engRIT:         number | null
  engPercentile:  number | null
}

interface RawMapRow {
  id:              string
  assessment_type: 'maps_math' | 'maps_english'
  term:            string
  academic_year:   string
  rit_score:       number | null
  percentile:      number | null
}

/**
 * Merge raw maps_math + maps_english assessment rows into one
 * MAPSAssessment per (academicYear, term) pairing. Sorted
 * earliest → latest using termSortIndex().
 */
export function mergeMapsAssessments(
  rows:                       RawMapRow[],
  studentCurrentGrade:        number,
  studentCurrentAcademicYear: string,
): MAPSAssessment[] {
  const byKey = new Map<string, MAPSAssessment>()
  for (const r of rows) {
    const key = `${r.academic_year}::${r.term}`
    const existing = byKey.get(key) ?? {
      id:             r.id,
      term:           r.term,
      academicYear:   r.academic_year,
      grade:          deriveGradeFromAcademicYear(
                        r.academic_year,
                        studentCurrentGrade,
                        studentCurrentAcademicYear,
                      ),
      mathRIT:        null,
      mathPercentile: null,
      engRIT:         null,
      engPercentile:  null,
    }
    if (r.assessment_type === 'maps_math') {
      existing.mathRIT        = r.rit_score
      existing.mathPercentile = r.percentile
    } else {
      existing.engRIT         = r.rit_score
      existing.engPercentile  = r.percentile
    }
    byKey.set(key, existing)
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return a.academicYear.localeCompare(b.academicYear)
    }
    return termSortIndex(a.term) - termSortIndex(b.term)
  })
}
