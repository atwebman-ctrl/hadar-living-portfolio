'use client'

// ============================================================
// components/dashboard/ComposerOptionsRow.tsx
//
// The dashed-border row beneath the StreamComposer's main row:
// section/term/assessment pills, also-tagged chips, action text
// links, photo caption input, and the visible-to-parents toggle.
// ============================================================

import { useState, type CSSProperties } from 'react'
import { TERM_OPTIONS } from '@/lib/constants'

type EntryType = 'note' | 'score' | 'photo'

interface Props {
  entryType:           EntryType
  category:            string
  setCategory:         (c: string) => void
  term:                string
  setTerm:             (t: string) => void
  assessment:          string
  setAssessment:       (a: string) => void
  caption:             string
  setCaption:          (c: string) => void
  visibleToParents:    boolean
  setVisibleToParents: (v: boolean) => void
  alsoTagged:          { id: string; name: string }[]
  onRemoveTag:         (id: string) => void
  onTagAnother:        () => void
  onOpenBulkEntry?:    () => void
}

const CATEGORIES = [
  { value: 'general',            label: 'Auto' },
  { value: 'intellectual_arc',   label: 'Math' },
  { value: 'english',            label: 'English' },
  { value: 'immersion_engine',   label: 'Hebrew' },
  { value: 'the_canon',          label: 'The Canon' },
  { value: 'creative_evolution', label: 'Composition' },
  { value: 'character_arc',      label: 'Soulcraft' },
] as const

const ASSESSMENT_OPTIONS = [
  'MAP Math',
  'MAP ELA',
  'AVANT Speaking',
  'AVANT Reading',
  'AVANT Listening',
  'AVANT Writing',
  'Lexile',
] as const

// ── Styles ───────────────────────────────────────────────────
const ROW: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  marginTop: 14, paddingTop: 12,
  borderTop: '1px dashed var(--rule)',
}
const PILL: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 28, padding: '0 10px',
  border: '1px solid var(--rule)', borderRadius: 999,
  background: 'var(--cream)',
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-mid)',
}
const PILL_SELECT: CSSProperties = {
  ...PILL, padding: '0 6px', outline: 'none', cursor: 'pointer',
}
const CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  height: 24, padding: '0 8px',
  background: 'var(--parchment)', border: '1px solid var(--rule)',
  borderRadius: 999,
  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)',
}
const CHIP_X: CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--ink-light)', fontSize: 14, lineHeight: 1, padding: 0,
}
const TEXT_LINK_BASE: CSSProperties = {
  background: 'none', border: 'none', padding: 0,
  fontFamily: 'var(--font-body)', fontSize: 13,
  color: 'var(--gold)', cursor: 'pointer',
  textDecoration: 'none',
}
const CAPTION_INPUT: CSSProperties = {
  flex: 1, minWidth: 200, height: 28,
  border: '1px solid var(--rule)', borderRadius: 6,
  padding: '0 10px',
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)',
  background: 'var(--white)', boxSizing: 'border-box', outline: 'none',
}
const CHECKBOX_LABEL: CSSProperties = {
  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-mid)', cursor: 'pointer',
}

interface TextLinkProps {
  onClick?: () => void
  marginLeft?: number
  children: React.ReactNode
}
function TextLink({ onClick, marginLeft, children }: TextLinkProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...TEXT_LINK_BASE,
        marginLeft,
        color: hover ? 'var(--navy)' : 'var(--gold)',
        textDecoration: hover ? 'underline' : 'none',
      }}
    >
      {children}
    </button>
  )
}

export default function ComposerOptionsRow({
  entryType,
  category, setCategory,
  term, setTerm,
  assessment, setAssessment,
  caption, setCaption,
  visibleToParents, setVisibleToParents,
  alsoTagged, onRemoveTag, onTagAnother,
  onOpenBulkEntry,
}: Props) {
  return (
    <div style={ROW}>
      {(entryType === 'note' || entryType === 'photo') && (
        <select
          style={PILL_SELECT}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Section"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>Section · {c.label}</option>
          ))}
        </select>
      )}

      <select
        style={PILL_SELECT}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Term"
      >
        {TERM_OPTIONS.map((t) => (
          <option key={t} value={t}>Term · {t}</option>
        ))}
      </select>

      {entryType === 'score' && (
        <select
          style={PILL_SELECT}
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
          aria-label="Assessment"
        >
          {ASSESSMENT_OPTIONS.map((a) => (
            <option key={a} value={a}>Assessment · {a}</option>
          ))}
        </select>
      )}

      {entryType === 'note' && (
        <>
          {alsoTagged.map((tag) => (
            <span key={tag.id} style={CHIP}>
              {tag.name}
              <button
                type="button"
                style={CHIP_X}
                onClick={() => onRemoveTag(tag.id)}
                aria-label={`Remove ${tag.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <TextLink onClick={onTagAnother} marginLeft={6}>
            + Tag another
          </TextLink>
        </>
      )}

      {entryType === 'score' && (
        <TextLink onClick={onOpenBulkEntry} marginLeft={6}>
          Open bulk entry →
        </TextLink>
      )}

      {entryType === 'photo' && (
        <input
          type="text"
          style={CAPTION_INPUT}
          placeholder="Caption (optional)…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--rule)' }}
        />
      )}

      <label style={CHECKBOX_LABEL}>
        <input
          type="checkbox"
          checked={visibleToParents}
          onChange={(e) => setVisibleToParents(e.target.checked)}
        />
        Visible to parents
      </label>
    </div>
  )
}
