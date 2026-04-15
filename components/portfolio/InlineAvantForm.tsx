'use client'

// ============================================================
// components/portfolio/InlineAvantForm.tsx
//
// "+ Add AVANT Score" button opens a modal popup inside the
// Hebrew section. Visible to admin/teacher only
// (caller gates). POSTs to the assessments route and calls
// router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'

interface Props {
  studentId: string
}

const AVANT_TYPES = [
  { value: 'avant_reading',   label: 'AVANT Reading' },
  { value: 'avant_listening', label: 'AVANT Listening' },
  { value: 'avant_speaking',  label: 'AVANT Speaking' },
  { value: 'avant_writing',   label: 'AVANT Writing' },
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
const inp: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)',
  fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)',
  border: '1px solid var(--rule)', boxSizing: 'border-box',
}
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }
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

const EMPTY = { assessmentType: 'avant_reading' as string, score: '', percentile: '', term: '', academicYear: '' }

export default function InlineAvantForm({ studentId }: Props) {
  const router   = useRouter()
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form,   setForm]   = useState({ ...EMPTY })

  function close() { setOpen(false); setStatus(null) }
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const body: Record<string, unknown> = {
        assessmentType: form.assessmentType,
        score:          form.score !== '' ? Number(form.score) : null,
        term:           form.term,
        academicYear:   form.academicYear,
      }
      if (form.percentile !== '') body.percentile = Number(form.percentile)
      const res  = await fetch(`/api/dashboard/students/${studentId}/assessments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        setForm({ ...EMPTY })
        close()
        router.refresh()
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error — please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <button style={toggleBtn} onClick={() => { setOpen(true); setStatus(null) }}>
          + Add AVANT Score
        </button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Add AVANT Score
              </span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
              {status && <div style={statusBar(status.type)}>{status.msg}</div>}
              <form onSubmit={handleSubmit}>
                <div style={twoCol}>
                  <div style={fieldWrap}>
                    <span style={lbl}>Assessment Type</span>
                    <select style={inp} value={form.assessmentType} onChange={(e) => update('assessmentType', e.target.value)}>
                      {AVANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={fieldWrap}>
                    <span style={lbl}>Score (1–10)</span>
                    <input style={inp} type="number" min={1} max={10} step={1} required value={form.score} placeholder="e.g. 7" onChange={(e) => update('score', e.target.value)} />
                  </div>
                </div>
                <div style={twoCol}>
                  <div style={fieldWrap}>
                    <span style={lbl}>Percentile (optional)</span>
                    <input style={inp} type="number" min={0} max={100} step={1} value={form.percentile} placeholder="0–100" onChange={(e) => update('percentile', e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <span style={lbl}>Term</span>
                    <select style={inp} required value={form.term} onChange={(e) => update('term', e.target.value)}>
                      <option value="">Select term…</option>
                      {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={fieldWrap}>
                  <span style={lbl}>Academic Year</span>
                  <select style={inp} required value={form.academicYear} onChange={(e) => update('academicYear', e.target.value)}>
                    <option value="">Select year…</option>
                    {ACADEMIC_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button style={{ ...submitBtn, opacity: saving ? 0.6 : 1 }} type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Score'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
