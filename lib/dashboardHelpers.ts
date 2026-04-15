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

// ── Shared sort ──────────────────────────────────────────────

function compareAssessmentDesc(a: Assessment, b: Assessment): number {
  const yearCmp = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
  if (yearCmp !== 0) return yearCmp
  return (b.term ?? '').localeCompare(a.term ?? '')
}

function sortAscChronological(a: Assessment, b: Assessment): number {
  const yearCmp = (a.academicYear ?? '').localeCompare(b.academicYear ?? '')
  if (yearCmp !== 0) return yearCmp
  return (a.term ?? '').localeCompare(b.term ?? '')
}

// ── MAP scores ───────────────────────────────────────────────

export interface MapScoreSummary {
  score:      number | null
  rit:        number | null
  percentile: number | null
  delta:      number | null
  term:       string
  prevTerm:   string | null
}

export function latestMapScore(assessments: Assessment[], type: MapType): MapScoreSummary | null {
  const rows = assessments
    .filter((a) => a.assessmentType === type)
    .sort(compareAssessmentDesc)
  if (rows.length === 0) return null
  const [latest, prev] = rows
  const latestScore = latest.ritScore ?? latest.score ?? null
  const prevScore   = prev ? (prev.ritScore ?? prev.score ?? null) : null
  const delta       = latestScore != null && prevScore != null ? latestScore - prevScore : null
  return {
    score:      latestScore,
    rit:        latest.ritScore,
    percentile: latest.percentile,
    delta,
    term:       latest.term,
    prevTerm:   prev?.term ?? null,
  }
}

// ── AVANT composite ──────────────────────────────────────────

export interface AvantCompositeSummary {
  composite:   number
  level:       string
  listening:   number | null
  reading:     number | null
  writing:     number | null
  speaking:    number | null
  lowestSkill: 'listening' | 'reading' | 'writing' | 'speaking' | null
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

  const groups = new Map<string, Partial<Record<AvantType, number>>>()
  for (const a of rows) {
    if (a.score == null) continue
    const key = `${a.academicYear}||${a.term}`
    const entry = groups.get(key) ?? {}
    entry[a.assessmentType as AvantType] = a.score
    groups.set(key, entry)
  }
  if (groups.size === 0) return null

  const sorted = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
  const [, latest] = sorted[0]

  const listening = latest.avant_listening ?? null
  const reading   = latest.avant_reading   ?? null
  const writing   = latest.avant_writing   ?? null
  const speaking  = latest.avant_speaking  ?? null

  const present = [
    { skill: 'listening' as const, v: listening },
    { skill: 'reading'   as const, v: reading   },
    { skill: 'writing'   as const, v: writing   },
    { skill: 'speaking'  as const, v: speaking  },
  ].filter((x): x is { skill: 'listening'|'reading'|'writing'|'speaking'; v: number } => x.v != null)

  if (present.length === 0) return null

  const composite = present.reduce((s, x) => s + x.v, 0) / present.length
  const lowest    = present.reduce((min, x) => (x.v < min.v ? x : min), present[0])

  return {
    composite,
    level: compositeLevel(composite),
    listening,
    reading,
    writing,
    speaking,
    lowestSkill: lowest.skill,
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
    return (b.term ?? '').localeCompare(a.term ?? '')
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

// ── Sparkline ────────────────────────────────────────────────

export function sparklinePoints(
  assessments: Assessment[],
  type: MapType,
): { x: number; y: number }[] {
  const rows = assessments
    .filter((a) => a.assessmentType === type)
    .sort(sortAscChronological)
    .slice(-6)
    .map((a) => a.ritScore ?? a.score)
    .filter((v): v is number => v != null)

  if (rows.length === 0) return []
  if (rows.length === 1) return [{ x: 100, y: 22 }]

  const min = Math.min(...rows)
  const max = Math.max(...rows)
  const range = max - min || 1
  const step  = rows.length > 1 ? 200 / (rows.length - 1) : 0

  return rows.map((v, i) => {
    const x = Math.round(i * step)
    // y=6 (top) for max, y=38 (bottom) for min — invert since SVG y grows down
    const y = Math.round(6 + ((max - v) / range) * 32)
    return { x, y }
  })
}
