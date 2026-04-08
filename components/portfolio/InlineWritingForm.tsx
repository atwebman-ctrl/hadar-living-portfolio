'use client'

// ============================================================
// components/portfolio/InlineWritingForm.tsx
//
// Collapsible form for adding a writing sample inside the
// Creative Evolution section. Visible to admin/teacher only
// (caller gates). POSTs to the writing-samples route and calls
// router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
}

const GENRES = [
  'Essay',
  'Poetry',
  'Short Story',
  'Journal',
  'Research',
  'Other',
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

const EMPTY = {
  title:           '',
  genre:           'Essay' as string,
  excerpt:         '',
  teacherComments: '',
  term:            '',
  academicYear:    '',
}

export default function InlineWritingForm({ studentId }: Props) {
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
      const body: Record<string, string | null> = {
        title:           form.title,
        genre:           form.genre,
        excerpt:         form.excerpt || null,
        teacherComments: form.teacherComments || null,
        term:            form.term,
        academicYear:    form.academicYear,
      }

      const res = await fetch(`/api/dashboard/students/${studentId}/writing-samples`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        setStatus({ type: 'success', msg: 'Writing sample added.' })
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
        {open ? '− ' : '+ '}Add Writing Sample
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}
        >
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}

          <div style={twoCol}>
            <div style={fieldWrap}>
              <span style={lbl}>Title</span>
              <input
                style={inputStyle}
                type="text"
                required
                value={form.title}
                placeholder="e.g. My Summer Adventure"
                onChange={(e) => update('title', e.target.value)}
              />
            </div>
            <div style={fieldWrap}>
              <span style={lbl}>Genre</span>
              <select
                style={inputStyle}
                value={form.genre}
                onChange={(e) => update('genre', e.target.value)}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={fieldWrap}>
            <span style={lbl}>Excerpt (optional)</span>
            <textarea
              style={{ ...inputStyle, minHeight: '5rem', resize: 'vertical' }}
              value={form.excerpt}
              placeholder="Paste a short excerpt or key passage…"
              onChange={(e) => update('excerpt', e.target.value)}
            />
          </div>

          <div style={fieldWrap}>
            <span style={lbl}>Teacher Comments (optional)</span>
            <textarea
              style={{ ...inputStyle, minHeight: '4rem', resize: 'vertical' }}
              value={form.teacherComments}
              placeholder="Observations about craft, growth, or voice…"
              onChange={(e) => update('teacherComments', e.target.value)}
            />
          </div>

          <div style={twoCol}>
            <div style={fieldWrap}>
              <span style={lbl}>Term</span>
              <input
                style={inputStyle}
                type="text"
                required
                value={form.term}
                placeholder="e.g. Spring 2026"
                onChange={(e) => update('term', e.target.value)}
              />
            </div>
            <div style={fieldWrap}>
              <span style={lbl}>Academic Year</span>
              <input
                style={inputStyle}
                type="text"
                required
                value={form.academicYear}
                placeholder="e.g. 2025-2026"
                onChange={(e) => update('academicYear', e.target.value)}
              />
            </div>
          </div>

          <button style={submitBtn} type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Sample'}
          </button>
        </form>
      )}
    </div>
  )
}
