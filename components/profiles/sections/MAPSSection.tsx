'use client'

// ============================================================
// components/profiles/sections/MAPSSection.tsx
//
// Body of the MAPS profile section editor. Two MapPercentile
// charts (math + ELA) on the left, sources panel listing each
// administration on the right, narrative textarea below.
//
// Presentational: receives the merged assessment list +
// narrative state from MAPSSectionWrapper.
// ============================================================

import type { CSSProperties } from 'react'
import MapPercentileChart from '@/components/charts/MapPercentileChart'
import type { StudentScorePoint } from '@/components/charts/MapPercentileChart'
import { termToSeason, type MAPSAssessment } from '@/lib/mapsHelpers'

export type { MAPSAssessment }

type Props = {
  assessments:       MAPSAssessment[]
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

function ordinal(n: number | null): string {
  if (n == null) return '—'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function toScorePoints(
  rows:    MAPSAssessment[],
  pickRit: (r: MAPSAssessment) => number | null,
): StudentScorePoint[] {
  return rows
    .map((r) => {
      const rit = pickRit(r)
      if (rit == null) return null
      return { grade: r.grade, season: termToSeason(r.term), ritScore: rit }
    })
    .filter((p): p is StudentScorePoint => p !== null)
}

function latestWith(
  rows:    MAPSAssessment[],
  pickRit: (r: MAPSAssessment) => number | null,
): MAPSAssessment | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (pickRit(rows[i]) != null) return rows[i]
  }
  return null
}

export default function MAPSSection({
  assessments, narrative, onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const mathPoints = toScorePoints(assessments, (r) => r.mathRIT)
  const engPoints  = toScorePoints(assessments, (r) => r.engRIT)
  const latestMath = latestWith(assessments, (r) => r.mathRIT)
  const latestEng  = latestWith(assessments, (r) => r.engRIT)

  return (
    <>
      <div style={GRID}>
        <div>
          <div style={SECTION_LABEL}>Math</div>
          <div style={STAT_LINE}>
            {latestMath
              ? `${latestMath.term} · ${latestMath.mathRIT} RIT · ${ordinal(latestMath.mathPercentile)} percentile`
              : 'No math measures captured.'}
          </div>
          <div style={CHART_BOX}>
            {mathPoints.length > 0
              ? <MapPercentileChart subject="math" studentScores={mathPoints} />
              : <div style={EMPTY}>No math RIT scores to chart.</div>}
          </div>

          <div style={{ ...SECTION_LABEL, marginTop: 28 }}>English</div>
          <div style={STAT_LINE}>
            {latestEng
              ? `${latestEng.term} · ${latestEng.engRIT} RIT · ${ordinal(latestEng.engPercentile)} percentile`
              : 'No English measures captured.'}
          </div>
          <div style={CHART_BOX}>
            {engPoints.length > 0
              ? <MapPercentileChart subject="reading" studentScores={engPoints} />
              : <div style={EMPTY}>No English RIT scores to chart.</div>}
          </div>
        </div>

        <div>
          <div style={SECTION_LABEL}>Sources</div>
          <div style={SOURCE_CARD}>
            {assessments.length === 0 ? (
              <div style={EMPTY}>No MAP administrations captured for this student.</div>
            ) : (
              <>
                {assessments.map((a) => (
                  <div key={a.id} style={SOURCE_ROW}>
                    <div style={SOURCE_TERM}>{a.term}</div>
                    <div style={SOURCE_VAL}>
                      Math {a.mathRIT ?? '—'}
                      {a.mathPercentile != null && ` (${a.mathPercentile})`}
                      {' · '}
                      English {a.engRIT ?? '—'}
                      {a.engPercentile != null && ` (${a.engPercentile})`}
                    </div>
                  </div>
                ))}
                <div style={{ ...SOURCE_ROW, borderBottom: 'none' }}>
                  <div style={SOURCE_TERM}>Origin</div>
                  <div style={SOURCE_VAL}>
                    Captured assessment rows · {assessments.length} administration{assessments.length === 1 ? '' : 's'}
                  </div>
                </div>
              </>
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
          placeholder="Write the MAPS narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
          style={TEXTAREA}
        />
        <div style={CHAR_COUNT}>{narrative.length} / 10000</div>
      </div>
    </>
  )
}

// ── styles ────────────────────────────────────────────────────

const GRID: CSSProperties = {
  display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 28,
}

const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}

const STAT_LINE: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)',
  marginBottom: 12,
}

const CHART_BOX: CSSProperties = {
  height: 240,
  background: 'var(--cream)', border: '1px solid var(--rule)',
  borderRadius: 6, padding: 8,
}

const SOURCE_CARD: CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--rule)',
  borderRadius: 6, padding: '4px 16px',
}
const SOURCE_ROW: CSSProperties = {
  display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12,
  padding: '12px 0', borderBottom: '1px solid var(--rule)',
}
const SOURCE_TERM: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
const SOURCE_VAL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)',
  lineHeight: 1.5,
}
const EMPTY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-faint)',
  padding: '20px 0', fontStyle: 'italic', textAlign: 'center',
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
  color: 'var(--ink)', resize: 'vertical', outline: 'none',
}
const CHAR_COUNT: CSSProperties = {
  marginTop: 6, textAlign: 'right',
  fontFamily: 'var(--font-mono)', fontSize: 10,
  color: 'var(--ink-faint)',
}
