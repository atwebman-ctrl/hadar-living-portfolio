'use client'

// ============================================================
// components/portfolio/DashboardCards.tsx
//
// Six dashboard cards for the portfolio hub overview. Each
// card pulls summary metrics from a helper in lib/dashboardHelpers
// and links to the matching tab on the portfolio group page.
// ============================================================

import type React from 'react'
import type { Assessment, Reading, WritingSample, CharacterAward } from '@/lib/types'
import {
  latestMapScore,
  latestAvantComposite,
  readingMetrics,
  latestComposition,
  type AvantSkill,
} from '@/lib/dashboardHelpers'
import PercentileTooltip from '@/components/shared/PercentileTooltip'
import grid from './DashboardGrid.module.css'

const SKILL_LABEL: Record<AvantSkill, string> = {
  listening: 'Listening',
  reading:   'Reading',
  writing:   'Writing',
  speaking:  'Speaking',
}

// ── Shared atoms ──────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontSize:      11,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color:         'var(--ink-light)',
  fontFamily:    'var(--font-mono)',
}

const ARROW: React.CSSProperties = { color: 'var(--rule)', fontSize: 16 }

const EMPTY: React.CSSProperties = {
  fontSize: 13, color: 'var(--ink-light)', fontStyle: 'italic', marginTop: 8,
}

function CardShell({ tab, studentId, label, children }: {
  tab:       string
  studentId: string
  label:     string
  children:  React.ReactNode
}) {
  return (
    <a href={`/portfolio/${studentId}/group/portfolio?tab=${tab}`} className={grid.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={LABEL}>{label}</span>
        <span style={ARROW}>›</span>
      </div>
      {children}
    </a>
  )
}

// ── Math / English cards ──────────────────────────────────────

function MapCard({ label, tab, assessments, studentId, type }: {
  label:       string
  tab:         string
  assessments: Assessment[]
  studentId:   string
  type:        'maps_math' | 'maps_english'
}) {
  const m = latestMapScore(assessments, type)
  return (
    <CardShell tab={tab} studentId={studentId} label={label}>
      {m?.score == null ? (
        <p style={EMPTY}>No scores yet</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 500, color: 'var(--ink)' }}>{m.score}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>RIT</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 4 }}>
            {m.percentile != null && (
              <span style={{ color: 'var(--teal)' }}>
                {m.percentile}th percentile
                <PercentileTooltip percentile={m.percentile} />
              </span>
            )}
            {m.delta != null && (
              <span style={{ marginLeft: m.percentile != null ? 8 : 0 }}>
                {m.delta >= 0 ? '+' : ''}{m.delta}
                {m.isYoY ? ' YoY' : ` since ${m.prevTerm}`}
              </span>
            )}
          </div>
        </>
      )}
    </CardShell>
  )
}

export function MathCard({ assessments, studentId }: { assessments: Assessment[]; studentId: string }) {
  return <MapCard label="Math" tab="math" type="maps_math" assessments={assessments} studentId={studentId} />
}

export function EnglishCard({ assessments, studentId }: { assessments: Assessment[]; studentId: string }) {
  return <MapCard label="English" tab="english" type="maps_english" assessments={assessments} studentId={studentId} />
}

// ── Hebrew card ───────────────────────────────────────────────

export function HebrewCard({ assessments, studentId }: { assessments: Assessment[]; studentId: string }) {
  const a = latestAvantComposite(assessments)
  const showStrengths = !!a && a.strongestSkill && a.lowestSkill && a.strongestSkill !== a.lowestSkill
  return (
    <CardShell tab="hebrew" studentId={studentId} label="Hebrew">
      {!a ? (
        <p style={EMPTY}>No Hebrew scores yet</p>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{a.level}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 4 }}>
            AVANT composite · {a.composite.toFixed(2)}/10
          </div>
          {showStrengths && (
            <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 6 }}>
              Strongest: {SKILL_LABEL[a.strongestSkill!]} · Needs work: {SKILL_LABEL[a.lowestSkill!]}
            </div>
          )}
        </>
      )}
    </CardShell>
  )
}

// ── Canon card ────────────────────────────────────────────────

export function CanonCard({ readings, studentId }: { readings: Reading[]; studentId: string }) {
  const r = readingMetrics(readings)
  return (
    <CardShell tab="the-canon" studentId={studentId} label="The Canon">
      {!r ? (
        <p style={EMPTY}>No books logged yet</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 500, color: 'var(--ink)' }}>{r.count}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>books this year</span>
          </div>
          {r.currentlyReading && r.currentTitle && (
            <div style={{ fontSize: 13, color: 'var(--ink-mid)', marginTop: 6 }}>
              Now reading: <strong style={{ color: 'var(--ink)' }}>{r.currentTitle}</strong>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--rule)', marginTop: 10, paddingTop: 8, fontSize: 11, color: 'var(--ink-light)' }}>
            {r.totalPages} pages read
            {r.avgRating != null && <> · avg rating {r.avgRating} ★</>}
          </div>
        </>
      )}
    </CardShell>
  )
}

// ── Composition card ──────────────────────────────────────────

export function CompositionCard({ writingSamples, studentId }: {
  writingSamples: WritingSample[]
  studentId:      string
}) {
  const c = latestComposition(writingSamples)
  return (
    <CardShell tab="composition" studentId={studentId} label="Composition">
      {!c ? (
        <p style={EMPTY}>No writing samples yet</p>
      ) : (
        <>
          <div style={{
            position: 'relative',
            background: 'var(--cream)',
            border: '1px solid var(--cream-dark)',
            borderRadius: 6,
            height: 76,
            overflow: 'hidden',
            marginBottom: 8,
          }}>
            <p style={{
              fontFamily: 'var(--font-body), Georgia, serif',
              fontSize: 14,
              color: 'var(--ink-light)',
              fontStyle: 'italic',
              padding: '10px 14px',
              margin: 0,
              lineHeight: 1.45,
            }}>
              {c.excerpt || 'No excerpt available'}
            </p>
            <span style={{
              position: 'absolute', top: 6, right: 6,
              fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6,
              padding: '2px 7px', borderRadius: 4,
              background: '#e6e8ee', color: '#4a5568',
            }}>
              {c.language}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{c.title}</div>
          {c.date && <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 2 }}>{c.date}</div>}
        </>
      )}
    </CardShell>
  )
}

// ── Soulcraft card ────────────────────────────────────────────

export function SoulcraftCard({ characterAwards, studentId }: {
  characterAwards: CharacterAward[]
  studentId:       string
}) {
  const awards = [...characterAwards].sort((a, b) => (b.awardDate ?? '').localeCompare(a.awardDate ?? ''))
  const hasAny = awards.length > 0
  const latest = awards[0]
  const badgeStyle = (idx: number): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 14,
    fontSize: 12,
    fontWeight: 500,
    background: idx < 2 ? '#f7eed6' : '#e6e8ee',
    color:      idx < 2 ? '#7d6219' : '#2d3a54',
  })
  return (
    <CardShell tab="soulcraft" studentId={studentId} label="Soulcraft">
      {!hasAny ? (
        <p style={EMPTY}>No character awards yet</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {awards.slice(0, 5).map((a, i) => (
              <span key={a.id} style={badgeStyle(i)}>{a.virtueEnglish}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>
            {awards.length} award{awards.length !== 1 ? 's' : ''}
            {latest && <> · latest: <strong style={{ color: 'var(--ink-mid)', fontWeight: 500 }}>{latest.virtueEnglish}</strong></>}
            {latest?.awardDate && <> · {latest.awardDate}</>}
          </div>
        </>
      )}
    </CardShell>
  )
}
