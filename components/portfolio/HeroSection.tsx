'use client'

import type React from 'react'
import Image from 'next/image'
import type { Student, SchoolConfig, Assessment, UserRole } from '@/lib/types'
import { ordinal } from '@/lib/utils'
import InlineEditableText from '@/components/shared/InlineEditableText'
import heroStyles from './HeroSection.module.css'

// ── Types ─────────────────────────────────────────────────────

interface HeroProps {
  student?:      Student
  school?:       SchoolConfig
  compact?:      boolean
  inviteButton?: React.ReactNode
  studentId?:    string
  assessments?:  Assessment[]
  role?:         UserRole
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

function topAccomplishment(assessments?: Assessment[]): string | null {
  if (!assessments?.length) return null
  let best: { pct: number; label: string } | null = null
  for (const a of assessments) {
    if (a.percentile == null) continue
    const label =
      a.assessmentType === 'maps_math'    ? 'math'    :
      a.assessmentType === 'maps_english' ? 'reading' : null
    if (!label) continue
    if (!best || a.percentile > best.pct) best = { pct: a.percentile, label }
  }
  return best ? `${ordinal(best.pct)} percentile in ${best.label}` : null
}

// ── HeroSection — identity only ───────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default function HeroSection({
  student, school, compact, inviteButton, studentId, assessments, role,
}: HeroProps) {
  const firstName  = student?.firstName  ?? DEMO.firstName
  const lastName   = student?.lastName   ?? DEMO.lastName
  const summary    = student?.summary    ?? DEMO.summary
  const gradeLevel = student?.gradeLevel ?? DEMO.gradeLevel
  const age        = computeAge(student?.dateOfBirth)
  const highlight  = topAccomplishment(assessments)
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const photoUrl   = student?.profilePhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${student.profilePhotoPath}`
    : null

  const canEdit = !!studentId && (role === 'admin' || role === 'teacher')

  const saveSummary = async (next: string) => {
    if (!studentId) return
    const res = await fetch(`/api/dashboard/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ summary: next }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Failed to save summary')
    }
  }

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

  const summaryTextStyle: React.CSSProperties = {
    fontFamily: 'DM Mono, monospace',
    fontSize:   '0.8rem',
    color:      'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
    maxWidth:   560,
    margin:     '0.6rem 0 0',
  }

  return (
    <div className={`${heroStyles.hero}${compact ? ` ${heroStyles.compact}` : ''}`} id="overview">
      <div className={heroStyles.heroPhoto}>
        {photoUrl
          ? (
            <div style={{ ...photoCircle, position: 'relative' }}>
              <Image
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )
          : <div style={photoCircle}>{initials}</div>
        }
      </div>
      <div className={heroStyles.heroIdentity}>
        <h1>{firstName}<br /><em>{lastName}</em></h1>
        <p style={gradeLine}>
          Grade {gradeLevel}{age !== null && ` · Age ${age}`}{highlight && ` · ${highlight}`}
        </p>
        {(canEdit || (summary && summary.trim() !== '')) && (
          <div style={{ marginTop: '0.6rem', maxWidth: 560 }}>
            <InlineEditableText
              value={summary ?? ''}
              placeholder="Add a short hero blurb for this student…"
              onSave={saveSummary}
              canEdit={canEdit}
              maxLength={1000}
              textStyle={summaryTextStyle}
            />
          </div>
        )}
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
          <Image
            src={school.logoUrl}
            alt={school.name}
            width={108}
            height={36}
            style={{ height: 36, width: 'auto', marginBottom: '0.4rem', mixBlendMode: 'screen' }}
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
