// ============================================================
// lib/avantHelpers.ts
//
// Pure helpers for the AVANT Hebrew profile section: merging
// raw per-skill assessment rows into one record per (year, term).
//
// TODO: when a 4th assessment-style section lands, refactor the
// shared grade/season logic out of mapsHelpers.ts into a neutral
// lib/assessmentHelpers.ts. For now, importing across files is fine.
// ============================================================

import { deriveGradeFromAcademicYear, termSortIndex } from './mapsHelpers'

export interface AVANTAssessment {
  id:           string
  term:         string
  academicYear: string
  grade:        number
  speaking:     number | null
  reading:      number | null
  listening:    number | null
  writing:      number | null
}

interface RawAvantRow {
  id:              string
  assessment_type: 'avant_speaking' | 'avant_reading' | 'avant_listening' | 'avant_writing'
  term:            string
  academic_year:   string
  score:           number | null
}

const SKILL_KEY: Record<RawAvantRow['assessment_type'], keyof Pick<AVANTAssessment, 'speaking' | 'reading' | 'listening' | 'writing'>> = {
  avant_speaking:  'speaking',
  avant_reading:   'reading',
  avant_listening: 'listening',
  avant_writing:   'writing',
}

/**
 * Merge raw avant_* assessment rows into one AVANTAssessment per
 * (academicYear, term) pairing. Sorted earliest → latest using
 * termSortIndex().
 */
export function mergeAvantAssessments(
  rows:                       RawAvantRow[],
  studentCurrentGrade:        number,
  studentCurrentAcademicYear: string,
): AVANTAssessment[] {
  const byKey = new Map<string, AVANTAssessment>()
  for (const r of rows) {
    const key = `${r.academic_year}::${r.term}`
    const existing = byKey.get(key) ?? {
      id:           r.id,
      term:         r.term,
      academicYear: r.academic_year,
      grade:        deriveGradeFromAcademicYear(
                      r.academic_year,
                      studentCurrentGrade,
                      studentCurrentAcademicYear,
                    ),
      speaking:  null,
      reading:   null,
      listening: null,
      writing:   null,
    }
    const skill = SKILL_KEY[r.assessment_type]
    if (skill) existing[skill] = r.score
    byKey.set(key, existing)
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return a.academicYear.localeCompare(b.academicYear)
    }
    return termSortIndex(a.term) - termSortIndex(b.term)
  })
}
