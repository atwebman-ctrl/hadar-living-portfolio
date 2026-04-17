'use client'

// ============================================================
// components/profiles/sections/HebrewComparisonSection.tsx
//
// Body of the Hebrew · National comparison section editor. A
// hand-rolled SVG grouped bar chart compares the student's
// latest AVANT scores to Hadar grade-level cohort averages.
// ============================================================

import type { CSSProperties } from 'react'
import {
  HEBREW_GRADE_AVERAGES,
  HEBREW_SKILLS,
  type HebrewSkillAverages,
  type HebrewSkill,
} from '@/lib/hebrewComparisonNorms'

type Props = {
  athenaScores:      HebrewSkillAverages
  studentName:       string
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

const SKILL_LABEL: Record<HebrewSkill, string> = {
  reading: 'Reading', writing: 'Writing', listening: 'Listening',
  speaking: 'Speaking', composite: 'Composite',
}

const Y_MAX = 7
const CHART_W = 480
const CHART_H = 360
const PAD_L = 32
const PAD_R = 12
const PAD_T = 12
const PAD_B = 56

const PLOT_W = CHART_W - PAD_L - PAD_R
const PLOT_H = CHART_H - PAD_T - PAD_B

const GRADE_BAR_FILL: Record<3 | 4 | 5 | 6, string> = {
  3: '#D9D3C5',
  4: '#B7AE9A',
  5: '#8B8270',
  6: '#5C5648',
}

function bestMatchingGrade(athenaComposite: number): 3 | 4 | 5 | 6 | null {
  let best: 3 | 4 | 5 | 6 | null = null
  let bestDiff = Infinity
  for (const g of [3, 4, 5, 6] as const) {
    const diff = Math.abs(HEBREW_GRADE_AVERAGES[g].composite - athenaComposite)
    if (diff < bestDiff) { bestDiff = diff; best = g }
  }
  return best
}

export default function HebrewComparisonSection({
  athenaScores, studentName, narrative,
  onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const groupCount = HEBREW_SKILLS.length
  const groupGap = 16
  const groupW = (PLOT_W - groupGap * (groupCount - 1)) / groupCount
  const barCount = 5
  const barGap = 2
  const barW = (groupW - barGap * (barCount - 1)) / barCount

  const yToPx = (v: number) => PAD_T + PLOT_H - (v / Y_MAX) * PLOT_H

  const matchedGrade = bestMatchingGrade(athenaScores.composite)
  const statLine = matchedGrade
    ? `Composite ${athenaScores.composite.toFixed(2)} · matches Hadar ${matchedGrade}th-grade cohort average`
    : `Composite ${athenaScores.composite.toFixed(2)}`

  const firstName = studentName.split(' ')[0]

  return (
    <>
      <div style={GRID}>
        <div>
          <div style={SECTION_LABEL}>Hebrew proficiency · cohort comparison</div>
          <div style={STAT_LINE}>{statLine}</div>

          <div style={CHART_BOX}>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="auto">
              {Array.from({ length: Y_MAX + 1 }).map((_, i) => (
                <g key={i}>
                  <line
                    x1={PAD_L} x2={CHART_W - PAD_R}
                    y1={yToPx(i)} y2={yToPx(i)}
                    stroke="rgba(0,0,0,0.06)" strokeWidth={1}
                  />
                  <text
                    x={PAD_L - 6} y={yToPx(i) + 3}
                    fontFamily="var(--font-mono)" fontSize={9}
                    fill="var(--ink-faint)" textAnchor="end"
                  >{i}</text>
                </g>
              ))}

              {HEBREW_SKILLS.map((skill, gi) => {
                const groupX = PAD_L + gi * (groupW + groupGap)
                const bars: Array<{ fill: string; v: number; x: number }> = [
                  { fill: 'var(--gold)',     v: athenaScores[skill],          x: groupX + 0 * (barW + barGap) },
                  { fill: GRADE_BAR_FILL[3], v: HEBREW_GRADE_AVERAGES[3][skill], x: groupX + 1 * (barW + barGap) },
                  { fill: GRADE_BAR_FILL[4], v: HEBREW_GRADE_AVERAGES[4][skill], x: groupX + 2 * (barW + barGap) },
                  { fill: GRADE_BAR_FILL[5], v: HEBREW_GRADE_AVERAGES[5][skill], x: groupX + 3 * (barW + barGap) },
                  { fill: GRADE_BAR_FILL[6], v: HEBREW_GRADE_AVERAGES[6][skill], x: groupX + 4 * (barW + barGap) },
                ]
                return (
                  <g key={skill}>
                    {bars.map((b, i) => (
                      <rect
                        key={i}
                        x={b.x} y={yToPx(b.v)}
                        width={barW} height={PAD_T + PLOT_H - yToPx(b.v)}
                        fill={b.fill} rx={1.5}
                      />
                    ))}
                    <text
                      x={groupX + groupW / 2}
                      y={CHART_H - PAD_B + 16}
                      fontFamily="var(--font-mono)" fontSize={10}
                      fill="var(--ink-mid)" textAnchor="middle"
                    >{SKILL_LABEL[skill]}</text>
                  </g>
                )
              })}

              <line
                x1={PAD_L} x2={CHART_W - PAD_R}
                y1={yToPx(0)} y2={yToPx(0)}
                stroke="var(--ink-faint)" strokeWidth={1}
              />
            </svg>

            <div style={LEGEND_ROW}>
              <Swatch color="var(--gold)" label={firstName} />
              <Swatch color={GRADE_BAR_FILL[3]} label="Grade 3 avg" />
              <Swatch color={GRADE_BAR_FILL[4]} label="Grade 4 avg" />
              <Swatch color={GRADE_BAR_FILL[5]} label="Grade 5 avg" />
              <Swatch color={GRADE_BAR_FILL[6]} label="Grade 6 avg" />
            </div>
          </div>
        </div>

        <div>
          <div style={SECTION_LABEL}>Sources</div>
          <div style={SOURCE_CARD}>
            <div style={SOURCE_ROW}>
              <div style={SOURCE_TERM}>{firstName}</div>
              <div style={SOURCE_VAL}>
                Reading {athenaScores.reading.toFixed(2)} · Writing {athenaScores.writing.toFixed(2)} ·
                {' '}Listening {athenaScores.listening.toFixed(2)} · Speaking {athenaScores.speaking.toFixed(2)}
              </div>
            </div>
            {([6, 5, 4, 3] as const).map((g) => {
              const a = HEBREW_GRADE_AVERAGES[g]
              return (
                <div key={g} style={SOURCE_ROW}>
                  <div style={SOURCE_TERM}>Grade {g} avg</div>
                  <div style={SOURCE_VAL}>
                    {a.reading.toFixed(2)} / {a.writing.toFixed(2)} / {a.listening.toFixed(2)} / {a.speaking.toFixed(2)}
                  </div>
                </div>
              )
            })}
            <div style={{ ...SOURCE_ROW, borderBottom: 'none' }}>
              <div style={SOURCE_TERM}>Origin</div>
              <div style={SOURCE_VAL}>
                {firstName}: latest AVANT assessment · Grade averages: Avant STAMP 2022-2023
              </div>
            </div>
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
          placeholder="Write the Hebrew comparison narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
          style={TEXTAREA}
        />
        <div style={CHAR_COUNT}>{narrative.length} / 10000</div>
      </div>
    </>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={SWATCH_ITEM}>
      <span style={{ ...SWATCH_DOT, background: color }} />
      <span style={SWATCH_LABEL}>{label}</span>
    </div>
  )
}

// ── styles ────────────────────────────────────────────────────

const GRID: CSSProperties = { display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 28 }
const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}
const STAT_LINE: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)', marginBottom: 12,
}
const CHART_BOX: CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--rule)',
  borderRadius: 6, padding: 14,
}
const LEGEND_ROW: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '12px 18px', marginTop: 12,
}
const SWATCH_ITEM: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
const SWATCH_DOT: CSSProperties = {
  display: 'inline-block', width: 12, height: 12, borderRadius: 2,
}
const SWATCH_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mid)',
  letterSpacing: '0.06em',
}
const SOURCE_CARD: CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--rule)',
  borderRadius: 6, padding: '4px 16px',
}
const SOURCE_ROW: CSSProperties = {
  display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12,
  padding: '12px 0', borderBottom: '1px solid var(--rule)',
}
const SOURCE_TERM: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)',
}
const SOURCE_VAL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5,
}
const NARRATIVE_BLOCK: CSSProperties = { marginTop: 28 }
const NARRATIVE_HEADER: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
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
