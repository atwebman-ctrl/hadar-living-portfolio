'use client'

// ============================================================
// components/profiles/sections/ReadingListSection.tsx
//
// Body of the Reading · English Canon section editor. The
// numbered list IS the data — no chart, no sources panel.
// Optional reading metadata (key quote, teacher notes,
// why_chosen) renders only when present.
// ============================================================

import type { CSSProperties } from 'react'
import type { Reading } from '@/lib/types'

type Props = {
  readings:          Reading[]
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

function buildStatLine(readings: Reading[]): string {
  const total = readings.length
  const done  = readings.filter((r) => r.completed).length
  const inProgress = readings.find((r) => !r.completed)
  const base = `${done} of ${total} books complete`
  return inProgress
    ? `${base} · currently reading: ${inProgress.title}`
    : base
}

function academicYearLabel(readings: Reading[]): string {
  const year = readings[0]?.academicYear
  return year ? `English Canon · ${year}` : 'English Canon'
}

export default function ReadingListSection({
  readings, narrative, onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  return (
    <>
      <div style={SECTION_LABEL}>{academicYearLabel(readings)}</div>
      <div style={STAT_LINE}>{buildStatLine(readings)}</div>

      {readings.length === 0 ? (
        <div style={EMPTY}>No books captured for this academic year.</div>
      ) : (
        <ol style={LIST}>
          {readings.map((r, i) => (
            <li key={r.id} style={ROW}>
              <div style={NUM}>{String(i + 1).padStart(2, '0')}</div>
              <div style={MAIN}>
                <div style={TITLE}>{r.title}</div>
                {r.author && <div style={AUTHOR}>by {r.author}</div>}
                {r.keyQuote && <blockquote style={QUOTE}>{r.keyQuote}</blockquote>}
                {r.teacherNotes && <div style={NOTE}>{r.teacherNotes}</div>}
                {r.whyChosen && <div style={WHY}>{r.whyChosen}</div>}
              </div>
              <div style={META}>
                {r.pageCount != null && (
                  <div style={PAGES}>{r.pageCount} pp</div>
                )}
                {r.completed
                  ? <div style={DONE_TAG}>✓ Completed</div>
                  : <div style={READING_TAG}>Currently reading</div>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div style={NARRATIVE_BLOCK}>
        <div style={NARRATIVE_HEADER}>
          <div style={SECTION_LABEL}>Narrative</div>
          <button
            type="button"
            onClick={onGenerateDraft}
            disabled={isGenerating}
            style={{ ...DRAFT_BTN, opacity: isGenerating ? 0.6 : 1 }}
          >
            {isGenerating ? 'Drafting…' : 'Generate draft'}
          </button>
        </div>
        <textarea
          value={narrative}
          onChange={(e) => onNarrativeChange(e.target.value)}
          placeholder="Write the canon narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
          style={TEXTAREA}
        />
        <div style={CHAR_COUNT}>{narrative.length} / 10000</div>
      </div>
    </>
  )
}

// ── styles ────────────────────────────────────────────────────

const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}
const STAT_LINE: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)',
  marginBottom: 16,
}
const EMPTY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-faint)',
  padding: '24px 0', fontStyle: 'italic', textAlign: 'center',
}

const LIST: CSSProperties = {
  listStyle: 'none', padding: 0, margin: 0,
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 6,
}
const ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '52px 1fr 130px',
  gap: 16,
  padding: '14px 18px',
  borderBottom: '1px solid var(--rule)',
  alignItems: 'start',
}
const NUM: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
  color: 'var(--ink-faint)', letterSpacing: '0.05em',
  paddingTop: 4,
}
const MAIN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--navy)',
  lineHeight: 1.25,
}
const AUTHOR: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, fontStyle: 'italic',
  color: 'var(--ink-mid)',
}
const QUOTE: CSSProperties = {
  margin: '6px 0 0', padding: '0 0 0 12px',
  borderLeft: '2px solid var(--gold)',
  fontFamily: 'var(--font-body)', fontSize: 13, fontStyle: 'italic',
  color: 'var(--ink-mid)', lineHeight: 1.5,
}
const NOTE: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mid)',
  marginTop: 4, lineHeight: 1.5,
}
const WHY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-mid)',
  marginTop: 4, lineHeight: 1.5,
}
const META: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
  paddingTop: 4,
}
const PAGES: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const DONE_TAG: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
const READING_TAG: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)',
  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
}

const NARRATIVE_BLOCK: CSSProperties = { marginTop: 28 }
const NARRATIVE_HEADER: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 8,
}
const DRAFT_BTN: CSSProperties = {
  height: 32, padding: '0 14px', background: 'transparent', color: 'var(--gold)',
  border: '1px solid var(--gold)', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}
const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 220, padding: 14,
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 6,
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink)', resize: 'vertical', outline: 'none',
}
const CHAR_COUNT: CSSProperties = {
  marginTop: 6, textAlign: 'right',
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
}
