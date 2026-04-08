'use client'

// ============================================================
// components/portfolio/InlineCharacterForm.tsx
//
// Collapsible form for adding a character virtue award inside
// The Character Arc section. Visible to admin/teacher only
// (caller is responsible for not rendering this for parents).
// POSTs to /api/dashboard/students/[studentId]/character-awards
// and calls router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
}

// ── Styles (matching InlineAssessmentForm / InlineVideoForm pattern) ──────────

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

const EMPTY = { awardName: '', description: '', term: '', academicYear: '' }

export default function InlineCharacterForm({ studentId }: Props) {
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
      const res = await fetch(`/api/dashboard/students/${studentId}/character-awards`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        setStatus({ type: 'success', msg: 'Award added.' })
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
        {open ? '− ' : '+ '}Add Award
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}
        >
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}

          <div style={fieldWrap}>
            <span style={lbl}>Award Name (Virtue)</span>
            <input
              style={inputStyle} type="text" required
              value={form.awardName}
              placeholder="e.g. Courage, Kindness, Responsibility"
              onChange={(e) => update('awardName', e.target.value)}
            />
          </div>

          <div style={fieldWrap}>
            <span style={lbl}>Description</span>
            <textarea
              style={{ ...inputStyle, minHeight: '5rem', resize: 'vertical' }}
              value={form.description}
              placeholder="Brief note on why this award was given…"
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div style={twoCol}>
            <div style={fieldWrap}>
              <span style={lbl}>Term</span>
              <input
                style={inputStyle} type="text" required
                value={form.term}
                placeholder="e.g. Fall 2025"
                onChange={(e) => update('term', e.target.value)}
              />
            </div>
            <div style={fieldWrap}>
              <span style={lbl}>Academic Year</span>
              <input
                style={inputStyle} type="text" required
                value={form.academicYear}
                placeholder="e.g. 2025-2026"
                onChange={(e) => update('academicYear', e.target.value)}
              />
            </div>
          </div>

          <button style={submitBtn} type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Award'}
          </button>
        </form>
      )}
    </div>
  )
}
