'use client'

// ============================================================
// components/profiles/sections/CompositionSection.tsx
//
// Shared body for both English and Hebrew composition section
// editors. Parameterized by `language`. Each writing sample
// renders as a card; image_path is wired but currently unused
// (all paths are null in seed data).
// ============================================================

import type { CSSProperties } from 'react'
import UploadDropZone from './UploadDropZone'

export interface CompositionSample {
  id:           string
  language:     'english' | 'hebrew'
  gradeLevel:   string
  academicYear: string
  title:        string | null
  body:         string | null
  ocrText:      string | null
  imagePublicUrl: string | null
}

type Props = {
  language:          'english' | 'hebrew'
  samples:           CompositionSample[]
  narrative:         string
  onNarrativeChange: (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
}

function gradeRange(samples: CompositionSample[]): string {
  const grades = samples.map((s) => s.gradeLevel).filter(Boolean)
  if (grades.length === 0) return ''
  const sorted = [...grades].sort((a, b) => a.localeCompare(b))
  return sorted[0] === sorted[sorted.length - 1]
    ? `Grade ${sorted[0]}`
    : `Grades ${sorted[0]}–${sorted[sorted.length - 1]}`
}

function statLine(samples: CompositionSample[]): string {
  const n = samples.length
  const noun = n === 1 ? 'composition' : 'compositions'
  const range = gradeRange(samples)
  return range ? `${n} ${noun} across ${range}` : `${n} ${noun}`
}

function eyebrow(language: 'english' | 'hebrew', samples: CompositionSample[]): string {
  const year = samples[0]?.academicYear
  const lang = language === 'english' ? 'English' : 'Hebrew'
  return year
    ? `${lang} composition · ${year}`
    : `${lang} composition`
}

function SampleCard({ s }: { s: CompositionSample }) {
  const titleLabel = s.title ?? 'Untitled composition'
  const meta = `Grade ${s.gradeLevel} · ${s.academicYear}`
  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <div style={CARD_TITLE}>{titleLabel}</div>
        <div style={CARD_META}>{meta}</div>
      </div>
      {s.imagePublicUrl && (
        // Composition images have unknown intrinsic dimensions — sized by max-width only.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.imagePublicUrl}
          alt={titleLabel}
          style={{ maxWidth: '100%', borderRadius: 4, marginTop: 16, display: 'block' }}
        />
      )}
      {s.body && <blockquote style={BODY}>{s.body}</blockquote>}
      {s.ocrText && <div style={NOTE}>Teacher&apos;s note · {s.ocrText}</div>}
    </div>
  )
}

export default function CompositionSection({
  language, samples, narrative,
  onNarrativeChange, isGenerating, onGenerateDraft,
}: Props) {
  const langTitle = language === 'english' ? 'English' : 'Hebrew'
  const isEmpty = samples.length === 0

  return (
    <>
      <div style={SECTION_LABEL}>{eyebrow(language, samples)}</div>

      {isEmpty ? (
        <div style={EMPTY_BLOCK}>
          <div style={EMPTY_HEAD}>
            No {langTitle} compositions captured yet for this term.
          </div>
          <div style={EMPTY_SUB}>
            Compositions will appear here as they&apos;re added.
          </div>
        </div>
      ) : (
        <div style={STAT_LINE}>{statLine(samples)}</div>
      )}

      {!isEmpty && (
        <div style={CARDS}>
          {samples.map((s) => <SampleCard key={s.id} s={s} />)}
        </div>
      )}

      <div style={DROPZONE_WRAP}>
        <UploadDropZone
          label={isEmpty
            ? 'Drop composition pages here, or click to upload'
            : 'Add another composition page'}
        />
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
          placeholder={`Write the ${langTitle} composition narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit.`}
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
const CARDS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }
const CARD: CSSProperties = {
  border: '1px solid var(--rule)', background: 'var(--cream)',
  borderRadius: 6, padding: 24,
}
const CARD_HEADER: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16,
}
const CARD_TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--navy)',
  lineHeight: 1.25,
}
const CARD_META: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mid)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const BODY: CSSProperties = {
  margin: '16px 0 0', padding: '0 0 0 16px',
  borderLeft: '2px solid var(--rule)',
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink-mid)', fontStyle: 'italic',
}
const NOTE: CSSProperties = {
  marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--rule)',
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
  letterSpacing: '0.04em', lineHeight: 1.5,
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
