'use client'

// ============================================================
// components/portfolio/InlineTeacherNoteForm.tsx
//
// Collapsible form for adding a teacher narrative note inside
// the Teacher Notes section. Visible to admin/teacher only
// (caller gates). Author name is resolved server-side from the
// authenticated Clerk user — not entered in the form.
// POSTs to /api/dashboard/students/[studentId]/teacher-notes
// and calls router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
}

const CATEGORIES = [
  { value: 'academic_progress',  label: 'Academic Progress' },
  { value: 'social_development', label: 'Social Development' },
  { value: 'behavioral',         label: 'Behavioral' },
  { value: 'participation',      label: 'Participation' },
  { value: 'general',            label: 'General' },
] as const

// ── Styles ────────────────────────────────────────────────────

const toggleBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}

const fieldWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem',
}

const lbl: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-mid)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)',
  fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)',
  border: '1px solid var(--rule)', boxSizing: 'border-box',
}

const twoCol: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
}

const submitBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)',
  border: 'none', padding: '7px 20px', cursor: 'pointer', marginTop: '0.25rem',
}

const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '0.4rem 0.75rem', marginBottom: '0.75rem',
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em',
  color:      type === 'success' ? '#166534' : '#991b1b',
  background: type === 'success' ? '#f0fdf4' : '#fef2f2',
  border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
})

// ── Component ─────────────────────────────────────────────────

const EMPTY = { noteText: '', category: 'academic_progress', date: '' }

export default function InlineTeacherNoteForm({ studentId }: Props) {
  const router   = useRouter()
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form,   setForm]   = useState({ ...EMPTY })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      const body: Record<string, string> = {
        noteText: form.noteText,
        category: form.category,
      }
      if (form.date) body.date = form.date

      const res = await fetch(`/api/dashboard/students/${studentId}/teacher-notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        setStatus({ type: 'success', msg: 'Note added.' })
        setForm({ ...EMPTY })
        router.refresh()
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error — please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
      <button style={toggleBtn} onClick={() => { setOpen((o) => !o); setStatus(null) }}>
        {open ? '− ' : '+ '}Add Note
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}
        >
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}

          <div style={fieldWrap}>
            <span style={lbl}>Note</span>
            <textarea
              style={{ ...inputStyle, minHeight: '6rem', resize: 'vertical' }}
              required
              value={form.noteText}
              placeholder="Write a narrative observation about this student…"
              onChange={(e) => update('noteText', e.target.value)}
            />
          </div>

          <div style={twoCol}>
            <div style={fieldWrap}>
              <span style={lbl}>Category</span>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div style={fieldWrap}>
              <span style={lbl}>Date (optional)</span>
              <input
                style={inputStyle}
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </div>
          </div>

          <button style={submitBtn} type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </form>
      )}
    </div>
  )
}
