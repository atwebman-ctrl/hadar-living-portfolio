'use client'

// ============================================================
// components/profiles/sections/CharacterDevelopmentSection.tsx
//
// Renders the student's character_awards as a stack of cards
// (Hebrew virtue, transliteration, English gloss, date, citation).
// Pairs the awards stack with the standard narrative editor.
// ============================================================

import type { CSSProperties } from 'react'
import type { CharacterAward } from '@/lib/types'
import UploadDropZone from './UploadDropZone'

type Props = {
  awards:            CharacterAward[]
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

function formatLongDate(iso: string): string {
  if (!iso) return ''
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function shortMonthYear(iso: string): string {
  if (!iso) return ''
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function statLine(awards: CharacterAward[]): string {
  const n = awards.length
  const noun = n === 1 ? 'award' : 'awards'
  const sorted = [...awards].sort((a, b) => a.awardDate.localeCompare(b.awardDate))
  const first = shortMonthYear(sorted[0].awardDate)
  const last  = shortMonthYear(sorted[sorted.length - 1].awardDate)
  return first === last ? `${n} ${noun} · ${first}` : `${n} ${noun} · ${first} – ${last}`
}

function AwardCard({ a }: { a: CharacterAward }) {
  return (
    <div style={CARD}>
      <div style={CARD_TOP}>
        <div style={HEBREW} dir="rtl">{a.virtueHebrew}</div>
        <div style={TRANSLIT}>{a.virtueTransliteration}</div>
      </div>
      <div style={ENGLISH}>{a.virtueEnglish}</div>
      <div style={DATE_LINE}>Awarded {formatLongDate(a.awardDate)}</div>
      {a.description
        ? <blockquote style={CITATION}>{a.description}</blockquote>
        : <div style={NO_CITATION}>No citation recorded</div>}
    </div>
  )
}

export default function CharacterDevelopmentSection({
  awards, narrative, onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const isEmpty = awards.length === 0

  return (
    <>
      <div style={SECTION_LABEL}>Middot · Character Development</div>

      {isEmpty ? (
        <div style={EMPTY_BLOCK}>
          <div style={EMPTY_HEAD}>No character awards recorded yet for this student.</div>
          <div style={EMPTY_SUB}>Awards will appear here as they&apos;re given.</div>
        </div>
      ) : (
        <div style={STAT_LINE}>{statLine(awards)}</div>
      )}

      {!isEmpty && (
        <div style={CARDS}>
          {awards.map((a) => <AwardCard key={a.id} a={a} />)}
        </div>
      )}

      <div style={DROPZONE_WRAP}>
        <UploadDropZone label={isEmpty
          ? 'Upload certificates or photos · coming soon'
          : 'Upload certificate photos · coming soon'} />
      </div>

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
          placeholder="Write the character development narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
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
const EMPTY_BLOCK: CSSProperties = { marginBottom: 20 }
const EMPTY_HEAD: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-mid)',
  marginBottom: 4,
}
const EMPTY_SUB: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, fontStyle: 'italic',
  color: 'var(--ink-faint)',
}
const CARDS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }
const CARD: CSSProperties = {
  border: '1px solid var(--rule)', background: 'var(--cream)',
  borderRadius: 6, padding: 24,
}
const CARD_TOP: CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
}
const HEBREW: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--navy)',
  lineHeight: 1.2,
}
const TRANSLIT: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 20, fontStyle: 'italic',
  color: 'var(--ink-mid)', lineHeight: 1.2,
}
const ENGLISH: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-mid)',
}
const DATE_LINE: CSSProperties = {
  marginTop: 10,
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const CITATION: CSSProperties = {
  margin: '14px 0 0', padding: '0 0 0 16px',
  borderLeft: '2px solid var(--rule)',
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink-mid)', fontStyle: 'italic',
}
const NO_CITATION: CSSProperties = {
  marginTop: 14, fontFamily: 'var(--font-body)', fontSize: 13,
  fontStyle: 'italic', color: 'var(--ink-faint)',
}
const DROPZONE_WRAP: CSSProperties = { marginTop: 20 }
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
