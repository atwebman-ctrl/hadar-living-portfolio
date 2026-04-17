'use client'

// ============================================================
// components/profiles/sections/AVANTSection.tsx
//
// Body of the AVANT Hebrew profile section editor. Single
// AvantChart on the left showing all 4 skills across each
// administration; sources panel on the right; narrative below.
//
// Presentational: receives the merged assessment list +
// narrative state from AVANTSectionWrapper.
// ============================================================

import type { CSSProperties } from 'react'
import AvantChart from '@/components/charts/AvantChart'
import type { AvantDataPoint } from '@/components/charts/AvantChart'
import type { AVANTAssessment } from '@/lib/avantHelpers'

export type { AVANTAssessment }

type Props = {
  assessments:       AVANTAssessment[]
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

function bandLabel(score: number | null): string | null {
  if (score == null) return null
  if (score <= 2) return 'Novice'
  if (score <= 5) return 'Intermediate'
  if (score <= 8) return 'Advanced'
  return 'Mastery'
}

function gradeWord(grade: number): string {
  if (grade === 0) return 'Kindergarten'
  return `Grade ${grade}`
}

function toAvantPoints(rows: AVANTAssessment[]): AvantDataPoint[] {
  return rows.map((r) => ({
    label:     `${r.term}\n${gradeWord(r.grade)}`,
    speaking:  r.speaking,
    reading:   r.reading,
    listening: r.listening,
    writing:   r.writing,
  }))
}

function latestStatLine(latest: AVANTAssessment | null): string {
  if (!latest) return 'No AVANT measures captured.'
  const parts: string[] = [latest.term]
  const skills: Array<[string, number | null]> = [
    ['Listening', latest.listening],
    ['Reading',   latest.reading],
    ['Speaking',  latest.speaking],
    ['Writing',   latest.writing],
  ]
  for (const [name, score] of skills) {
    const band = bandLabel(score)
    if (band) parts.push(`${name} ${band}`)
  }
  return parts.join(' · ')
}

function sourceLine(a: AVANTAssessment): string {
  const parts: string[] = []
  if (a.listening != null) parts.push(`Listening ${a.listening}`)
  if (a.reading    != null) parts.push(`Reading ${a.reading}`)
  if (a.speaking   != null) parts.push(`Speaking ${a.speaking}`)
  if (a.writing    != null) parts.push(`Writing ${a.writing}`)
  return parts.join(' · ')
}

export default function AVANTSection({
  assessments, narrative, onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const points = toAvantPoints(assessments)
  const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null

  return (
    <>
      <div style={GRID}>
        <div>
          <div style={SECTION_LABEL}>Proficiency over time</div>
          <div style={STAT_LINE}>{latestStatLine(latest)}</div>
          <div style={CHART_BOX}>
            {points.length > 0
              ? <AvantChart data={points} />
              : <div style={EMPTY}>No AVANT scores to chart.</div>}
          </div>
        </div>

        <div>
          <div style={SECTION_LABEL}>Sources</div>
          <div style={SOURCE_CARD}>
            {assessments.length === 0 ? (
              <div style={EMPTY}>No AVANT administrations captured for this student.</div>
            ) : (
              <>
                {assessments.map((a) => (
                  <div key={a.id} style={SOURCE_ROW}>
                    <div style={SOURCE_TERM}>{a.term}</div>
                    <div style={SOURCE_VAL}>{sourceLine(a)}</div>
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
          placeholder="Write the AVANT narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
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
  height: 280,
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
