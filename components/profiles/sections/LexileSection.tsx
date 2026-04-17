'use client'

// ============================================================
// components/profiles/sections/LexileSection.tsx
//
// Body of the Lexile section editor. Presentational: receives
// the assessment row + the current narrative as props, emits
// narrative changes via onNarrativeChange. The wrapper handles
// PATCH calls and status transitions.
//
// Layout: two-column grid — SVG Lexile ladder on the left,
// "Sources" card on the right — followed by a full-width
// narrative textarea card.
// ============================================================

import type { CSSProperties } from 'react'

type LexileBand = {
  label: string         // e.g. "1150L–1300L"
  rangeMinL: number     // 1150
  rangeMaxL: number     // 1300
  termLabel: string     // e.g. "Jan 2026"
  notes:     string | null
}

type Props = {
  band:              LexileBand | null
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

// Reference rungs on the Lexile ladder. Spans roughly the
// K–college range used in NWEA's college-readiness benchmark.
const RUNGS: { label: string; lexile: number; descriptor: string }[] = [
  { label: 'College & career',   lexile: 1300, descriptor: 'Upper HS / college entry' },
  { label: 'Grade 11–12',        lexile: 1185, descriptor: 'Late HS' },
  { label: 'Grade 9–10',         lexile: 1080, descriptor: 'Mid HS' },
  { label: 'Grade 6–8',          lexile:  925, descriptor: 'Middle school' },
  { label: 'Grade 4–5',          lexile:  770, descriptor: 'Upper elementary' },
  { label: 'Grade 2–3',          lexile:  520, descriptor: 'Early elementary' },
  { label: 'Grade K–1',          lexile:  230, descriptor: 'Beginning reader' },
]

const LADDER_MIN = 100
const LADDER_MAX = 1400

function lexileToY(lexile: number, height: number): number {
  const clamped = Math.max(LADDER_MIN, Math.min(LADDER_MAX, lexile))
  const pct = (clamped - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)
  return height - pct * height
}

export default function LexileSection({
  band, narrative, onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const ladderHeight = 360
  const ladderWidth  = 260

  return (
    <>
      <div style={GRID}>
        <div>
          <div style={SECTION_LABEL}>Lexile ladder</div>
          <svg
            role="img"
            aria-label="Lexile reading level ladder"
            width={ladderWidth}
            height={ladderHeight + 40}
            viewBox={`0 0 ${ladderWidth} ${ladderHeight + 40}`}
          >
            {/* spine */}
            <line
              x1={48} x2={48}
              y1={20} y2={ladderHeight + 20}
              stroke="var(--rule)"
              strokeWidth={1}
            />

            {/* highlighted band */}
            {band && (
              <rect
                x={20}
                y={lexileToY(band.rangeMaxL, ladderHeight) + 20}
                width={ladderWidth - 28}
                height={
                  lexileToY(band.rangeMinL, ladderHeight) -
                  lexileToY(band.rangeMaxL, ladderHeight)
                }
                fill="rgba(196,154,42,0.18)"
                stroke="var(--gold)"
                strokeWidth={1}
                rx={4}
              />
            )}

            {/* rungs */}
            {RUNGS.map((r) => {
              const y = lexileToY(r.lexile, ladderHeight) + 20
              return (
                <g key={r.label}>
                  <line x1={42} x2={54} y1={y} y2={y} stroke="var(--ink-faint)" strokeWidth={1} />
                  <text
                    x={62} y={y + 4}
                    fontFamily="var(--font-body)"
                    fontSize={11}
                    fill="var(--ink-mid)"
                  >
                    {r.label} · {r.lexile}L
                  </text>
                </g>
              )
            })}

            {/* student marker label */}
            {band && (
              <text
                x={62}
                y={lexileToY((band.rangeMinL + band.rangeMaxL) / 2, ladderHeight) + 24}
                fontFamily="var(--font-heading)"
                fontSize={13}
                fontWeight={600}
                fill="var(--gold)"
              >
                {band.label}
              </text>
            )}
          </svg>
        </div>

        <div>
          <div style={SECTION_LABEL}>Sources</div>
          <div style={SOURCE_CARD}>
            {band ? (
              <>
                <div style={SOURCE_ROW}>
                  <div style={SOURCE_KEY}>Latest measure</div>
                  <div style={SOURCE_VAL}>{band.label}</div>
                </div>
                <div style={SOURCE_ROW}>
                  <div style={SOURCE_KEY}>Term</div>
                  <div style={SOURCE_VAL}>{band.termLabel}</div>
                </div>
                {band.notes && (
                  <div style={SOURCE_ROW}>
                    <div style={SOURCE_KEY}>Notes</div>
                    <div style={SOURCE_VAL}>{band.notes}</div>
                  </div>
                )}
                <div style={{ ...SOURCE_ROW, borderBottom: 'none' }}>
                  <div style={SOURCE_KEY}>Origin</div>
                  <div style={SOURCE_VAL}>Captured assessment row</div>
                </div>
              </>
            ) : (
              <div style={EMPTY}>
                No Lexile assessment captured for this student yet.
              </div>
            )}
          </div>
        </div>
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
          placeholder="Write the Lexile narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
          style={TEXTAREA}
        />
        <div style={CHAR_COUNT}>{narrative.length} / 10000</div>
      </div>
    </>
  )
}

// ── styles ────────────────────────────────────────────────────

const GRID: CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
}

const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 12,
}

const SOURCE_CARD: CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--rule)',
  borderRadius: 6, padding: '4px 16px',
}
const SOURCE_ROW: CSSProperties = {
  display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12,
  padding: '12px 0', borderBottom: '1px solid var(--rule)',
}
const SOURCE_KEY: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
const SOURCE_VAL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-deep, var(--navy))',
  lineHeight: 1.5,
}
const EMPTY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-faint)',
  padding: '20px 0', fontStyle: 'italic',
}

const NARRATIVE_BLOCK: CSSProperties = { marginTop: 28 }
const NARRATIVE_HEADER: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 8,
}
const DRAFT_BTN: CSSProperties = {
  height: 32, padding: '0 14px',
  background: 'transparent', color: 'var(--gold)',
  border: '1px solid var(--gold)', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}
const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 220, padding: 14,
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 6,
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink-deep, var(--navy))', resize: 'vertical',
  outline: 'none',
}
const CHAR_COUNT: CSSProperties = {
  marginTop: 6, textAlign: 'right',
  fontFamily: 'var(--font-mono)', fontSize: 10,
  color: 'var(--ink-faint)',
}
