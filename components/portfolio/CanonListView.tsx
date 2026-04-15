'use client'

// ============================================================
// components/portfolio/CanonListView.tsx
//
// List-view rendering of the student's reading canon: stats bar
// at the top, expandable rows below. The expanded detail panel
// lives in CanonBookDetail.tsx.
// ============================================================

import { useState, type CSSProperties } from 'react'
import type { Reading, UserRole } from '@/lib/types'
import CanonBookDetail from '@/components/portfolio/CanonBookDetail'

interface Props {
  readings:   Reading[]
  studentId?: string
  role?:      UserRole
}

// ── Helpers ───────────────────────────────────────────────────

function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => {
    if (!a.completed && b.completed) return -1
    if (a.completed && !b.completed) return 1
    const fin = (b.dateFinished ?? '').localeCompare(a.dateFinished ?? '')
    if (fin !== 0) return fin
    return (b.dateStarted ?? '').localeCompare(a.dateStarted ?? '')
  })
}

function tagFor(r: Reading): { label: string; bg: string; fg: string } {
  if (!r.completed) return { label: 'Reading now',    bg: '#E1F5EE', fg: '#085041' }
  if (r.curriculumConnection === 'free_choice')
    return { label: 'Student choice', bg: '#e6e8ee', fg: '#4a5568' }
  return { label: 'Assigned',         bg: '#f0ead8', fg: '#7d6219' }
}

// ── Presentational atoms ──────────────────────────────────────

const PILL: CSSProperties = {
  fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 9px', borderRadius: 10,
  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
}

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return null
  return (
    <div style={{ display: 'flex', gap: 1 }} aria-label={`${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= rating ? 'var(--gold)' : 'none'} stroke="var(--gold)" strokeWidth="1.5">
          <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
        </svg>
      ))}
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

const SEP: CSSProperties = { width: 1, height: 28, background: 'var(--rule)' }

// ── Row ───────────────────────────────────────────────────────

function CanonRow({ reading, index, expanded, onToggle }: {
  reading:  Reading
  index:    number
  expanded: boolean
  onToggle: () => void
}) {
  const [hover, setHover] = useState(false)
  const tag = tagFor(reading)

  return (
    <div>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="button"
        aria-expanded={expanded}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', margin: '0 -16px',
          borderRadius: 8, cursor: 'pointer',
          background: (hover || expanded) ? 'var(--cream)' : 'transparent',
          borderBottom: expanded ? 'none' : '1px solid var(--cream-dark)',
          transition: 'background 0.15s ease',
        }}
      >
        <span style={{
          fontSize: 13, color: 'var(--gold)', width: 22, textAlign: 'center',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', flexShrink: 0,
        }}>
          {String(index).padStart(2, '0')}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{reading.title}</div>
          {reading.author && (
            <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 1 }}>{reading.author}</div>
          )}
        </div>
        <Stars rating={reading.studentRating} />
        <span style={{ ...PILL, background: tag.bg, color: tag.fg }}>{tag.label}</span>
        <span style={{
          fontSize: 20, color: 'var(--ink-faint)', width: 14, textAlign: 'center',
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s ease', flexShrink: 0,
        }}>
          ›
        </span>
      </div>
      {expanded && <CanonBookDetail reading={reading} tag={tag} />}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function CanonListView({ readings }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (readings.length === 0) {
    return (
      <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
        No readings recorded yet.
      </p>
    )
  }

  const sorted = sortReadings(readings)

  const bookCount  = readings.length
  const totalPages = readings.reduce((sum, r) => sum + (r.pageCount ?? 0), 0)
  const ratings    = readings.map((r) => r.studentRating).filter((r): r is number => r != null)
  const avgRating  = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : null
  const currentlyReading = readings.filter((r) => !r.completed && r.dateFinished == null).length

  return (
    <div>
      <div style={{
        display: 'flex', gap: 24, alignItems: 'baseline', flexWrap: 'wrap',
        paddingBottom: '1rem', borderBottom: '1px solid var(--rule)',
        marginBottom: '1.25rem',
      }}>
        <Stat value={bookCount} label="books" />
        <span style={SEP} />
        <Stat value={totalPages.toLocaleString()} label="pages" />
        {avgRating && (
          <>
            <span style={SEP} />
            <Stat value={`${avgRating}★`} label="avg rating" />
          </>
        )}
        <span style={SEP} />
        <Stat value={currentlyReading} label="currently reading" />
      </div>

      <div>
        {sorted.map((r, i) => (
          <CanonRow
            key={r.id}
            reading={r}
            index={i + 1}
            expanded={expandedId === r.id}
            onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
          />
        ))}
      </div>
    </div>
  )
}
