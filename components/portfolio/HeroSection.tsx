import type React from 'react'
import type { Student, SchoolConfig, Assessment } from '@/lib/types'
import { ordinal, latestAssessment } from '@/lib/utils'
import heroStyles from './HeroSection.module.css'
import sbStyles from './StatsBar.module.css'

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
  summary:    null as string | null,
}

// ── Metric derivation (shared by StatsBar) ────────────────────

function shortTerm(term: string): string {
  const words = term.split(' ')
  const year = words[words.length - 1]
  const season = words[0]
  const mon: Record<string, string> = { Fall: 'Sep', Winter: 'Jan', Spring: 'Apr' }
  const monAbbr = mon[season] ?? season
  const yy = year.length >= 2 ? year.slice(-2) : ''
  return yy ? `${monAbbr} '${yy}` : monAbbr
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
    <div className={sbStyles.statsBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        {filled.map((m) => (
          <div key={m.lbl} className={sbStyles.statsBarCell}>
            <div className={sbStyles.lbl}>{m.lbl}</div>
            <div className={`${sbStyles.val}${m.gold ? ` ${sbStyles.gold}` : ''}`}>{m.val}</div>
            <div className={sbStyles.ctx}>{m.ctx}</div>
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
  const summary    = student?.summary   ?? DEMO.summary
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = student?.profilePhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${student.profilePhotoPath}`
    : null

  return (
    <div className={`${heroStyles.hero}${compact ? ` ${heroStyles.compact}` : ''}`} id="overview">
      <div className={heroStyles.heroPhoto}>
        {photoUrl
          ? <img src={photoUrl} alt={`${firstName} ${lastName}`} className={heroStyles.heroInitials} style={{ objectFit: 'cover', display: 'block' }} />
          : <div className={heroStyles.heroInitials}>{initials}</div>
        }
      </div>
      <div className={heroStyles.heroIdentity}>
        <h1>{firstName}<br /><em>{lastName}</em></h1>
        {summary && <p className={heroStyles.heroSummary}>{summary}</p>}
        {inviteButton && <div style={{ marginTop: '0.75rem' }}>{inviteButton}</div>}
      </div>

      {/* Right side: school identity */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: 0.35,
        flexShrink: 0,
      }}>
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt={school.name} style={{ maxHeight: 56, marginBottom: '0.4rem', mixBlendMode: 'screen' }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)',
            marginBottom: '0.4rem',
          }}>
            {school?.name?.charAt(0) ?? 'H'}
          </div>
        )}
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '0.7rem',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
          maxWidth: 120,
          lineHeight: 1.3,
        }}>
          {school?.name ?? ''}
        </span>
      </div>
    </div>
  )
}
