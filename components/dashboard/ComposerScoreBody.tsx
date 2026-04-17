'use client'

// ============================================================
// components/dashboard/ComposerScoreBody.tsx
//
// Score-entry body for StreamComposer.
// Phase 1 scaffold — actual save wiring lands in Phase 4.
// Assessment selector lives in ComposerOptionsRow as a pill.
// ============================================================

import type { CSSProperties } from 'react'

interface Props {
  rit:           string
  setRit:        (r: string) => void
  percentile:    string
  setPercentile: (p: string) => void
  onAttachPdf:   () => void
}

const ROW: CSSProperties = {
  flex: 1, display: 'flex', gap: 12, alignItems: 'flex-end',
}

const FIELD: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
}

const LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}

const INPUT_BASE: CSSProperties = {
  height: 44, border: '1px solid var(--rule)', borderRadius: 6,
  padding: '0 12px',
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
  background: 'var(--white)', boxSizing: 'border-box', outline: 'none',
}

const ATTACH_BTN: CSSProperties = {
  height: 44, padding: '0 14px',
  border: '1px dashed var(--rule)', borderRadius: 6,
  background: 'transparent', color: 'var(--ink-mid)',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
}

function PaperclipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5l-9.5 9.5a5 5 0 1 1-7-7l9.5-9.5a3.5 3.5 0 1 1 5 5L9.5 19a2 2 0 1 1-3-3l8.5-8.5" />
    </svg>
  )
}

function focusGold(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--gold)'
}
function blurRule(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--rule)'
}

export default function ComposerScoreBody({
  rit, setRit,
  percentile, setPercentile,
  onAttachPdf,
}: Props) {
  return (
    <div style={ROW}>
      <div style={{ ...FIELD, width: 110 }}>
        <span style={LABEL}>RIT</span>
        <input
          type="number"
          style={INPUT_BASE}
          placeholder="231"
          value={rit}
          onChange={(e) => setRit(e.target.value)}
          onFocus={focusGold}
          onBlur={blurRule}
        />
      </div>

      <div style={{ ...FIELD, width: 130 }}>
        <span style={LABEL}>Percentile</span>
        <input
          type="number"
          min={1}
          max={99}
          style={INPUT_BASE}
          placeholder="97"
          value={percentile}
          onChange={(e) => setPercentile(e.target.value)}
          onFocus={focusGold}
          onBlur={blurRule}
        />
      </div>

      <div style={{ ...FIELD, flex: 1 }}>
        <span style={LABEL}>Report</span>
        <button type="button" style={ATTACH_BTN} onClick={onAttachPdf}>
          <PaperclipIcon />
          Attach MAP PDF
        </button>
      </div>
    </div>
  )
}
