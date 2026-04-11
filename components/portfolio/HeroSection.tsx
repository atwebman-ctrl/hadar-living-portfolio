import type { Student, SchoolConfig, Assessment } from '@/lib/types'
import { ordinal, latestAssessment } from '@/lib/utils'

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

// ── Metric derivation ─────────────────────────────────────────

interface Metric { lbl: string; val: string; gold: boolean; ctx: string }

function deriveMetrics(assessments: Assessment[]): Metric[] {
  const math = latestAssessment(assessments, 'maps_math')
  const mathMetric: Metric = math?.percentile != null
    ? { lbl: `Math — ${shortTerm(math.term)}`, val: ordinal(Math.round(math.percentile)), gold: math.percentile >= 90, ctx: math.ritScore != null ? `Percentile · RIT ${math.ritScore}` : 'Percentile' }
    : { lbl: 'Math', val: '—', gold: false, ctx: 'No data yet' }

  const eng = latestAssessment(assessments, 'maps_english')
  const engMetric: Metric = eng?.percentile != null
    ? { lbl: `English — ${shortTerm(eng.term)}`, val: ordinal(Math.round(eng.percentile)), gold: eng.percentile >= 90, ctx: eng.ritScore != null ? `Percentile · RIT ${eng.ritScore}` : 'Percentile' }
    : { lbl: 'English', val: '—', gold: false, ctx: 'No data yet' }

  const lex = latestAssessment(assessments, 'lexile')
  const lexMetric: Metric = lex?.lexileValue
    ? { lbl: 'Reading Level', val: lex.lexileValue, gold: false, ctx: 'Lexile measure' }
    : { lbl: 'Reading Level', val: '—', gold: false, ctx: 'No data yet' }

  const avantTypes = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const
  const avantScores = avantTypes
    .map((t) => latestAssessment(assessments, t))
    .filter((a): a is Assessment => a != null && a.score != null)
    .map((a) => a.score as number)
  const hebMetric: Metric = avantScores.length > 0
    ? { lbl: 'Hebrew Composite', val: (avantScores.reduce((s, n) => s + n, 0) / avantScores.length).toFixed(2), gold: false, ctx: `AVANT composite (${avantScores.length} score${avantScores.length !== 1 ? 's' : ''})` }
    : { lbl: 'Hebrew Composite', val: '—', gold: false, ctx: 'No data yet' }

  return [mathMetric, engMetric, lexMetric, hebMetric]
}

// ── Component ─────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default function HeroSection({ student, school, assessments, compact, inviteButton }: Props) {
  const firstName  = student?.firstName    ?? DEMO.firstName
  const lastName   = student?.lastName     ?? DEMO.lastName
  const schoolName = school?.name          ?? DEMO.schoolName
  const summary    = student?.summary      ?? DEMO.summary
  const heroSub    = student ? schoolName  : DEMO.heroSub
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = student?.profilePhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${student.profilePhotoPath}`
    : null

  const metrics = assessments && assessments.length > 0 ? deriveMetrics(assessments) : DEMO_METRICS

  return (
    <div className={`hero${compact ? ' compact' : ''}`} id="overview">
      {/* Left column: photo · name · school */}
      <div className="hero-left">
        {photoUrl
          ? <img src={photoUrl} alt={`${firstName} ${lastName}`} className="hero-initials" style={{ objectFit: 'cover', display: 'block', marginBottom: '0.75rem' }} />
          : <div className="hero-initials" style={{ marginBottom: '0.75rem' }}>{initials}</div>
        }
        <h1>{firstName}<br /><em>{lastName}</em></h1>
        <div className="hero-sub">{heroSub}</div>
        {summary && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '.8rem', color: 'rgba(255,255,255,.55)', margin: '0.75rem 0 0', lineHeight: 1.6 }}>
            {summary}
          </p>
        )}
        {inviteButton && (
          <div style={{ marginTop: '0.75rem' }}>{inviteButton}</div>
        )}
      </div>

      {/* Right column: 2×2 metric grid */}
      <div className="hero-right">
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
    </div>
  )
}
