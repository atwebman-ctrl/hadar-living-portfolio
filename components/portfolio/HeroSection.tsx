import type React from 'react'
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

// ── Pill styles ───────────────────────────────────────────────

const PILL_BASE: React.CSSProperties = {
  fontFamily:  "'Cormorant Garamond', Georgia, serif",
  fontSize:    '0.875rem',
  padding:     '0.18rem 0.7rem',
  border:      '1px solid rgba(184,160,80,0.45)',
  background:  'transparent',
  color:       'var(--ink-mid)',
  cursor:      'pointer',
  transition:  'background 0.15s ease, color 0.15s ease',
}

const PILL_ACTIVE: React.CSSProperties = {
  ...PILL_BASE,
  background: '#B8A050',
  color:      '#F7F4EE',
  border:     '1px solid #9a8540',
}

// ── StatsBar — slim ribbon below hero ─────────────────────────

interface StatsBarProps {
  assessments?:  Assessment[]
  years?:        string[]
  selectedYear?: string
  onYearChange?: (y: string) => void
}

export function StatsBar({ assessments, years, selectedYear, onYearChange }: StatsBarProps) {
  const hasMetrics = assessments && assessments.length > 0
  const filled = hasMetrics ? deriveMetrics(assessments!).filter((m) => m.val !== '—') : []
  const hasYears = years && years.length > 0

  if (filled.length === 0 && !hasYears) return null

  return (
    <div className="stats-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        {filled.map((m) => (
          <div key={m.lbl} className="stats-bar-cell">
            <div className="lbl">{m.lbl}</div>
            <div className={`val${m.gold ? ' gold' : ''}`}>{m.val}</div>
            <div className="ctx">{m.ctx}</div>
          </div>
        ))}
      </div>
      {hasYears && onYearChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, paddingLeft: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginRight: '0.3rem' }}>
            Year
          </span>
          {['all', ...(years ?? [])].map((year) => (
            <button
              key={year}
              onClick={() => onYearChange(year)}
              style={year === selectedYear ? PILL_ACTIVE : PILL_BASE}
            >
              {year === 'all' ? 'All Years' : year}
            </button>
          ))}
        </div>
      )}
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
        {summary && <p className="hero-summary">{summary}</p>}
        {inviteButton && <div style={{ marginTop: '0.75rem' }}>{inviteButton}</div>}
      </div>
      <div className="hero-school-badge">{heroSub}</div>
    </div>
  )
}
