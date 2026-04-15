import type React from 'react'
import type { Student, SchoolConfig } from '@/lib/types'
import heroStyles from './HeroSection.module.css'

// ── Types ─────────────────────────────────────────────────────

interface HeroProps {
  student?:      Student
  school?:       SchoolConfig
  compact?:      boolean
  inviteButton?: React.ReactNode
}

// ── Demo fallbacks ────────────────────────────────────────────

const DEMO = {
  firstName:  'Athena',
  lastName:   'Lonsdale',
  summary:    null as string | null,
  gradeLevel: '3rd',
}

// ── Helpers ───────────────────────────────────────────────────

function computeAge(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return null
  return Math.floor((Date.now() - ts) / 31557600000)
}

// ── HeroSection — identity only ───────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default function HeroSection({ student, school, compact, inviteButton }: HeroProps) {
  const firstName  = student?.firstName  ?? DEMO.firstName
  const lastName   = student?.lastName   ?? DEMO.lastName
  const summary    = student?.summary    ?? DEMO.summary
  const gradeLevel = student?.gradeLevel ?? DEMO.gradeLevel
  const age        = computeAge(student?.dateOfBirth)
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = student?.profilePhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${student.profilePhotoPath}`
    : null

  const photoCircle: React.CSSProperties = {
    width:          72,
    height:         72,
    borderRadius:   '50%',
    border:         '2px solid var(--gold)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'linear-gradient(135deg, #C8A84B 0%, #9A7E30 100%)',
    color:          'white',
    fontFamily:     "'Cormorant Garamond', serif",
    fontSize:       '1.5rem',
    fontWeight:     600,
    letterSpacing:  '0.04em',
    flexShrink:     0,
    overflow:       'hidden',
  }

  const gradeLine: React.CSSProperties = {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.7rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.55)',
    margin:        '0.35rem 0 0',
  }

  return (
    <div className={`${heroStyles.hero}${compact ? ` ${heroStyles.compact}` : ''}`} id="overview">
      <div className={heroStyles.heroPhoto}>
        {photoUrl
          ? <img src={photoUrl} alt={`${firstName} ${lastName}`} style={{ ...photoCircle, objectFit: 'cover' }} />
          : <div style={photoCircle}>{initials}</div>
        }
      </div>
      <div className={heroStyles.heroIdentity}>
        <h1>{firstName}<br /><em>{lastName}</em></h1>
        <p style={gradeLine}>
          Grade {gradeLevel}{age !== null && ` · Age ${age}`}
        </p>
        {summary && <p className={heroStyles.heroSummary}>{summary}</p>}
        {inviteButton && <div style={{ marginTop: '0.75rem' }}>{inviteButton}</div>}
      </div>

      {/* Right side: school identity */}
      <div style={{
        marginLeft:    'auto',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        opacity:       0.5,
        flexShrink:    0,
      }}>
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={school.logoUrl}
            alt={school.name}
            style={{ maxHeight: 36, marginBottom: '0.4rem', mixBlendMode: 'screen' }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.4rem',
          }}>
            {school?.name?.charAt(0) ?? 'H'}
          </div>
        )}
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize:   '0.7rem',
          fontStyle:  'italic',
          color:      'rgba(255,255,255,0.5)',
          textAlign:  'center',
          maxWidth:   120,
          lineHeight: 1.3,
        }}>
          {school?.name ?? ''}
        </span>
      </div>
    </div>
  )
}
