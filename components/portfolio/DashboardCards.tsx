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
  sparklinePoints,
} from '@/lib/dashboardHelpers'
import grid from './DashboardGrid.module.css'

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

// ── Map sparkline ─────────────────────────────────────────────

function Sparkline({ points }: { points: { x: number; y: number }[] }) {
  if (points.length === 0) return null
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  return (
    <svg viewBox="0 0 200 44" preserveAspectRatio="none" style={{ width: '100%', height: 44, marginTop: 10 }}>
      {points.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--navy)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.length > 1 && (
        <circle cx={first.x} cy={first.y} r={3} fill="var(--navy)" opacity={0.3} />
      )}
      <circle cx={last.x} cy={last.y} r={4} fill="var(--gold)" stroke="var(--white)" strokeWidth={1.5} />
    </svg>
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
  const pts = sparklinePoints(assessments, type)
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
              <span style={{ color: 'var(--teal)' }}>{m.percentile}th percentile</span>
            )}
            {m.delta != null && (
              <span style={{ marginLeft: m.percentile != null ? 8 : 0 }}>
                {m.delta >= 0 ? '+' : ''}{m.delta} since {m.prevTerm}
              </span>
            )}
          </div>
          <Sparkline points={pts} />
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
  const skills = [
    { key: 'listening' as const, label: 'Listen', value: a?.listening ?? 0 },
    { key: 'reading'   as const, label: 'Read',   value: a?.reading   ?? 0 },
    { key: 'writing'   as const, label: 'Write',  value: a?.writing   ?? 0 },
    { key: 'speaking'  as const, label: 'Speak',  value: a?.speaking  ?? 0 },
  ]
  return (
    <CardShell tab="hebrew" studentId={studentId} label="Hebrew">
      {!a ? (
        <p style={EMPTY}>No AVANT scores yet</p>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{a.level}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 4 }}>
            AVANT composite · {a.composite.toFixed(2)}/10
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 52, marginTop: 12 }}>
            {skills.map((s) => (
              <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%',
                  height: `${Math.max(0, Math.min(100, s.value * 10))}%`,
                  background: a.lowestSkill === s.key ? 'var(--gold)' : 'var(--navy)',
                  borderRadius: '3px 3px 0 0',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {skills.map((s) => (
              <div key={s.key} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--ink-light)' }}>
                {s.label}
              </div>
            ))}
          </div>
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
              fontSize: 13,
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
