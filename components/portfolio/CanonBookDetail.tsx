'use client'

// ============================================================
// components/portfolio/CanonBookDetail.tsx
//
// Expanded detail panel for a single reading in CanonListView.
// Shows cover (Open Library), author/pages/pills, dates, key
// quote, teacher note, and student rationale.
// ============================================================

import { useState, type CSSProperties } from 'react'
import type { Reading } from '@/lib/types'

interface Props {
  reading: Reading
  tag:     { label: string; bg: string; fg: string }
}

// ── Helpers & constants ───────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DIFFICULTY: Record<NonNullable<Reading['readingDifficulty']>, { label: string; bg: string; fg: string }> = {
  stretch:     { label: 'Stretch read', bg: '#FEF3C7', fg: '#92400E' },
  above_level: { label: 'Above level',  bg: '#CCFBF1', fg: '#115E59' },
  on_level:    { label: 'On level',     bg: '#F3F4F6', fg: '#4B5563' },
  below_level: { label: 'Below level',  bg: '#F3F4F6', fg: '#4B5563' },
}

const PILL: CSSProperties = {
  fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 9px', borderRadius: 10,
  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
}

// ── Labelled note (teacher note / why chosen) ─────────────────

function LabelledNote({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginBottom: 4,
      }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────

export default function CanonBookDetail({ reading, tag }: Props) {
  const [coverError, setCoverError] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(reading.title)}-M.jpg`

  const diff = reading.readingDifficulty ? DIFFICULTY[reading.readingDifficulty] : null

  const hasDates = !!(reading.dateStarted || reading.dateFinished)
  const hasNotes = !!(reading.keyQuote || reading.teacherNotes || reading.whyChosen)

  return (
    <div style={{
      padding: '18px 36px 22px',
      background: 'var(--cream)',
      borderLeft: '2px solid var(--gold)',
      marginBottom: 2,
    }}>
      <div style={{ display: 'flex', gap: 22 }}>
        <div style={{ width: 110, flexShrink: 0 }}>
          {!coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={reading.title}
              onError={() => setCoverError(true)}
              style={{ width: '100%', display: 'block', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
            />
          ) : (
            <div style={{
              width: 110, height: 160, background: 'var(--navy)', color: 'var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 10, textAlign: 'center',
              fontSize: 13, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              borderRadius: 4,
            }}>
              {reading.title}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {reading.author && (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{reading.author}</div>
          )}
          {reading.pageCount && (
            <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 3 }}>
              {reading.pageCount.toLocaleString()} pages
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...PILL, background: tag.bg, color: tag.fg }}>{tag.label}</span>
            {diff && <span style={{ ...PILL, background: diff.bg, color: diff.fg }}>{diff.label}</span>}
          </div>
          {hasDates && (
            <div style={{
              marginTop: 10, fontSize: 11, color: 'var(--ink-light)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
            }}>
              {reading.dateStarted && `Started ${formatDate(reading.dateStarted)}`}
              {reading.dateStarted && reading.dateFinished && '  ·  '}
              {reading.dateFinished && `Finished ${formatDate(reading.dateFinished)}`}
            </div>
          )}
        </div>
      </div>

      {hasNotes && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--cream-dark)' }}>
          {reading.keyQuote && (
            <blockquote style={{
              margin: '0 0 4px',
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.5,
              borderLeft: '2px solid var(--gold)', paddingLeft: 12,
            }}>
              {reading.keyQuote}
            </blockquote>
          )}
          {reading.teacherNotes && <LabelledNote label="Teacher note"  text={reading.teacherNotes} />}
          {reading.whyChosen    && <LabelledNote label="Why this book" text={reading.whyChosen} />}
        </div>
      )}
    </div>
  )
}
