import type { Assessment, AiDraft, UserRole } from '@/lib/types'
import MapsChart, { type MapsDataPoint } from '@/components/charts/MapsChart'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'

interface Props {
  assessments?:  Assessment[]
  studentId?:    string
  studentName?:  string
  role?:         UserRole
  existingDraft?: AiDraft
}

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_CALLOUT = {
  delta: '+19',
  firstPct: 76,
  lastPct: 95,
  narrative:
    'Athena entered 1st grade performing above the national average. By January 2026, she has ' +
    'accelerated into the top 5% of all students nationwide — a trajectory that demonstrates ' +
    'what classical immersion education does for a learner.',
}

// Grade-level benchmarks: constants, not from DB
const LEXILE_BENCHMARKS = [
  { lbl: '3rd Grade avg',  pct: '32%',  bg: 'var(--ink-faint)', opacity: 0.3,  val: '420L',  highlight: false },
  { lbl: '8th Grade avg',  pct: '61%',  bg: 'var(--navy)',      opacity: 0.4,  val: '1010L', highlight: false },
  { lbl: '11th Grade avg', pct: '80%',  bg: 'var(--navy)',      opacity: 0.55, val: '1200L', highlight: false },
  { lbl: 'College-ready',  pct: '100%', bg: 'var(--gold)',      opacity: 0.4,  val: '1300L', highlight: false },
]

const DEMO_STUDENT_LEXILE = { lbl: 'Athena (age 8)', pct: '90%', bg: 'var(--navy)', opacity: 1, val: '1225L', highlight: true }

const DEMO_BOOKS = 'Tales from Shakespeare · Great Expectations · The Jungle Book'

// ── Data transformation helpers ───────────────────────────────────────────────

const MAX_LEXILE = 1300

function parseLexileNum(val: string | null): number | null {
  if (!val) return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

/**
 * Groups MAPS assessments by (academicYear, term) and sorts chronologically.
 * Returns null when there are no MAPS assessments.
 */
function buildMapsData(assessments: Assessment[]): MapsDataPoint[] | null {
  const mapsOnly = assessments.filter(
    (a) => a.assessmentType === 'maps_math' || a.assessmentType === 'maps_english'
  )
  if (mapsOnly.length === 0) return null

  // Group by a composite key so we can pair English+Math for the same sitting
  const grouped = new Map<string, { english?: Assessment; math?: Assessment }>()
  for (const a of mapsOnly) {
    const key = `${a.academicYear}||${a.term}`
    const entry = grouped.get(key) ?? {}
    if (a.assessmentType === 'maps_english') entry.english = a
    else entry.math = a
    grouped.set(key, entry)
  }

  // Sort chronologically: academicYear ASC, then term alphabetically within a year
  // (DB returns newest-first; alphabetical is best-effort within a year)
  const sorted = [...grouped.entries()].sort(([a], [b]) => {
    const [yearA, termA] = a.split('||')
    const [yearB, termB] = b.split('||')
    if (yearA !== yearB) return yearA < yearB ? -1 : 1
    return termA < termB ? -1 : 1
  })

  return sorted.map(([key, entry]) => ({
    label: key.split('||')[1],
    englishRit: entry.english?.ritScore ?? null,
    mathRit:    entry.math?.ritScore    ?? null,
    englishPct: entry.english?.percentile ?? null,
    mathPct:    entry.math?.percentile    ?? null,
  }))
}

/**
 * Computes the math percentile delta from the earliest to latest MAPS math assessment.
 * Returns null when fewer than two data points exist.
 */
function getMathCallout(assessments: Assessment[]): {
  delta: string | null
  firstPct: number | null
  lastPct: number | null
  narrative: string | null
} {
  const mathPcts = assessments
    .filter((a) => a.assessmentType === 'maps_math' && a.percentile !== null)
    .map((a) => a.percentile as number)

  if (mathPcts.length < 2) return { delta: null, firstPct: null, lastPct: null, narrative: null }

  // DB order is newest-first
  const latest   = mathPcts[0]
  const earliest = mathPcts[mathPcts.length - 1]
  const diff     = latest - earliest

  return {
    delta: (diff >= 0 ? '+' : '') + String(diff),
    firstPct: earliest,
    lastPct: latest,
    narrative: null, // narrative is teacher-authored; not yet stored in DB
  }
}

/**
 * Assembles the context payload sent to POST /api/ai/draft for the
 * academic_scores section: latest MAPS percentiles, Lexile value, math delta.
 */
function buildDraftContext(
  assessments: Assessment[],
  delta: string | null,
  firstPct: number | null,
  lastPct: number | null,
  studentFirstName: string | null,
): Record<string, unknown> {
  const mathRows    = assessments.filter((a) => a.assessmentType === 'maps_math' && a.percentile !== null)
  const englishRows = assessments.filter((a) => a.assessmentType === 'maps_english' && a.percentile !== null)
  const lexile      = assessments.find((a) => a.assessmentType === 'lexile')
  return {
    studentFirstName,
    mathPercentileLatest:    mathRows[0]?.percentile    ?? null,
    mathPercentileEarliest:  mathRows[mathRows.length - 1]?.percentile ?? null,
    mathDelta:               delta,
    mathFromPct:             firstPct,
    mathToPct:               lastPct,
    englishPercentileLatest: englishRows[0]?.percentile ?? null,
    lexile:                  lexile?.lexileValue ?? null,
  }
}

/**
 * Builds the student's Lexile bar row from the most recent lexile assessment.
 * Returns null when no lexile assessment exists.
 */
function buildStudentLexileRow(assessments: Assessment[]) {
  const lexile = assessments.find((a) => a.assessmentType === 'lexile')
  if (!lexile?.lexileValue) return null

  const num = parseLexileNum(lexile.lexileValue)
  if (num === null) return null

  const pct = `${Math.min(100, Math.round((num / MAX_LEXILE) * 100))}%`
  return {
    lbl: 'Current Level',
    pct,
    bg: 'var(--navy)',
    opacity: 1,
    val: lexile.lexileValue,
    highlight: true,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IntellectualArc({ assessments, studentId, studentName, role, existingDraft }: Props) {
  const hasData = !!assessments && assessments.length > 0

  // MAPS chart
  const mapsData   = hasData ? buildMapsData(assessments!) : null

  // Callout
  const callout    = hasData ? getMathCallout(assessments!) : null
  const deltaText  = callout?.delta ?? DEMO_CALLOUT.delta
  const firstPct   = callout?.firstPct ?? DEMO_CALLOUT.firstPct
  const lastPct    = callout?.lastPct  ?? DEMO_CALLOUT.lastPct
  const narrative  = callout?.narrative ?? DEMO_CALLOUT.narrative

  // AI narrative context — only computed when teacher/admin view is active
  const draftContext = (studentId && role && role !== 'parent' && hasData)
    ? buildDraftContext(assessments!, callout?.delta ?? null, callout?.firstPct ?? null, callout?.lastPct ?? null, studentName ?? null)
    : null

  // Lexile bars: benchmarks are always shown; student row is dynamic or demo
  const studentRow = hasData ? buildStudentLexileRow(assessments!) : DEMO_STUDENT_LEXILE
  const lexileRows = studentRow
    ? [...LEXILE_BENCHMARKS.slice(0, 3), studentRow, LEXILE_BENCHMARKS[3]]
    : LEXILE_BENCHMARKS

  return (
    <section id="academics">
      <div className="section-header reveal">
        <span className="section-num">01</span>
        <h2 className="section-title">The Intellectual Arc</h2>
        <div className="section-rule" />
      </div>

      <div className="callout reveal">
        <div className="big">{deltaText}</div>
        <div className="text">
          <strong>From {firstPct}th to {lastPct}th percentile in math across two years.</strong>
          {narrative && <><br />{narrative}</>}
        </div>
      </div>

      {/* AI narrative panel — teacher/admin: generate/review; parent: accepted text only */}
      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="academic_scores"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}

      <div className="chart-wrap reveal">
        <div className="chart-title">MAPS RIT Scores — Grade 1 through Grade 3</div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#1B3A6B' }} /> English (RIT)</span>
          <span><span className="legend-dot" style={{ background: '#B8963E' }} /> Math (RIT)</span>
        </div>
        <div style={{ position: 'relative', height: 260 }}>
          {/* Pass undefined when no real data — MapsChart falls back to its own demo data */}
          <MapsChart data={mapsData ?? undefined} />
        </div>
      </div>

      <div className="chart-wrap reveal">
        <div className="chart-title">Lexile Reading Level vs. Grade Benchmarks</div>
        <p style={{ marginBottom: 8, fontStyle: 'italic', fontSize: '.85rem', color: 'var(--ink-light)' }}>
          {hasData
            ? 'Reading level compared to national grade-level benchmarks.'
            : 'At age 8, Athena reads at the same level as college-entry seniors. Her current range ' +
              '(1150–1300L) aligns with 11th–12th grade readiness benchmarks.'}
        </p>
        <div style={{ marginTop: '1.25rem' }}>
          {lexileRows.map((r) => (
            <div key={r.lbl} className="lexile-row">
              <span
                className="lexile-lbl"
                style={r.highlight ? { color: 'var(--navy)', fontWeight: 500 } : undefined}
              >
                {r.lbl}
              </span>
              <div
                className="lexile-bar-outer"
                style={r.highlight ? { background: 'rgba(27,58,107,.1)' } : undefined}
              >
                <div
                  className="lexile-bar-inner"
                  style={{ width: r.pct, background: r.bg, opacity: r.opacity }}
                />
              </div>
              <span
                className="lexile-val"
                style={r.highlight ? { color: 'var(--navy)', fontWeight: 500 } : undefined}
              >
                {r.val}
              </span>
            </div>
          ))}
        </div>
        {!hasData && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--rule)', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink-light)' }}>
            Currently reading:{' '}
            <em style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{DEMO_BOOKS}</em>
          </div>
        )}
      </div>
    </section>
  )
}
