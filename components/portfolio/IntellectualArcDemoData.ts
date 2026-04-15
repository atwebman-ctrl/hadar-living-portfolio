import type { ScoreDisplayRow } from '@/components/portfolio/SubjectScoreRows'
import type { StudentScorePoint } from '@/components/charts/MapPercentileChart'

export const DEMO_MATH_ROWS: ScoreDisplayRow[] = [
  { term: 'Spring 2025', academicYear: '2024-2025', ritScore: 231, score: null, percentile: 95, gradeLevel: 'Gr 3' },
  { term: 'Fall 2024',   academicYear: '2024-2025', ritScore: 224, score: null, percentile: 90, gradeLevel: 'Gr 3' },
  { term: 'Spring 2024', academicYear: '2023-2024', ritScore: 215, score: null, percentile: 82, gradeLevel: 'Gr 2' },
  { term: 'Fall 2023',   academicYear: '2023-2024', ritScore: 208, score: null, percentile: 76, gradeLevel: 'Gr 2' },
]

export const DEMO_ENGLISH_ROWS: ScoreDisplayRow[] = [
  { term: 'Spring 2025', academicYear: '2024-2025', ritScore: 218, score: null, percentile: 89, gradeLevel: 'Gr 3' },
  { term: 'Fall 2024',   academicYear: '2024-2025', ritScore: 212, score: null, percentile: 85, gradeLevel: 'Gr 3' },
  { term: 'Spring 2024', academicYear: '2023-2024', ritScore: 205, score: null, percentile: 78, gradeLevel: 'Gr 2' },
  { term: 'Fall 2023',   academicYear: '2023-2024', ritScore: 198, score: null, percentile: 72, gradeLevel: 'Gr 2' },
]

export const DEMO_MATH_SCORES: StudentScorePoint[] = [
  { grade: 1, season: 'fall',   ritScore: 179 },
  { grade: 1, season: 'spring', ritScore: 194 },
  { grade: 2, season: 'fall',   ritScore: 188 },
  { grade: 2, season: 'winter', ritScore: 199 },
  { grade: 2, season: 'spring', ritScore: 211 },
  { grade: 3, season: 'fall',   ritScore: 214 },
  { grade: 3, season: 'winter', ritScore: 219 },
]

export const DEMO_READING_SCORES: StudentScorePoint[] = [
  { grade: 1, season: 'fall',   ritScore: 183 },
  { grade: 1, season: 'spring', ritScore: 193 },
  { grade: 2, season: 'fall',   ritScore: 216 },
  { grade: 2, season: 'winter', ritScore: 212 },
  { grade: 2, season: 'spring', ritScore: 221 },
  { grade: 3, season: 'fall',   ritScore: 216 },
  { grade: 3, season: 'winter', ritScore: 229 },
]

export const LEXILE_BENCHMARKS = [
  { lbl: '3rd Grade avg',  pct: '32%',  bg: 'var(--ink-faint)', opacity: 0.3,  val: '420L',  highlight: false },
  { lbl: '8th Grade avg',  pct: '61%',  bg: 'var(--navy)',      opacity: 0.4,  val: '1010L', highlight: false },
  { lbl: '11th Grade avg', pct: '80%',  bg: 'var(--navy)',      opacity: 0.55, val: '1200L', highlight: false },
  { lbl: 'College-ready',  pct: '100%', bg: 'var(--gold)',      opacity: 0.4,  val: '1300L', highlight: false },
]

export const DEMO_STUDENT_LEXILE = { lbl: 'Athena (age 8)', pct: '90%', bg: 'var(--navy)', opacity: 1, val: '1225L', highlight: true }
export const DEMO_BOOKS = 'Tales from Shakespeare · Great Expectations · The Jungle Book'

export const DEMO_MATH_NARRATIVE = "Athena\u2019s mathematics trajectory is one of the most consistent upward arcs we\u2019ve seen in the cohort. From a 76th-percentile start in Fall 2023 she has climbed to the 95th percentile by Spring 2025 \u2014 a 19-point percentile gain across seven sittings, with no regressions between seasons. What\u2019s unusual is the shape of the growth: she is not a calculator, she is a pattern reader. In class she volunteers for the problems with no obvious procedure and talks her way through them aloud, often arriving at the answer a beat before her hand goes up. Next year we\u2019ll introduce her to the first ideas in number theory and pre-algebra \u2014 her intuition is ready for them."
