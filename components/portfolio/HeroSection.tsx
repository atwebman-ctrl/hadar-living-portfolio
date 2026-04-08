import type { Student, SchoolConfig, Assessment } from '@/lib/types'

interface Props {
  student?:     Student
  school?:      SchoolConfig
  assessments?: Assessment[]
}

// ── Demo fallbacks (used when rendered without props, e.g. /demo) ─────────────

const DEMO = {
  firstName:  'Athena',
  lastName:   'Lonsdale',
  gradeLevel: 'Grade 3',
  academicYear: '2025–26',
  schoolName: 'Hadar Jewish Classical Academy',
  heroSub: 'Age 8\u00a0·\u00a0Enrolled since 1st Grade\u00a0·\u00a0Hadar Jewish Classical Academy',
  summary: null as string | null,
}

const DEMO_METRICS = [
  { lbl: "Math — Jan '26",    val: '95th',  gold: true,  ctx: 'Percentile · RIT 219' },
  { lbl: "English — Jan '26", val: '98th',  gold: true,  ctx: 'Percentile · RIT 229' },
  { lbl: 'Reading Level',     val: '1225L', gold: false, ctx: 'Upper HS / College Entry' },
  { lbl: 'Hebrew Composite',  val: '4.75',  gold: false, ctx: 'AVANT composite score' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "Winter 2026" → "Jan '26" etc. */
function shortTerm(term: string): string {
  const parts = term.split(' ')
  const season = parts[0] ?? ''
  const year   = parts[1] ?? ''
  const yy     = year.slice(2)
  const mon: Record<string, string> = { Fall: 'Sep', Winter: 'Jan', Spring: 'Apr' }
  return `${mon[season] ?? season} '${yy}`
}

/** Return the latest assessment of a given type, ordered by academicYear desc. */
function latest(assessments: Assessment[], type: Assessment['assessmentType']): Assessment | null {
  const matches = assessments
    .filter((a) => a.assessmentType === type)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear))
  return matches[0] ?? null
}

/** Ordinal suffix: 1 → "1st", 2 → "2nd", 11 → "11th", 95 → "95th". */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

// ── Metric derivation ─────────────────────────────────────────────────────────

interface Metric { lbl: string; val: string; gold: boolean; ctx: string }

function deriveMetrics(assessments: Assessment[]): Metric[] {
  // ── Math ──
  const math = latest(assessments, 'maps_math')
  const mathMetric: Metric = math && math.percentile != null
    ? {
        lbl:  `Math — ${shortTerm(math.term)}`,
        val:  ordinal(Math.round(math.percentile)),
        gold: math.percentile >= 90,
        ctx:  math.ritScore != null ? `Percentile · RIT ${math.ritScore}` : 'Percentile',
      }
    : { lbl: 'Math', val: '—', gold: false, ctx: 'No data yet' }

  // ── English ──
  const eng = latest(assessments, 'maps_english')
  const engMetric: Metric = eng && eng.percentile != null
    ? {
        lbl:  `English — ${shortTerm(eng.term)}`,
        val:  ordinal(Math.round(eng.percentile)),
        gold: eng.percentile >= 90,
        ctx:  eng.ritScore != null ? `Percentile · RIT ${eng.ritScore}` : 'Percentile',
      }
    : { lbl: 'English', val: '—', gold: false, ctx: 'No data yet' }

  // ── Reading Level (Lexile) ──
  const lex = latest(assessments, 'lexile')
  const lexMetric: Metric = lex && lex.lexileValue
    ? { lbl: 'Reading Level', val: lex.lexileValue, gold: false, ctx: 'Lexile measure' }
    : { lbl: 'Reading Level', val: '—', gold: false, ctx: 'No data yet' }

  // ── Hebrew Composite (average of latest avant_ scores) ──
  const avantTypes = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const
  const avantScores = avantTypes
    .map((t) => latest(assessments, t))
    .filter((a): a is Assessment => a != null && a.score != null)
    .map((a) => a.score as number)

  const hebMetric: Metric = avantScores.length > 0
    ? {
        lbl:  'Hebrew Composite',
        val:  (avantScores.reduce((s, n) => s + n, 0) / avantScores.length).toFixed(2),
        gold: false,
        ctx:  `AVANT composite (${avantScores.length} score${avantScores.length !== 1 ? 's' : ''})`,
      }
    : { lbl: 'Hebrew Composite', val: '—', gold: false, ctx: 'No data yet' }

  return [mathMetric, engMetric, lexMetric, hebMetric]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection({ student, school, assessments }: Props) {
  const firstName  = student?.firstName   ?? DEMO.firstName
  const lastName   = student?.lastName    ?? DEMO.lastName
  const grade      = student?.gradeLevel  ?? DEMO.gradeLevel
  const year       = student?.academicYear ?? DEMO.academicYear
  const schoolName = school?.name          ?? DEMO.schoolName
  const summary    = student?.summary     ?? DEMO.summary

  const heroSub = student ? schoolName : DEMO.heroSub

  // Use real metrics when assessments are supplied; fall back to demo values.
  const metrics = assessments && assessments.length > 0
    ? deriveMetrics(assessments)
    : DEMO_METRICS

  return (
    <div className="hero" id="overview">
      <div className="hero-tag">
        {schoolName} Living Portfolio{'\u00a0'}·{'\u00a0'}{grade}{'\u00a0'}·{'\u00a0'}Academic Year {year}
      </div>

      <h1>
        {firstName}<br /><em>{lastName}</em>
      </h1>

      <div className="hero-sub">{heroSub}</div>

      {summary && (
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '.85rem',
          color: 'rgba(255,255,255,.6)',
          marginBottom: '1.75rem',
          maxWidth: 560,
          lineHeight: 1.6,
        }}>
          {summary}
        </p>
      )}

      <div className="hero-metrics">
        {metrics.map((m) => (
          <div key={m.lbl} className="hero-metric">
            <div className="lbl">{m.lbl}</div>
            <div className={`val${m.gold ? ' gold' : ''}`}>{m.val}</div>
            <div className="ctx">{m.ctx}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
