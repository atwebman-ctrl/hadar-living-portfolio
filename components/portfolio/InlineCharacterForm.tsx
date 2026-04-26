'use client'

// ============================================================
// components/portfolio/InlineCharacterForm.tsx
//
// TODO: rename to CharacterAwardModal — this is now a controlled
// modal, the trigger buttons live in CharacterArc.
//
// Add Character Award modal. Open/close is controlled by the
// parent (CharacterArc) so multiple triggers can share one modal.
// POSTs to /api/dashboard/students/[studentId]/character-awards
// and calls router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'

interface Props {
  studentId: string
  open:      boolean
  onClose:   () => void
}

// ── Styles ────────────────────────────────────────────────────

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

const EMPTY = { awardName: '', description: '', term: '', academicYear: '' }

export default function InlineCharacterForm({ studentId, open, onClose }: Props) {
  const router   = useRouter()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form,   setForm]   = useState({ ...EMPTY })

  function close() { setStatus(null); onClose() }
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const res  = await fetch(`/api/dashboard/students/${studentId}/character-awards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
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

  if (!open) return null

  return (
    <div style={MODAL_OVERLAY} onClick={close}>
      <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
        <div style={MODAL_HEADER}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Add Character Award
          </span>
          <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
        </div>
        <div style={MODAL_BODY}>
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div style={fieldWrap}>
              <span style={lbl}>Award Name (Virtue)</span>
              <input style={inp} type="text" required value={form.awardName} placeholder="e.g. Courage, Kindness, Responsibility" onChange={(e) => update('awardName', e.target.value)} />
            </div>
            <div style={fieldWrap}>
              <span style={lbl}>Description</span>
              <textarea style={{ ...inp, minHeight: '5rem', resize: 'vertical' }} value={form.description} placeholder="Brief note on why this award was given…" onChange={(e) => update('description', e.target.value)} />
            </div>
            <div style={twoCol}>
              <div style={fieldWrap}>
                <span style={lbl}>Academic Year</span>
                <select style={inp} required value={form.academicYear} onChange={(e) => update('academicYear', e.target.value)}>
                  <option value="">Select year…</option>
                  {ACADEMIC_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={fieldWrap}>
                <span style={lbl}>Term</span>
                <select style={inp} required value={form.term} onChange={(e) => update('term', e.target.value)}>
                  <option value="">Select term…</option>
                  {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button style={{ ...submitBtn, opacity: saving ? 0.6 : 1 }} type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Award'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
