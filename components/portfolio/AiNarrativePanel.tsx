'use client'

// ============================================================
// components/portfolio/AiNarrativePanel.tsx
//
// Client component that manages the "Generate AI Narrative"
// flow for a single portfolio section. Renders inline beneath
// the section's data content.
//
// Teacher/admin view:
//   • No existing draft → "Generate AI Narrative" button
//   • After generation → AiDraftEditor in view mode (review flow)
//   • Existing accepted draft → AiDraftEditor pre-set to resolved
//
// Parent view:
//   • Accepted draft exists → plain narrative paragraph
//   • No accepted draft     → nothing rendered
// ============================================================

import { useState } from 'react'
import type { AiDraft, UserRole } from '@/lib/types'
import AiDraftEditor from '@/components/shared/AiDraftEditor'

interface Props {
  studentId:     string
  role:          UserRole
  sectionType:   string           // e.g. 'academic_scores'
  existingDraft?: AiDraft         // pre-fetched accepted draft, if any
  draftContext:  Record<string, unknown>
}

// ── Styles ────────────────────────────────────────────────────

const S = {
  generateWrap: {
    marginTop:     '1.5rem',
    paddingTop:    '1.25rem',
    borderTop:     '1px solid var(--rule)',
    display:       'flex',
    alignItems:    'center',
    gap:           '0.75rem',
    flexWrap:      'wrap' as const,
  } as React.CSSProperties,

  generateBtn: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding:       '0.5em 1.25em',
    border:        '1px solid var(--gold)',
    color:         'var(--gold)',
    background:    'transparent',
    cursor:        'pointer',
  } as React.CSSProperties,

  generateBtnDisabled: {
    opacity: 0.5,
    cursor:  'default',
  } as React.CSSProperties,

  label: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.68rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color:         'var(--ink)',
    opacity:       0.45,
  } as React.CSSProperties,

  error: {
    fontFamily: 'var(--font-mono)',
    fontSize:   '0.72rem',
    color:      '#8B2020',
    marginTop:  '0.25rem',
    width:      '100%',
  } as React.CSSProperties,

  parentNarrative: {
    fontFamily:  'var(--font-body)',
    fontSize:    '0.95rem',
    lineHeight:  1.75,
    color:       'var(--ink)',
    marginTop:   '1.25rem',
    paddingTop:  '1.25rem',
    borderTop:   '1px solid var(--rule)',
    fontStyle:   'italic',
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────

export default function AiNarrativePanel({
  studentId, role, sectionType, existingDraft, draftContext,
}: Props) {
  const [generated, setGenerated] = useState<{ draftId: string; text: string } | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // ── Parent view ────────────────────────────────────────────
  if (role === 'parent') {
    if (!existingDraft) return null
    return (
      <p style={S.parentNarrative}>
        {existingDraft.contentFinal ?? existingDraft.contentDraft}
      </p>
    )
  }

  // ── Teacher/admin: existing accepted draft ─────────────────
  if (existingDraft) {
    return (
      <AiDraftEditor
        draftId={existingDraft.id}
        initialText={existingDraft.contentDraft}
        initialFinalText={existingDraft.contentFinal ?? undefined}
        initialStatus="accepted"
        sectionType={existingDraft.sectionType}
      />
    )
  }

  // ── Teacher/admin: draft just generated this session ───────
  if (generated) {
    return (
      <AiDraftEditor
        draftId={generated.draftId}
        initialText={generated.text}
        sectionType={sectionType}
      />
    )
  }

  // ── Teacher/admin: Generate button ────────────────────────
  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/draft', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, sectionType, context: draftContext }),
      })
      const data = await res.json() as { draftId?: string; text?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Generation failed. Please try again.')
        return
      }
      setGenerated({ draftId: data.draftId!, text: data.text! })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.generateWrap}>
      <span style={S.label}>AI Narrative</span>
      <button
        style={{
          ...S.generateBtn,
          ...(loading ? S.generateBtnDisabled : {}),
        }}
        disabled={loading}
        onClick={handleGenerate}
      >
        {loading ? 'Generating…' : 'Generate AI Narrative'}
      </button>
      {error && <span style={S.error}>{error}</span>}
    </div>
  )
}
