'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

interface Props {
  value:        string
  placeholder:  string
  onSave:       (next: string) => Promise<void>
  canEdit:      boolean
  maxLength?:   number
  textStyle?:   CSSProperties
  inputStyle?:  CSSProperties
}

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

const WRAP: CSSProperties = { position: 'relative' }

const PENCIL_BTN: CSSProperties = {
  position: 'absolute', top: 0, right: 0,
  width: 28, height: 28,
  border: '1px solid var(--rule)', borderRadius: 6,
  background: 'var(--white)', color: 'var(--ink-light)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s ease',
}

const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 60,
  border: '1px solid var(--gold)', borderRadius: 6,
  padding: 12, fontSize: 'inherit', fontFamily: 'inherit',
  resize: 'vertical', background: 'var(--white)', color: 'var(--ink)',
}

const SAVE_BTN: CSSProperties = {
  background: 'var(--gold)', color: 'white',
  border: 'none', borderRadius: 6, padding: '6px 16px',
  fontSize: 13, cursor: 'pointer',
}

const CANCEL_BTN: CSSProperties = {
  background: 'transparent', color: 'var(--ink-light)',
  border: 'none', borderRadius: 6, padding: '6px 16px',
  fontSize: 13, cursor: 'pointer',
}

export default function InlineEditableText({
  value, placeholder, onSave, canEdit,
  maxLength = 500, textStyle, inputStyle,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])
  useEffect(() => { if (editing) areaRef.current?.focus() }, [editing])

  const enter  = () => { setDraft(value); setError(null); setEditing(true) }
  const cancel = () => { setDraft(value); setError(null); setEditing(false) }

  const save = async () => {
    setSaving(true); setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void save() }
  }

  if (editing) {
    return (
      <div style={WRAP}>
        <textarea
          ref={areaRef}
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ ...TEXTAREA, ...inputStyle }}
          disabled={saving}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button type="button" onClick={save} disabled={saving} style={{ ...SAVE_BTN, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={cancel} disabled={saving} style={CANCEL_BTN}>
            Cancel
          </button>
          {error && <span style={{ fontSize: 12, color: '#b3261e' }}>{error}</span>}
        </div>
      </div>
    )
  }

  const isEmpty = !value || value.trim() === ''
  const displayStyle: CSSProperties = isEmpty
    ? { ...textStyle, fontStyle: 'italic', color: 'var(--ink-light)' }
    : (textStyle ?? {})

  return (
    <div
      style={{ ...WRAP, paddingRight: canEdit ? 36 : 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={displayStyle}>{isEmpty ? placeholder : value}</div>
      {canEdit && (
        <button
          type="button"
          onClick={enter}
          aria-label="Edit"
          style={{ ...PENCIL_BTN, opacity: hovered ? 1 : 0 }}
        >
          <PencilIcon />
        </button>
      )}
    </div>
  )
}
