'use client'

// ============================================================
// components/shared/AiDraftEditor.tsx
//
// Universal AI-draft review component. Rendered by any portfolio
// section that wants to surface an AI-generated narrative to a
// teacher for review.
//
// Props:
//   draftId          — uuid of the ai_drafts row
//   initialText      — content_draft from the AI
//   sectionType      — display label only
//   onResolved       — called with the final text once accepted
//   initialStatus    — pre-set status (e.g. 'accepted' for already-resolved drafts)
//   initialFinalText — pre-set final text (used when initialStatus is 'accepted'
//                      and content_final differs from content_draft)
//
// Three modes:
//   view    — shows draft text + Accept / Edit & Accept / Reject
//   edit    — editable textarea + Save & Accept / Cancel
//   resolved — quiet badge (accepted | rejected) with final text
// ============================================================

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────

type Status = 'draft' | 'accepted' | 'rejected'

interface Props {
  draftId:          string
  initialText:      string
  sectionType:      string
  onResolved?:      (finalText: string, status: 'accepted' | 'rejected') => void
  initialStatus?:   Status
  initialFinalText?: string
}

// ── Styles (design system tokens) ────────────────────────────

const S = {
  wrapper: {
    border:     '1px solid var(--rule)',
    background: '#FDFCF9',
    padding:    '1.25rem 1.5rem',
    marginTop:  '1.25rem',
  } as React.CSSProperties,

  header: {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.5rem',
    marginBottom:   '0.75rem',
    fontFamily:     'var(--font-mono)',
    fontSize:       '0.7rem',
    textTransform:  'uppercase' as const,
    letterSpacing:  '0.08em',
    color:          'var(--ink)',
    opacity:        0.55,
  } as React.CSSProperties,

  badge: (status: Status) => ({
    display:       'inline-block',
    padding:       '0.15em 0.5em',
    border:        `1px solid ${status === 'accepted' ? '#4A7C59' : status === 'rejected' ? '#8B2020' : 'var(--gold)'}`,
    color:          status === 'accepted' ? '#4A7C59' : status === 'rejected' ? '#8B2020' : 'var(--gold)',
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.65rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  } as React.CSSProperties),

  draftText: {
    fontFamily:  'var(--font-body)',
    fontSize:    '0.95rem',
    lineHeight:  1.7,
    color:       'var(--ink)',
    margin:      '0 0 1rem',
    fontStyle:   'italic',
  } as React.CSSProperties,

  textarea: {
    width:       '100%',
    minHeight:   '8rem',
    fontFamily:  'var(--font-body)',
    fontSize:    '0.95rem',
    lineHeight:  1.7,
    color:       'var(--ink)',
    background:  '#FDFCF9',
    border:      '1px solid var(--rule)',
    padding:     '0.6rem 0.75rem',
    resize:      'vertical' as const,
    outline:     'none',
    marginBottom: '0.75rem',
  } as React.CSSProperties,

  actions: {
    display: 'flex',
    gap:     '0.5rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  btn: (variant: 'primary' | 'secondary' | 'danger' | 'ghost') => {
    const base: React.CSSProperties = {
      fontFamily:    'var(--font-mono)',
      fontSize:      '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding:       '0.45em 1.1em',
      cursor:        'pointer',
      border:        '1px solid',
      background:    'transparent',
      transition:    'opacity 0.15s',
    }
    const variants: Record<string, React.CSSProperties> = {
      primary:   { borderColor: '#4A7C59', color: '#4A7C59' },
      secondary: { borderColor: 'var(--gold)', color: 'var(--gold)' },
      danger:    { borderColor: '#8B2020', color: '#8B2020' },
      ghost:     { borderColor: 'var(--rule)', color: 'var(--ink)', opacity: 0.6 },
    }
    return { ...base, ...variants[variant] }
  },

  error: {
    fontFamily: 'var(--font-mono)',
    fontSize:   '0.72rem',
    color:      '#8B2020',
    marginTop:  '0.5rem',
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────

export default function AiDraftEditor({
  draftId, initialText, sectionType, onResolved,
  initialStatus, initialFinalText,
}: Props) {
  const [mode,     setMode]     = useState<'view' | 'edit'>('view')
  const [status,   setStatus]   = useState<Status>(initialStatus ?? 'draft')
  const [editText, setEditText] = useState(initialText)
  const [finalText,setFinalText]= useState(initialFinalText ?? initialText)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── API call ───────────────────────────────────────────────

  async function submitReview(text: string, newStatus: 'accepted' | 'rejected') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contentFinal: text, status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Something went wrong.')
        return
      }
      setFinalText(text)
      setStatus(newStatus)
      setMode('view')
      onResolved?.(text, newStatus)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  const label = sectionType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // ── Resolved state ─────────────────────────────────────────
  if (status !== 'draft') {
    return (
      <div style={S.wrapper}>
        <div style={S.header}>
          <span>AI Draft · {label}</span>
          <span style={S.badge(status)}>
            {status === 'accepted' ? 'Accepted' : 'Rejected'}
          </span>
        </div>
        {status === 'accepted' && (
          <p style={{ ...S.draftText, fontStyle: 'normal' }}>{finalText}</p>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <div style={S.wrapper}>
        <div style={S.header}>
          <span>AI Draft · {label}</span>
          <span style={S.badge('draft')}>Editing</span>
        </div>
        <textarea
          style={S.textarea}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          disabled={loading}
          aria-label="Edit AI draft"
        />
        {error && <p style={S.error}>{error}</p>}
        <div style={S.actions}>
          <button
            style={S.btn('primary')}
            disabled={loading || !editText.trim()}
            onClick={() => submitReview(editText.trim(), 'accepted')}
          >
            {loading ? 'Saving…' : 'Save & Accept'}
          </button>
          <button
            style={S.btn('ghost')}
            disabled={loading}
            onClick={() => { setMode('view'); setError(null) }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── View mode (default) ────────────────────────────────────
  return (
    <div style={S.wrapper}>
      <div style={S.header}>
        <span>AI Draft · {label}</span>
        <span style={S.badge('draft')}>Awaiting review</span>
      </div>
      <p style={S.draftText}>{initialText}</p>
      {error && <p style={S.error}>{error}</p>}
      <div style={S.actions}>
        <button
          style={S.btn('primary')}
          disabled={loading}
          onClick={() => submitReview(initialText, 'accepted')}
        >
          {loading ? 'Saving…' : 'Accept'}
        </button>
        <button
          style={S.btn('secondary')}
          disabled={loading}
          onClick={() => { setMode('edit'); setError(null) }}
        >
          Edit &amp; Accept
        </button>
        <button
          style={S.btn('danger')}
          disabled={loading}
          onClick={() => submitReview(initialText, 'rejected')}
        >
          {loading ? 'Saving…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
