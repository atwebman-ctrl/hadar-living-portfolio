import type { Student, SchoolConfig, Assessment } from '@/lib/types'
import { ordinal, latestAssessment } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────

interface HeroProps {
  student?:      Student
  school?:       SchoolConfig
  assessments?:  Assessment[]
  compact?:      boolean
  inviteButton?: React.ReactNode
}

interface Metric { lbl: string; val: string; gold: boolean; ctx: string }

// ── Demo fallbacks ────────────────────────────────────────────

const DEMO = {
  firstName:  'Athena',
  lastName:   'Lonsdale',
  schoolName: 'Hadar Jewish Classical Academy',
  heroSub:    'Age 8\u00a0·\u00a0Enrolled since 1st Grade\u00a0·\u00a0Hadar Jewish Classical Academy',
  summary:    null as string | null,
}

// ── Metric derivation (shared by StatsBar) ────────────────────

function shortTerm(term: string): string {
  const [season = '', year = ''] = term.split(' ')
  const mon: Record<string, string> = { Fall: 'Sep', Winter: 'Jan', Spring: 'Apr' }
  return `${mon[season] ?? season} '${year.slice(2)}`
}

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

// ── StatsBar — slim ribbon below hero ─────────────────────────

export function StatsBar({ assessments }: { assessments?: Assessment[] }) {
  if (!assessments || assessments.length === 0) return null
  const filled = deriveMetrics(assessments).filter((m) => m.val !== '—')
  if (filled.length === 0) return null

  return (
    <div className="stats-bar">
      {filled.map((m) => (
        <div key={m.lbl} className="stats-bar-cell">
          <div className="lbl">{m.lbl}</div>
          <div className={`val${m.gold ? ' gold' : ''}`}>{m.val}</div>
          <div className="ctx">{m.ctx}</div>
        </div>
      ))}
    </div>
  )
}

// ── HeroSection — identity only ───────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default function HeroSection({ student, school, compact, inviteButton }: HeroProps) {
  const firstName  = student?.firstName ?? DEMO.firstName
  const lastName   = student?.lastName  ?? DEMO.lastName
  const schoolName = school?.name       ?? DEMO.schoolName
  const summary    = student?.summary   ?? DEMO.summary
  const heroSub    = student ? schoolName : DEMO.heroSub
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = student?.profilePhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${student.profilePhotoPath}`
    : null

  return (
    <div className={`hero${compact ? ' compact' : ''}`} id="overview">
      <div className="hero-photo">
        {photoUrl
          ? <img src={photoUrl} alt={`${firstName} ${lastName}`} className="hero-initials" style={{ objectFit: 'cover', display: 'block' }} />
          : <div className="hero-initials">{initials}</div>
        }
      </div>
      <div className="hero-identity">
        <h1>{firstName}<br /><em>{lastName}</em></h1>
        <div className="hero-sub">{heroSub}</div>
        {summary && <p className="hero-summary">{summary}</p>}
        {inviteButton && <div style={{ marginTop: '0.75rem' }}>{inviteButton}</div>}
      </div>
    </div>
  )
}
