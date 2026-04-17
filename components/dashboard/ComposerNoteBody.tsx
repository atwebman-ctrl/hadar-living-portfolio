'use client'

// ============================================================
// components/dashboard/ComposerNoteBody.tsx
//
// Note-entry body for StreamComposer. A single textarea;
// Cmd/Ctrl+Enter delegates to the parent composer's save.
// ============================================================

import type { CSSProperties, RefObject } from 'react'

interface Props {
  text:       string
  setText:    (t: string) => void
  category:   string
  setCategory: (c: string) => void
  onCmdEnter: () => void
  noteRef?:   RefObject<HTMLTextAreaElement | null>
}

const WRAP: CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', gap: 6,
}

const TEXTAREA_BASE: CSSProperties = {
  width: '100%', minHeight: 100, resize: 'vertical',
  border: '1px solid var(--rule)', borderRadius: 6,
  padding: '10px 12px 16px',
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink)', background: 'var(--white)',
  boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.15s',
}

export default function ComposerNoteBody({
  text, setText, onCmdEnter, noteRef,
}: Props) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onCmdEnter()
    }
  }

  return (
    <div style={WRAP}>
      <textarea
        ref={noteRef}
        style={TEXTAREA_BASE}
        placeholder="What did you notice today?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)' }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--rule)' }}
        rows={3}
      />
    </div>
  )
}
