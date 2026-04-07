// ============================================================
// lib/nweaNorms.ts — NWEA MAP Growth 2025 norm lookup table
//
// Source: NWEA MAP Growth Norms 2025 (approximate published values).
// Mean RIT by grade (0=K … 8=Grade 8) and season.
// Winter = Fall mean + 5, Spring = Fall mean + 9 (typical growth).
// SD is held constant across seasons within a grade (simplification).
// ============================================================

export type NormSeason  = 'fall' | 'winter' | 'spring'
export type NormSubject = 'math' | 'reading'

// ── Fall baseline tables ──────────────────────────────────────

const MATH_FALL: Array<{ mean: number; sd: number }> = [
  { mean: 141, sd: 13 }, // K
  { mean: 162, sd: 14 }, // Grade 1
  { mean: 177, sd: 15 }, // Grade 2
  { mean: 190, sd: 15 }, // Grade 3
  { mean: 201, sd: 16 }, // Grade 4
  { mean: 211, sd: 16 }, // Grade 5
  { mean: 217, sd: 17 }, // Grade 6
  { mean: 222, sd: 18 }, // Grade 7
  { mean: 226, sd: 18 }, // Grade 8
]

const READING_FALL: Array<{ mean: number; sd: number }> = [
  { mean: 142, sd: 12 }, // K
  { mean: 160, sd: 16 }, // Grade 1
  { mean: 175, sd: 17 }, // Grade 2
  { mean: 189, sd: 17 }, // Grade 3
  { mean: 199, sd: 17 }, // Grade 4
  { mean: 207, sd: 16 }, // Grade 5
  { mean: 212, sd: 17 }, // Grade 6
  { mean: 217, sd: 17 }, // Grade 7
  { mean: 220, sd: 18 }, // Grade 8
]

const SEASON_OFFSET: Record<NormSeason, number> = {
  fall:   0,
  winter: 5,
  spring: 9,
}

// Z-scores for standard percentile cut-points
const Z = {
  p5:   -1.645,
  p25:  -0.674,
  p50:   0,
  p75:   0.674,
  p95:   1.645,
}

// ── Internal lookup ───────────────────────────────────────────

function getNorm(
  subject: NormSubject,
  grade: number,
  season: NormSeason,
): { mean: number; sd: number } {
  const table = subject === 'math' ? MATH_FALL : READING_FALL
  const base  = table[grade]
  if (!base) throw new Error(`No NWEA norm data for grade ${grade}`)
  return { mean: base.mean + SEASON_OFFSET[season], sd: base.sd }
}

// ── Public API ────────────────────────────────────────────────

export interface PercentileBandPoint {
  grade:  number
  season: NormSeason
  /** Continuous x-position: grade + (fall=0, winter=0.33, spring=0.67) */
  xPos:   number
  p5:     number
  p25:    number
  p50:    number
  p75:    number
  p95:    number
}

/**
 * Returns one PercentileBandPoint per (grade, season) pair within
 * gradeRange, suitable for building a stacked-band chart.
 */
export function getPercentileBands(
  subject: NormSubject,
  gradeRange: { start: number; end: number },
): PercentileBandPoint[] {
  const seasons: NormSeason[] = ['fall', 'winter', 'spring']
  const points: PercentileBandPoint[] = []

  for (let g = gradeRange.start; g <= gradeRange.end; g++) {
    seasons.forEach((season, si) => {
      const { mean, sd } = getNorm(subject, g, season)
      points.push({
        grade:  g,
        season,
        xPos:   g + si / 3,
        p5:     Math.round(mean + Z.p5  * sd),
        p25:    Math.round(mean + Z.p25 * sd),
        p50:    Math.round(mean),
        p75:    Math.round(mean + Z.p75 * sd),
        p95:    Math.round(mean + Z.p95 * sd),
      })
    })
  }

  return points
}
