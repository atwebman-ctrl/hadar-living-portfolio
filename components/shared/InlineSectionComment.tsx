'use client'

// ============================================================
// components/shared/InlineSectionComment.tsx
//
// Compact inline teacher comment input + note list for a single
// portfolio section anchor. Renders any existing notes that match
// `sectionAnchor`, then a collapsed "Add a note…" link that
// expands into a minimal textarea + Save/Cancel row.
//
// Notes are keyed by sectionAnchor so TeacherJournal can deep-link
// back to the exact location they were left.
// ============================================================

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { TeacherNote, UserRole } from '@/lib/types'

interface Props {
  studentId:       string
  sectionCategory: string   // DB value, e.g. 'the_canon'
  sectionAnchor:   string   // unique ID for this location, e.g. 'canon-list'
  canEdit:         boolean  // teacher/admin only
  notes?:          TeacherNote[]
  role?:           UserRole
}

// ── Styles ────────────────────────────────────────────────────

const LINK: CSSProperties = {
  display: 'inline-block', fontSize: 13, color: 'var(--gold)', opacity: 0.6,
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-body)', textDecoration: 'none',
}

const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 56, border: '1px solid var(--rule)', borderRadius: 6,
  padding: 8, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--ink)',
  background: 'var(--parchment)', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
}

const SAVE_BTN: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
  background: 'var(--navy)', color: 'var(--cream)', border: 'none',
  padding: '6px 14px', cursor: 'pointer', borderRadius: 3,
}

const CANCEL_LINK: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-light)',
  background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
}

// ── Existing-note card ────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function InlineNoteCard({ note }: { note: TeacherNote }) {
  return (
    <div style={{
      padding: '10px 12px', borderLeft: '2px solid var(--gold)', background: 'var(--cream)',
      marginBottom: 8, fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.55,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>
          {note.authorName}
        </span>
        {note.createdAt && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>
            · {formatDate(note.createdAt)}
          </span>
        )}
        {!note.visibleToParents && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--cream)', padding: '1px 5px', borderRadius: 2 }}>
            Internal
          </span>
        )}
      </div>
      <div>{note.text}</div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function InlineSectionComment({
  studentId, sectionCategory, sectionAnchor, canEdit, notes, role,
}: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [text,     setText]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const sectionNotes = (notes ?? [])
    .filter((n) => n.sectionAnchor === sectionAnchor)
    .filter((n) => role === 'parent' ? n.visibleToParents : true)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  async function handleSave() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/teacher-notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: trimmed,
          sectionCategory,
          sectionAnchor,
          visibleToParents: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? 'Failed to save note.')
      }
      setText('')
      setSaved(true)
      router.refresh()
      setTimeout(() => { setSaved(false); setExpanded(false) }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit && sectionNotes.length === 0) return null

  return (
    <div id={sectionAnchor} style={{ marginTop: 24, scrollMarginTop: 80 }}>
      {sectionNotes.length > 0 && (
        <div style={{ marginBottom: canEdit ? 12 : 0 }}>
          {sectionNotes.map((n) => <InlineNoteCard key={n.id} note={n} />)}
        </div>
      )}

      {canEdit && !expanded && !saved && (
        <button type="button" style={LINK} onClick={() => setExpanded(true)}>
          Add a note…
        </button>
      )}

      {canEdit && expanded && !saved && (
        <div>
          <textarea
            style={TEXTAREA}
            placeholder="Note for this section…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
          />
          {error && <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>{error}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <button type="button" style={SAVE_BTN} onClick={handleSave} disabled={saving || !text.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              style={CANCEL_LINK}
              onClick={() => { setExpanded(false); setText(''); setError(null) }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {canEdit && saved && (
        <div style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.8 }}>Note saved ✓</div>
      )}
    </div>
  )
}
