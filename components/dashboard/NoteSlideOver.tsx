'use client'

// ============================================================
// components/dashboard/NoteSlideOver.tsx
//
// Slide-over panel that opens from the right side of the
// dashboard, allowing teachers to add a quick note about a
// student without leaving the roster.
//
// Dashboard has no left sidebar, so position: fixed anchored
// to right: 0 is fine here.
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  studentId:   string
  studentName: string
  isOpen:      boolean
  onClose:     () => void
}

const SECTION_CATEGORIES = [
  { value: 'intellectual_arc',   label: 'Math' },
  { value: 'english',            label: 'English' },
  { value: 'immersion_engine',   label: 'Hebrew' },
  { value: 'the_canon',          label: 'The Canon' },
  { value: 'creative_evolution', label: 'Composition' },
  { value: 'character_arc',      label: 'Soulcraft' },
  { value: 'general',            label: 'General' },
] as const

function ghostPrompt(cat: string): string {
  switch (cat) {
    case 'intellectual_arc':   return 'What mathematical thinking did you notice today?'
    case 'english':            return 'How is their reading or writing developing?'
    case 'immersion_engine':   return 'What progress did you see in Hebrew today?'
    case 'the_canon':          return 'How did they engage with this book?'
    case 'creative_evolution': return 'What voice or craft did you notice in their writing?'
    case 'character_arc':     return 'What moment of character did you witness?'
    default:                   return 'What did you notice about this student today?'
  }
}

// ── Styles ────────────────────────────────────────────────────

const BACKDROP: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)',
  zIndex: 49, transition: 'opacity 0.25s ease',
}

const PANEL: CSSProperties = {
  position: 'fixed', top: 0, right: 0, width: 400, maxWidth: '100vw',
  height: '100vh', background: 'var(--parchment)',
  borderLeft: '1px solid var(--rule)', boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
  zIndex: 50, display: 'flex', flexDirection: 'column',
  transition: 'transform 0.28s ease',
}

const HEADER: CSSProperties = {
  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--rule)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
}

const CLOSE_BTN: CSSProperties = {
  width: 44, height: 44, background: 'none', border: 'none',
  color: 'var(--ink-mid)', fontSize: '1.1rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const BODY: CSSProperties = {
  padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: '1rem',
}

const LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-mid)',
}

const INPUT: CSSProperties = {
  width: '100%', padding: '10px 12px', minHeight: 44,
  fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink)',
  background: 'var(--cream)', border: '1px solid var(--rule)', boxSizing: 'border-box',
}

const TEXTAREA: CSSProperties = {
  ...INPUT, minHeight: 160, resize: 'vertical', lineHeight: 1.55,
}

const FOOTER: CSSProperties = {
  padding: '1rem 1.5rem', borderTop: '1px solid var(--rule)',
  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem',
}

const SAVE_BTN: CSSProperties = {
  padding: '12px 22px', minHeight: 44, fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
  background: 'var(--navy)', color: 'var(--cream)', border: '1px solid var(--navy)',
  cursor: 'pointer',
}

const CANCEL_BTN: CSSProperties = {
  padding: '12px 16px', minHeight: 44, background: 'none', border: 'none',
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-light)',
  textDecoration: 'underline', cursor: 'pointer',
}

// ── Component ─────────────────────────────────────────────────

export default function NoteSlideOver({ studentId, studentName, isOpen, onClose }: Props) {
  const router = useRouter()
  const [category,         setCategory]         = useState<string>('general')
  const [text,             setText]             = useState('')
  const [visibleToParents, setVisibleToParents] = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [toast,            setToast]            = useState<string | null>(null)

  // Reset form whenever the panel opens for a new student.
  useEffect(() => {
    if (!isOpen) return
    setCategory('general'); setText(''); setVisibleToParents(true)
    setError(null); setToast(null)
  }, [isOpen, studentId])

  // Escape-to-close when panel is open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleSave() {
    const trimmed = text.trim()
    if (!trimmed) { setError('Note cannot be empty.'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/teacher-notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText:        trimmed,
          sectionCategory: category,
          visibleToParents,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? 'Failed to save note.')
      }
      setToast('Note saved ✓')
      router.refresh()
      setTimeout(() => { setToast(null); onClose() }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        style={{ ...BACKDROP, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        style={{ ...PANEL, transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-label={`Quick note for ${studentName}`}
        aria-hidden={!isOpen}
      >
        <div style={HEADER}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Quick Note
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--ink)', marginTop: 2 }}>
              {studentName}
            </div>
          </div>
          <button type="button" style={CLOSE_BTN} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={BODY}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={LABEL}>Section</span>
            <select style={INPUT} value={category} onChange={(e) => setCategory(e.target.value)}>
              {SECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={LABEL}>Note</span>
            <textarea
              style={TEXTAREA}
              placeholder={ghostPrompt(category)}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleToParents}
              onChange={(e) => setVisibleToParents(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--navy)', width: 16, height: 16 }}
            />
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                Visible to parents
              </span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)', margin: '2px 0 0' }}>
                Uncheck to keep this note internal (teachers and admin only).
              </p>
            </div>
          </label>

          {error && <div style={{ fontSize: 12, color: '#991b1b' }}>{error}</div>}
          {toast && <div style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.9 }}>{toast}</div>}
        </div>

        <div style={FOOTER}>
          <button type="button" style={CANCEL_BTN} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            type="button"
            style={{ ...SAVE_BTN, opacity: saving || !text.trim() ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </aside>
    </>
  )
}
