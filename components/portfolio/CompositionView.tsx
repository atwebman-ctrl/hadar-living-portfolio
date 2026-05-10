'use client'

import { useState } from 'react'
import type { WritingSample, HandwritingSample, AiDraft, TeacherNote, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import InlineWritingForm from '@/components/portfolio/InlineWritingForm'
import InlineSectionComment from '@/components/shared/InlineSectionComment'
import CompositionHandwriting from '@/components/portfolio/CompositionHandwriting'
import groupStyles from '@/components/portfolio/GroupDetail.module.css'
import s from './sections.module.css'

interface Props {
  writingSamples:      WritingSample[]
  handwritingSamples:  HandwritingSample[]
  teacherNotes?:       TeacherNote[]
  studentId:           string
  studentName?:        string
  role:                UserRole
  initialLanguage?:    string
  /** Display label for the pinned language. Used in copy when initialLanguage is set. */
  languageLabel?:      string
  /** Cross-language view: which language pills to show (omit 'all' — added automatically). */
  availableLanguages?: { code: string; label: string }[]
  existingDraft?:      AiDraft
  academicYear?:       string
  gradeLevel?:         string
}

type LangFilter = string  // 'all' | language code

// ── Helpers ───────────────────────────────────────────────────

function excerptPreview(sample: WritingSample): string {
  const source = sample.excerpt ?? sample.body ?? sample.ocrText ?? ''
  if (source.length <= 150) return source
  return source.slice(0, 150).trimEnd() + '…'
}

function fullText(sample: WritingSample): string {
  return sample.body ?? sample.ocrText ?? sample.excerpt ?? ''
}

function sortByDateDesc(samples: WritingSample[]): WritingSample[] {
  return [...samples].sort((a, b) => {
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt)
    }
    const yearCmp = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
    if (yearCmp !== 0) return yearCmp
    return (b.term ?? '').localeCompare(a.term ?? '')
  })
}

function buildDraftContext(samples: WritingSample[], studentFirstName: string | null): Record<string, unknown> {
  return {
    studentFirstName,
    sampleCount: samples.length,
    samples: samples.map((x) => ({
      title:        x.title,
      language:     x.language,
      gradeLevel:   x.gradeLevel,
      academicYear: x.academicYear,
      excerpt:      (x.excerpt ?? x.body ?? x.ocrText ?? '').slice(0, 300) || null,
    })),
  }
}

// ── Sub-components ────────────────────────────────────────────

function LanguageTag({ language }: { language: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--ink-mid)',
      border: '1px solid var(--rule)', padding: '2px 6px', marginLeft: '0.5rem',
    }}>
      {language}
    </span>
  )
}

function SampleRow({ sample, showLangTag, expanded, onToggle }: {
  sample:      WritingSample
  showLangTag: boolean
  expanded:    boolean
  onToggle:    () => void
}) {
  const preview = excerptPreview(sample)
  const full    = fullText(sample)
  return (
    <div style={{ border: '1px solid var(--rule)', background: 'var(--parchment)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      <button
        onClick={onToggle}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
        aria-expanded={expanded}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--navy)', margin: 0 }}>
            {sample.title}
            {showLangTag && sample.language && <LanguageTag language={sample.language} />}
          </h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            {sample.term ? `${sample.term} · ` : ''}{sample.academicYear}
            {sample.genre ? ` · ${sample.genre}` : ''}
          </span>
        </div>
        {!expanded && preview && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.55, margin: '0.6rem 0 0' }}>
            {preview}
          </p>
        )}
      </button>
      {expanded && (
        <div style={{ marginTop: '0.75rem' }}>
          {full && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
              {full}
            </p>
          )}
          {sample.teacherComments && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                Teacher Comments
              </span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-mid)', fontStyle: 'italic', lineHeight: 1.55, margin: '0.25rem 0 0' }}>
                {sample.teacherComments}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function CompositionView({
  writingSamples,
  handwritingSamples,
  teacherNotes,
  studentId,
  studentName,
  role,
  initialLanguage,
  languageLabel,
  availableLanguages,
  existingDraft,
  academicYear,
  gradeLevel,
}: Props) {
  const [filter,     setFilter]     = useState<LangFilter>(initialLanguage ?? 'all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const langPills: { slug: string; label: string }[] = [
    { slug: 'all', label: 'All' },
    { slug: 'english', label: 'English' },
    ...(availableLanguages ?? []).map((l) => ({ slug: l.code, label: l.label })),
  ]
  const filterLabel = filter === 'all'
    ? ''
    : (langPills.find((p) => p.slug === filter)?.label ?? filter) + ' '

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredSamples = filter === 'all'
    ? writingSamples
    : writingSamples.filter((x) => x.language === filter)
  const sorted = sortByDateDesc(filteredSamples)

  const canEdit = role === 'admin' || role === 'teacher'
  const draftContext = (role !== 'parent' && writingSamples.length > 0)
    ? buildDraftContext(writingSamples, studentName ?? null)
    : null

  return (
    <section id="composition">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>04</span>
        <h2 className={s.sectionTitle}>Composition</h2>
        <div className={s.sectionRule} />
      </div>

      {/* ── Language filter pills (hidden when parent section pins the language) ── */}
      {!initialLanguage && (
        <div className={groupStyles.groupTabBar} style={{ marginBottom: '1.5rem' }}>
          {langPills.map((p) => (
            <button
              key={p.slug}
              className={`${groupStyles.groupTab}${filter === p.slug ? ` ${groupStyles.groupTabActive}` : ''}`}
              onClick={() => setFilter(p.slug)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Writing samples list ─────────────────────────────── */}
      {sorted.length === 0 ? (
        <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', fontStyle: 'italic', padding: '1.5rem 0' }}>
          No {initialLanguage ? (languageLabel ?? '') + ' ' : filterLabel}compositions yet.
        </p>
      ) : (
        <div className="reveal">
          {sorted.map((sample) => (
            <SampleRow
              key={sample.id}
              sample={sample}
              showLangTag={filter === 'all'}
              expanded={expandedIds.has(sample.id)}
              onToggle={() => toggleExpanded(sample.id)}
            />
          ))}
        </div>
      )}

      {/* ── AI narrative panel ───────────────────────────────── */}
      {role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="writing"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}

      <InlineSectionComment
        studentId={studentId}
        sectionCategory="creative_evolution"
        sectionAnchor="composition"
        canEdit={canEdit}
        notes={teacherNotes}
        role={role}
      />

      {canEdit && <InlineWritingForm studentId={studentId} />}

      {/* ── Handwriting section ──────────────────────────────── */}
      <CompositionHandwriting
        samples={handwritingSamples}
        studentId={studentId}
        role={role}
        academicYear={academicYear}
        gradeLevel={gradeLevel}
      />
    </section>
  )
}
