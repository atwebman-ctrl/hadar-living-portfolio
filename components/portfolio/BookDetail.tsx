'use client'

import { useState } from 'react'
import type { Reading } from '@/lib/types'
import s from './sections.module.css'

// ── Book cover image ──────────────────────────────────────────

export function BookCoverImage({ title, width = 80, height = 120 }: { title: string; width?: number; height?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div style={{ width, height, flexShrink: 0, background: 'var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid var(--rule)' }}>
        📖
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-L.jpg`} alt="" width={width} height={height}
      onError={() => setFailed(true)}
      style={{ width, height, objectFit: 'cover', flexShrink: 0, display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
    />
  )
}

// ── Star rating display ──────────────────────────────────────

function StarRating({ value }: { value: number }) {
  const full  = '★'.repeat(value)
  const empty = '☆'.repeat(Math.max(0, 5 - value))
  return (
    <span style={{ color: 'var(--gold)', fontSize: '0.95rem', letterSpacing: '0.05em' }} aria-label={`${value} out of 5 stars`}>
      {full}<span style={{ opacity: 0.35 }}>{empty}</span>
    </span>
  )
}

// ── Difficulty badge ─────────────────────────────────────────

const DIFFICULTY_STYLES: Record<NonNullable<Reading['readingDifficulty']>, { label: string; color: string; border: string }> = {
  stretch:     { label: 'STRETCH',     color: 'var(--gold)',       border: 'var(--gold)' },
  above_level: { label: 'ABOVE LEVEL', color: 'var(--gold)',       border: 'var(--gold)' },
  on_level:    { label: 'ON LEVEL',    color: 'var(--navy)',       border: 'var(--navy)' },
  below_level: { label: 'BELOW LEVEL', color: 'var(--ink-faint)',  border: 'var(--ink-faint)' },
}

function DifficultyBadge({ difficulty }: { difficulty: NonNullable<Reading['readingDifficulty']> }) {
  const { label, color, border } = DIFFICULTY_STYLES[difficulty]
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', padding: '3px 8px', border: `1px solid ${border}`, color, textTransform: 'uppercase' }}>
      {label}
    </span>
  )
}

// ── Labeled section ──────────────────────────────────────────

function LabeledBlock({ label, children, bodyStyle }: { label: string; children: React.ReactNode; bodyStyle?: React.CSSProperties }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.35rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.6, ...bodyStyle }}>
        {children}
      </div>
    </div>
  )
}

// ── Date formatting ──────────────────────────────────────────

function parseDate(iso: string): Date {
  // Force local parse so YYYY-MM-DD doesn't shift due to UTC.
  return new Date(iso + 'T00:00')
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  if (start && end) {
    const s = parseDate(start), e = parseDate(end)
    const endFmt = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (s.getFullYear() === e.getFullYear()) {
      const startShort = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `${startShort} – ${endFmt}`
    }
    const startFmt = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  }
  const only = parseDate((start ?? end)!)
  const fmt = only.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return start ? `Started ${fmt}` : `Finished ${fmt}`
}

// ── Action button ────────────────────────────────────────────

function ActionBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${danger ? '#b91c1c' : 'var(--rule)'}`, color: danger ? '#b91c1c' : 'var(--ink-mid)', padding: '2px 8px', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

// ── Component ────────────────────────────────────────────────

interface Props {
  reading:    Reading
  spineColor: string
  canEdit:    boolean
  onEdit:     () => void
  onDelete:   (id: string) => Promise<void>
}

export default function BookDetail({ reading, spineColor, canEdit, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete(reading.id)
    setDeleting(false)
    setConfirmDelete(false)
  }

  const dateRange = formatDateRange(reading.dateStarted, reading.dateFinished)
  const footerBits: string[] = []
  if (dateRange)                       footerBits.push(dateRange)
  if (reading.pageCount != null)       footerBits.push(`${reading.pageCount} pages`)
  footerBits.push(reading.completed ? 'Completed' : 'In Progress')
  if (reading.curriculumConnection)    footerBits.push(reading.curriculumConnection.replace(/_/g, ' '))

  return (
    <div
      className={s.bookDetailPanel}
      style={{ borderTop: '1px solid var(--rule)', borderRight: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', borderLeft: `3px solid ${spineColor}`, background: 'var(--cream)', padding: '1.5rem 1.75rem', marginTop: '1rem', display: 'flex', gap: '1.75rem', alignItems: 'flex-start', position: 'relative' }}
    >
      <BookCoverImage title={reading.title} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
        {/* Title + author */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--navy)', margin: 0, lineHeight: 1.25 }}>
            {reading.title}
          </h3>
          {reading.author && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-light)', fontStyle: 'italic', marginTop: '0.25rem' }}>
              by {reading.author}
            </div>
          )}
        </div>

        {/* Rating + difficulty badge */}
        {(reading.studentRating != null || reading.readingDifficulty) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {reading.studentRating != null && <StarRating value={reading.studentRating} />}
            {reading.readingDifficulty && <DifficultyBadge difficulty={reading.readingDifficulty} />}
          </div>
        )}

        {/* Why this book */}
        {reading.whyChosen && (
          <LabeledBlock label="Why This Book" bodyStyle={{ fontStyle: 'italic' }}>
            {reading.whyChosen}
          </LabeledBlock>
        )}

        {/* Key quote */}
        {reading.keyQuote && (
          <blockquote style={{ margin: 0, padding: '0.4rem 0 0.4rem 1.1rem', borderLeft: '3px solid var(--gold)', fontFamily: "'Cormorant Garamond', var(--font-cormorant), Georgia, serif", fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--navy)', lineHeight: 1.4 }}>
            &ldquo;{reading.keyQuote.replace(/^["\u201C\u201D]|["\u201C\u201D]$/g, '')}&rdquo;
          </blockquote>
        )}

        {/* Teacher's note */}
        {reading.teacherNotes && (
          <LabeledBlock label="Teacher's Note">
            {reading.teacherNotes}
          </LabeledBlock>
        )}

        {/* Values & Skills — rare but preserved */}
        {reading.valuesSkills && (
          <LabeledBlock label="Values & Skills">
            {reading.valuesSkills}
          </LabeledBlock>
        )}

        {/* Footer: dates · pages · status · connection · year */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--ink-faint)', textTransform: 'uppercase', paddingTop: '0.5rem', borderTop: '1px dotted var(--rule)' }}>
          {[...footerBits, reading.academicYear].join('  \u00b7  ')}
        </div>
      </div>

      {/* Edit / Delete — hover-revealed via CSS class */}
      {canEdit && (
        <div className={s.bookDetailActions}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--ink-mid)' }}>Delete?</span>
              <ActionBtn danger onClick={handleConfirmDelete}>{deleting ? '…' : 'Yes'}</ActionBtn>
              <ActionBtn onClick={() => setConfirmDelete(false)}>No</ActionBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <ActionBtn onClick={onEdit}>Edit</ActionBtn>
              <ActionBtn danger onClick={() => setConfirmDelete(true)}>Delete</ActionBtn>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
