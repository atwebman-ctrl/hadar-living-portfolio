import type { Assessment } from '@/lib/types'
import AvantChart, { type AvantDataPoint } from '@/components/charts/AvantChart'

interface Props {
  assessments?: Assessment[]
}

// ── National benchmark constants (AVANT STAMP Hebrew immersion, 2022–23) ─────

const AVANT_MAX_SCALE = 10 // proficiency runs 0–10

// Grade averages used for bench card bars and grade-equivalent callout
const GRADE_BENCHMARKS = [
  { grade: '3rd', reading: 2.49, listening: 3.09 },
  { grade: '4th', reading: 3.44, listening: 3.65 },
  { grade: '5th', reading: 3.86, listening: 4.18 },
  { grade: '6th', reading: 4.75, listening: 4.75 },
]

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_CALLOUT = {
  big: '6th',
  label: 'Grade',
  text: 'A 3rd grader with 6th-grade Hebrew skills.',
  detail:
    'On the national AVANT STAMP benchmark for Hebrew immersion schools (2022–23), Athena scores ' +
    'at or above the average for students three years her senior. Her reading score of 6.0 and ' +
    'listening score of 7.0 exceed the 6th-grade national averages of 4.75.',
}

const DEMO_READING_ROWS = [
  { lbl: '3rd grade national', val: '2.49', pct: '25%', bg: 'var(--ink-faint)', opacity: 0.4, highlight: false },
  { lbl: '4th grade national', val: '3.44', pct: '34%', bg: 'var(--ink-faint)', opacity: 0.5, highlight: false },
  { lbl: '5th grade national', val: '3.86', pct: '38%', bg: 'var(--ink-faint)', opacity: 0.6, highlight: false },
  { lbl: '6th grade national', val: '4.75', pct: '47%', bg: 'var(--ink-mid)',   opacity: 0.55, highlight: false },
  { lbl: 'Athena (Grade 3)',   val: '6.00', pct: '100%', bg: 'var(--navy)',     opacity: 1, highlight: true },
]

const DEMO_LISTENING_ROWS = [
  { lbl: '3rd grade national', val: '3.09', pct: '31%', bg: 'var(--ink-faint)', opacity: 0.4, highlight: false },
  { lbl: '4th grade national', val: '3.65', pct: '36%', bg: 'var(--ink-faint)', opacity: 0.5, highlight: false },
  { lbl: '5th grade national', val: '4.18', pct: '42%', bg: 'var(--ink-faint)', opacity: 0.6, highlight: false },
  { lbl: '6th grade national', val: '4.75', pct: '48%', bg: 'var(--ink-mid)',   opacity: 0.55, highlight: false },
  { lbl: 'Athena (Grade 3)',   val: '7.00', pct: '100%', bg: 'var(--navy)',     opacity: 1, highlight: true },
]

// ── Data transformation helpers ───────────────────────────────────────────────

const AVANT_TYPES = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const

function buildAvantData(assessments: Assessment[]): AvantDataPoint[] | null {
  const avantOnly = assessments.filter((a) =>
    (AVANT_TYPES as readonly string[]).includes(a.assessmentType)
  )
  if (avantOnly.length === 0) return null

  const grouped = new Map<string, Partial<Record<string, number>>>()
  for (const a of avantOnly) {
    const key = `${a.academicYear}||${a.term}`
    const entry = grouped.get(key) ?? {}
    if (a.score !== null) entry[a.assessmentType] = a.score
    grouped.set(key, entry)
  }

  const sorted = [...grouped.entries()].sort(([a], [b]) => {
    const [yearA, termA] = a.split('||')
    const [yearB, termB] = b.split('||')
    if (yearA !== yearB) return yearA < yearB ? -1 : 1
    return termA < termB ? -1 : 1
  })

  return sorted.map(([key, entry]) => ({
    label: key.split('||')[1],
    speaking:  entry['avant_speaking']  ?? null,
    reading:   entry['avant_reading']   ?? null,
    listening: entry['avant_listening'] ?? null,
    writing:   entry['avant_writing']   ?? null,
  }))
}

/** Highest grade benchmark the student's score meets or exceeds. */
function gradeEquivalent(score: number, skill: 'reading' | 'listening'): string {
  return (
    [...GRADE_BENCHMARKS].reverse().find((b) => score >= b[skill])?.grade ?? 'Below 3rd'
  )
}

type BenchRow = { lbl: string; val: string; pct: string; bg: string; opacity: number; highlight: boolean }

function buildBenchRows(skill: 'reading' | 'listening', studentScore: number | null): BenchRow[] {
  const benchmarks: BenchRow[] = GRADE_BENCHMARKS.map((b) => ({
    lbl: `${b.grade} grade national`,
    val: b[skill].toFixed(2),
    pct: `${Math.round((b[skill] / AVANT_MAX_SCALE) * 100)}%`,
    bg: b[skill] >= 4 ? 'var(--ink-mid)' : 'var(--ink-faint)',
    opacity: 0.4 + GRADE_BENCHMARKS.indexOf(b) * 0.05,
    highlight: false,
  }))

  if (studentScore === null) return benchmarks

  return [
    ...benchmarks,
    {
      lbl: 'Current Level',
      val: studentScore.toFixed(2),
      pct: '100%',
      bg: 'var(--navy)',
      opacity: 1,
      highlight: true,
    },
  ]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BenchCard({ title, rows }: { title: string; rows: BenchRow[] }) {
  return (
    <div className="bench-card">
      <div className="skill-name">{title}</div>
      {rows.map((r) => (
        <div key={r.lbl} className="bench-bar-row">
          <div className={`bench-bar-label${r.highlight ? ' athena' : ''}`}>
            <span>{r.lbl}</span><span>{r.val}</span>
          </div>
          <div className="bench-bar-track">
            <div className="bench-bar-fill" style={{ width: r.pct, background: r.bg, opacity: r.opacity }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImmersionEngine({ assessments }: Props) {
  const hasData = !!assessments && assessments.length > 0

  const avantData = hasData ? buildAvantData(assessments!) : null

  // Latest AVANT reading and listening scores for bench cards + callout
  const latestReading = hasData
    ? (assessments!.find((a) => a.assessmentType === 'avant_reading')?.score ?? null)
    : null
  const latestListening = hasData
    ? (assessments!.find((a) => a.assessmentType === 'avant_listening')?.score ?? null)
    : null

  const readingRows  = hasData ? buildBenchRows('reading',   latestReading)  : DEMO_READING_ROWS
  const listeningRows = hasData ? buildBenchRows('listening', latestListening) : DEMO_LISTENING_ROWS

  // Callout: grade-equivalent based on reading score
  const callout = hasData && latestReading !== null
    ? {
        big: gradeEquivalent(latestReading, 'reading'),
        label: 'Grade equiv.',
        text: `AVANT Reading: ${latestReading.toFixed(2)}${latestListening !== null ? ` · Listening: ${latestListening.toFixed(2)}` : ''}`,
        detail: null,
      }
    : DEMO_CALLOUT

  return (
    <section id="hebrew">
      <div className="section-header reveal">
        <span className="section-num">02</span>
        <h2 className="section-title">The Immersion Engine</h2>
        <div className="section-rule" />
      </div>

      <div className="callout reveal">
        <div className="big" style={{ fontSize: '1.8rem', lineHeight: 1.1, textAlign: 'center' }}>
          {callout.big}<br />
          <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,.5)' }}>{callout.label}</span>
        </div>
        <div className="text">
          <strong>{callout.text}</strong>
          {callout.detail && <><br />{callout.detail}</>}
        </div>
      </div>

      <div className="chart-wrap reveal">
        <div className="chart-title">AVANT Hebrew — Four Skills Over Time</div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#1B3A6B' }} /> Speaking</span>
          <span><span className="legend-dot" style={{ background: '#B8963E' }} /> Reading</span>
          <span><span className="legend-dot" style={{ background: '#2E7D5E' }} /> Listening</span>
          <span><span className="legend-dot" style={{ background: '#7C3AED' }} /> Writing</span>
        </div>
        <div style={{ position: 'relative', height: 260 }}>
          <AvantChart data={avantData ?? undefined} />
        </div>
      </div>

      <div className="bench-grid reveal">
        <BenchCard title="Reading — vs. national averages"   rows={readingRows} />
        <BenchCard title="Listening — vs. national averages" rows={listeningRows} />
      </div>
    </section>
  )
}
