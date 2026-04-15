// ============================================================
// lib/dashboardHelpers.ts
//
// Pure helpers that extract summary metrics from portfolio data
// for the dashboard cards on the hub overview. No React.
// ============================================================

import type { Assessment, Reading, WritingSample } from './types'

type MapType = 'maps_math' | 'maps_english'

const AVANT_TYPES = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const
type AvantType = typeof AVANT_TYPES[number]

// ── Term ordering ────────────────────────────────────────────
// Terms within an academic year run Fall → Winter → Spring.
// Lexicographic sort breaks this (Fall < Spring < Winter), so
// every comparator must use termOrdinal instead of raw term strings.
const TERM_ORDER: Record<string, number> = { Fall: 0, Winter: 1, Spring: 2 }

function termOrdinal(term: string | null | undefined): number {
  if (!term) return 0
  const [season, yearStr] = term.split(' ')
  const year = parseInt(yearStr ?? '0', 10)
  return year * 10 + (TERM_ORDER[season] ?? 0)
}

// ── Shared sort ──────────────────────────────────────────────

function compareAssessmentDesc(a: Assessment, b: Assessment): number {
  const yearCmp = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
  if (yearCmp !== 0) return yearCmp
  return termOrdinal(b.term) - termOrdinal(a.term)
}

// ── MAP scores ───────────────────────────────────────────────

export interface MapScoreSummary {
  score:      number | null
  rit:        number | null
  percentile: number | null
  delta:      number | null
  term:       string
  prevTerm:   string | null
  isYoY:      boolean
}

export function latestMapScore(assessments: Assessment[], type: MapType): MapScoreSummary | null {
  const rows = assessments
    .filter((a) => a.assessmentType === type)
    .sort(compareAssessmentDesc)
  if (rows.length === 0) return null

  const latest = rows[0]
  const latestScore = latest.ritScore ?? latest.score ?? null

  // Prefer winter-to-winter year-over-year comparison when available.
  // Fall back to the second-most-recent row so cards with limited data still show a delta.
  const prevWinter = rows.find(
    (r) => (r.term ?? '').startsWith('Winter') && r.academicYear !== latest.academicYear,
  )
  const prev  = prevWinter ?? rows[1] ?? null
  const isYoY = !!prevWinter

  const prevScore = prev ? (prev.ritScore ?? prev.score ?? null) : null
  const delta     = latestScore != null && prevScore != null ? latestScore - prevScore : null

  return {
    score:      latestScore,
    rit:        latest.ritScore,
    percentile: latest.percentile,
    delta,
    term:       latest.term,
    prevTerm:   prev?.term ?? null,
    isYoY,
  }
}

// ── AVANT composite ──────────────────────────────────────────

export type AvantSkill = 'listening' | 'reading' | 'writing' | 'speaking'

export interface AvantCompositeSummary {
  composite:      number
  level:          string
  listening:      number | null
  reading:        number | null
  writing:        number | null
  speaking:       number | null
  lowestSkill:    AvantSkill | null
  strongestSkill: AvantSkill | null
}

// Grade-equivalent bands borrowed from HebrewSection.tsx
const GRADE_BENCHMARKS = [
  { grade: '3rd', threshold: 2.49 },
  { grade: '4th', threshold: 3.44 },
  { grade: '5th', threshold: 3.86 },
  { grade: '6th', threshold: 4.75 },
]

function compositeLevel(score: number): string {
  const match = [...GRADE_BENCHMARKS].reverse().find((b) => score >= b.threshold)
  return match ? `${match.grade}-grade level` : 'Below 3rd-grade level'
}

export function latestAvantComposite(assessments: Assessment[]): AvantCompositeSummary | null {
  const rows = assessments.filter((a) => (AVANT_TYPES as readonly string[]).includes(a.assessmentType))
  if (rows.length === 0) return null

  const groups = new Map<string, { year: string; term: string; skills: Partial<Record<AvantType, number>> }>()
  for (const a of rows) {
    if (a.score == null) continue
    const key   = `${a.academicYear}||${a.term}`
    const entry = groups.get(key) ?? { year: a.academicYear ?? '', term: a.term ?? '', skills: {} }
    entry.skills[a.assessmentType as AvantType] = a.score
    groups.set(key, entry)
  }
  if (groups.size === 0) return null

  const sorted = [...groups.values()].sort((a, b) => {
    const yearCmp = b.year.localeCompare(a.year)
    if (yearCmp !== 0) return yearCmp
    return termOrdinal(b.term) - termOrdinal(a.term)
  })
  const latest = sorted[0].skills

  const listening = latest.avant_listening ?? null
  const reading   = latest.avant_reading   ?? null
  const writing   = latest.avant_writing   ?? null
  const speaking  = latest.avant_speaking  ?? null

  const present = [
    { skill: 'listening' as const, v: listening },
    { skill: 'reading'   as const, v: reading   },
    { skill: 'writing'   as const, v: writing   },
    { skill: 'speaking'  as const, v: speaking  },
  ].filter((x): x is { skill: AvantSkill; v: number } => x.v != null)

  if (present.length === 0) return null

  const composite = present.reduce((s, x) => s + x.v, 0) / present.length
  const lowest    = present.reduce((min, x) => (x.v < min.v ? x : min), present[0])
  const highest   = present.reduce((max, x) => (x.v > max.v ? x : max), present[0])

  return {
    composite,
    level: compositeLevel(composite),
    listening,
    reading,
    writing,
    speaking,
    lowestSkill:    lowest.skill,
    strongestSkill: highest.skill,
  }
}

// ── Reading metrics ──────────────────────────────────────────

export interface ReadingSummary {
  count:            number
  totalPages:       number
  avgRating:        number | null
  currentlyReading: boolean
  currentTitle:     string | null
}

export function readingMetrics(readings: Reading[]): ReadingSummary | null {
  if (readings.length === 0) return null
  const totalPages = readings.reduce((s, r) => s + (r.pageCount ?? 0), 0)
  const rated      = readings.map((r) => r.studentRating).filter((v): v is number => v != null)
  const avgRating  = rated.length > 0
    ? Math.round((rated.reduce((s, n) => s + n, 0) / rated.length) * 10) / 10
    : null
  const inProgress = readings.find((r) => !r.dateFinished)
  return {
    count:            readings.length,
    totalPages,
    avgRating,
    currentlyReading: !!inProgress,
    currentTitle:     inProgress?.title ?? null,
  }
}

// ── Composition ──────────────────────────────────────────────

export interface CompositionSummary {
  title:    string
  excerpt:  string
  language: 'english' | 'hebrew'
  date:     string | null
}

export function latestComposition(samples: WritingSample[]): CompositionSummary | null {
  if (samples.length === 0) return null
  const sorted = [...samples].sort((a, b) => {
    const ay = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
    if (ay !== 0) return ay
    return termOrdinal(b.term) - termOrdinal(a.term)
  })
  const latest = sorted[0]
  const source = latest.excerpt ?? latest.body ?? latest.ocrText ?? ''
  const excerpt = source.length > 140 ? source.slice(0, 140).trimEnd() + '…' : source
  return {
    title:    latest.title,
    excerpt,
    language: latest.language,
    date:     latest.term ?? latest.academicYear ?? null,
  }
}
