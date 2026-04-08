'use client'

// ============================================================
// components/portfolio/InlineVideoForm.tsx
//
// Collapsible form for adding a YouTube/Vimeo video link to
// The Rhetoric Room. Visible to admin/teacher only (caller gates).
// POSTs to /api/dashboard/students/[studentId]/videos and calls
// router.refresh() on success for instant UI update.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRADE_SELECT_OPTIONS, TERM_OPTIONS } from '@/lib/constants'

interface Props {
  studentId: string
}

const CATEGORIES = [
  { value: 'hebrew_speaking',     label: 'Hebrew Speaking' },
  { value: 'poetry_recitation',   label: 'Poetry Recitation' },
  { value: 'socratic_reflection', label: 'Socratic Reflection' },
  { value: 'immersion',           label: 'Immersion' },
  { value: 'other',               label: 'Other' },
] as const

// ── Shared styles ─────────────────────────────────────────────

const toggleBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}

const field: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem',
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-mid)',
}

const input: React.CSSProperties = {
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

const EMPTY = { title: '', videoUrl: '', gradeLevel: '', term: '', category: 'hebrew_speaking' }

export default function InlineVideoForm({ studentId }: Props) {
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
      const res = await fetch(`/api/dashboard/students/${studentId}/videos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        setStatus({ type: 'success', msg: 'Video added.' })
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
        {open ? '− ' : '+ '}Add Video
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}
        >
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}

          <div style={field}>
            <span style={label}>Title</span>
            <input style={input} type="text" value={form.title} required
              placeholder="e.g. Grade 3 Bronze Poetry Recitation"
              onChange={(e) => update('title', e.target.value)} />
          </div>

          <div style={field}>
            <span style={label}>YouTube or Vimeo URL</span>
            <input style={input} type="url" value={form.videoUrl} required
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => update('videoUrl', e.target.value)} />
          </div>

          <div style={twoCol}>
            <div style={field}>
              <span style={label}>Grade Level</span>
              <select style={input} value={form.gradeLevel} required
                onChange={(e) => update('gradeLevel', e.target.value)}>
                <option value="">Select grade…</option>
                {GRADE_SELECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={field}>
              <span style={label}>Term</span>
              <select style={input} value={form.term} required
                onChange={(e) => update('term', e.target.value)}>
                <option value="">Select term…</option>
                {TERM_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={field}>
            <span style={label}>Category</span>
            <select style={input} value={form.category}
              onChange={(e) => update('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button style={submitBtn} type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Video'}
          </button>
        </form>
      )}
    </div>
  )
}
