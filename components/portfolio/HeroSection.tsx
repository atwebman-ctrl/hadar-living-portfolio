import type { Student, SchoolConfig, Assessment } from '@/lib/types'

interface Props {
  student?:      Student
  school?:       SchoolConfig
  assessments?:  Assessment[]
  /** Show compressed padding for hub overview page */
  compact?:      boolean
  /** Optional action slot rendered right of the student name (e.g. InviteParentButton) */
  inviteButton?: React.ReactNode
}

// ── Demo fallbacks ────────────────────────────────────────────

const DEMO = {
  firstName:    'Athena',
  lastName:     'Lonsdale',
  gradeLevel:   'Grade 3',
  academicYear: '2025–26',
  schoolName:   'Hadar Jewish Classical Academy',
  heroSub:      'Age 8\u00a0·\u00a0Enrolled since 1st Grade\u00a0·\u00a0Hadar Jewish Classical Academy',
  summary:      null as string | null,
}

const DEMO_METRICS = [
  { lbl: "Math — Jan '26",    val: '95th',  gold: true,  ctx: 'Percentile · RIT 219' },
  { lbl: "English — Jan '26", val: '98th',  gold: true,  ctx: 'Percentile · RIT 229' },
  { lbl: 'Reading Level',     val: '1225L', gold: false, ctx: 'Upper HS / College Entry' },
  { lbl: 'Hebrew Composite',  val: '4.75',  gold: false, ctx: 'AVANT composite score' },
]

// ── Helpers ───────────────────────────────────────────────────

function shortTerm(term: string): string {
  const parts = term.split(' ')
  const season = parts[0] ?? ''
  const year   = parts[1] ?? ''
  const mon: Record<string, string> = { Fall: 'Sep', Winter: 'Jan', Spring: 'Apr' }
  return `${mon[season] ?? season} '${year.slice(2)}`
}

function latest(assessments: Assessment[], type: Assessment['assessmentType']): Assessment | null {
  return assessments
    .filter((a) => a.assessmentType === type)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0] ?? null
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

// ── Metric derivation ─────────────────────────────────────────

interface Metric { lbl: string; val: string; gold: boolean; ctx: string }

function deriveMetrics(assessments: Assessment[]): Metric[] {
  const math = latest(assessments, 'maps_math')
  const mathMetric: Metric = math?.percentile != null
    ? { lbl: `Math — ${shortTerm(math.term)}`, val: ordinal(Math.round(math.percentile)), gold: math.percentile >= 90, ctx: math.ritScore != null ? `Percentile · RIT ${math.ritScore}` : 'Percentile' }
    : { lbl: 'Math', val: '—', gold: false, ctx: 'No data yet' }

  const eng = latest(assessments, 'maps_english')
  const engMetric: Metric = eng?.percentile != null
    ? { lbl: `English — ${shortTerm(eng.term)}`, val: ordinal(Math.round(eng.percentile)), gold: eng.percentile >= 90, ctx: eng.ritScore != null ? `Percentile · RIT ${eng.ritScore}` : 'Percentile' }
    : { lbl: 'English', val: '—', gold: false, ctx: 'No data yet' }

  const lex = latest(assessments, 'lexile')
  const lexMetric: Metric = lex?.lexileValue
    ? { lbl: 'Reading Level', val: lex.lexileValue, gold: false, ctx: 'Lexile measure' }
    : { lbl: 'Reading Level', val: '—', gold: false, ctx: 'No data yet' }

  const avantTypes = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const
  const avantScores = avantTypes
    .map((t) => latest(assessments, t))
    .filter((a): a is Assessment => a != null && a.score != null)
    .map((a) => a.score as number)
  const hebMetric: Metric = avantScores.length > 0
    ? { lbl: 'Hebrew Composite', val: (avantScores.reduce((s, n) => s + n, 0) / avantScores.length).toFixed(2), gold: false, ctx: `AVANT composite (${avantScores.length} score${avantScores.length !== 1 ? 's' : ''})` }
    : { lbl: 'Hebrew Composite', val: '—', gold: false, ctx: 'No data yet' }

  return [mathMetric, engMetric, lexMetric, hebMetric]
}

// ── Component ─────────────────────────────────────────────────

export default function HeroSection({ student, school, assessments, compact, inviteButton }: Props) {
  const firstName  = student?.firstName    ?? DEMO.firstName
  const lastName   = student?.lastName     ?? DEMO.lastName
  const schoolName = school?.name          ?? DEMO.schoolName
  const summary    = student?.summary      ?? DEMO.summary
  const heroSub    = student ? schoolName  : DEMO.heroSub
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  const metrics = assessments && assessments.length > 0 ? deriveMetrics(assessments) : DEMO_METRICS

  return (
    <div className={`hero${compact ? ' compact' : ''}`} id="overview">
      {/* Name row: initials circle · name · invite button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="hero-initials">{initials}</div>
          <h1 style={{ marginBottom: 0 }}>
            {firstName}<br /><em>{lastName}</em>
          </h1>
        </div>
        {inviteButton && (
          <div style={{ paddingTop: '0.4rem', flexShrink: 0 }}>
            {inviteButton}
          </div>
        )}
      </div>

      <div className="hero-sub">{heroSub}</div>

      {summary && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginBottom: '1.25rem', maxWidth: 560, lineHeight: 1.6 }}>
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
