'use client'

// ============================================================
// components/portfolio/InlineAssessmentForm.tsx
//
// "+ Add Assessment" button opens a modal popup.
// Visible to admin/teacher only (caller is responsible for
// not rendering this for parents).
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'

const ASSESSMENT_TYPES = [
  { value: 'maps_math',       label: 'MAP Math' },
  { value: 'maps_english',    label: 'MAP Reading' },
  { value: 'avant_reading',   label: 'AVANT Reading' },
  { value: 'avant_listening', label: 'AVANT Listening' },
  { value: 'avant_speaking',  label: 'AVANT Speaking' },
  { value: 'avant_writing',   label: 'AVANT Writing' },
] as const

function getScoreRange(type: string): { min: number; max: number; hint: string } | null {
  if (type === 'maps_math' || type === 'maps_english') return { min: 100, max: 350, hint: '100–350' }
  if (['avant_reading','avant_listening','avant_speaking','avant_writing'].includes(type)) return { min: 1, max: 10, hint: '1–10' }
  return null
}

// ── Styles ────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)',
  background: 'var(--cream)', border: '1px solid var(--rule)',
  padding: '0.4rem 0.6rem', width: '100%', boxSizing: 'border-box', outline: 'none',
}
const lbl: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-light)', display: 'block', marginBottom: '0.25rem',
}
const toggleBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}
const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '0.4rem 0.75rem', marginBottom: '0.75rem',
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em',
  color:      type === 'success' ? 'var(--state-success)' : 'var(--state-error)',
  background: type === 'success' ? 'var(--state-success-bg)' : 'var(--state-error-bg)',
  border:     `1px solid ${type === 'success' ? 'var(--state-success-border)' : 'var(--state-error-border)'}`,
})

// ── Types ─────────────────────────────────────────────────────

interface Fields { assessmentType: string; score: string; percentile: string; term: string; academicYear: string }

interface Props {
  studentId:    string
  defaultType?: string
  label?:       string
}

// ── Component ─────────────────────────────────────────────────

export default function InlineAssessmentForm({ studentId, defaultType = 'maps_math', label = 'Add Assessment' }: Props) {
  const router  = useRouter()
  const [open,   setOpen]   = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [fields, setFields] = useState<Fields>(() => ({ assessmentType: defaultType, score: '', percentile: '', term: '', academicYear: '' }))
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId]     = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const pdfRef = useRef<HTMLInputElement>(null)

  function close() {
    setOpen(false); setStatus(null); setSavedId(null)
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/assessments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentType: fields.assessmentType,
          score:      fields.score      !== '' ? Number(fields.score)      : null,
          percentile: fields.percentile !== '' ? Number(fields.percentile) : null,
          term: fields.term, academicYear: fields.academicYear,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ type: 'error', msg: (body as { error?: string }).error ?? 'Failed to save.' })
      } else {
        const isMap = fields.assessmentType === 'maps_math' || fields.assessmentType === 'maps_english'
        const createdId = (body as { id?: string }).id
        if (isMap && createdId) {
          setSavedId(createdId)
          setStatus({ type: 'success', msg: 'Score saved. Attach a MAP report PDF below, or close.' })
        } else {
          setFields({ assessmentType: defaultType, score: '', percentile: '', term: '', academicYear: '' })
          close()
          router.refresh()
        }
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  async function handlePdfUpload(file: File) {
    if (!savedId) return
    setPdfUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/dashboard/students/${studentId}/assessments/${savedId}/pdf`, {
        method: 'POST', body: fd,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setStatus({ type: 'error', msg: (j as { error?: string }).error ?? 'PDF upload failed.' })
      } else {
        setStatus({ type: 'success', msg: 'PDF attached.' })
        setFields({ assessmentType: defaultType, score: '', percentile: '', term: '', academicYear: '' })
        setSavedId(null)
        setTimeout(() => { close(); router.refresh() }, 800)
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setPdfUploading(false)
    }
  }

  const scoreRange = getScoreRange(fields.assessmentType)

  return (
    <>
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <button style={toggleBtn} onClick={() => { setOpen(true); setStatus(null) }}>
          + {label}
        </button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {label}
              </span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
              {status && <div style={statusBar(status.type)}>{status.msg}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <label style={lbl}>Assessment Type</label>
                    <select value={fields.assessmentType} onChange={set('assessmentType')} style={inp} required>
                      {ASSESSMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>
                      Score{scoreRange && <span style={{ fontWeight: 'normal', letterSpacing: 0, textTransform: 'none' }}> ({scoreRange.hint})</span>}
                    </label>
                    <input type="number" min={scoreRange?.min} max={scoreRange?.max} value={fields.score} onChange={set('score')} style={inp} placeholder={scoreRange ? scoreRange.hint : 'Score'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Percentile (0–100)</label>
                    <input type="number" min={0} max={100} value={fields.percentile} onChange={set('percentile')} style={inp} placeholder="e.g. 85" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Term</label>
                    <select value={fields.term} onChange={set('term')} style={inp} required>
                      <option value="">Select term…</option>
                      {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Academic Year</label>
                    <select value={fields.academicYear} onChange={set('academicYear')} style={inp} required>
                      <option value="">Select year…</option>
                      {ACADEMIC_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={saving || !!savedId} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-pale)', background: 'var(--navy)', border: '1px solid var(--gold)', padding: '0.5rem 1.25rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: (saving || !!savedId) ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Save Assessment'}
                  </button>
                </div>
              </form>
              {savedId && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid var(--rule)', borderRadius: 6, background: 'var(--cream)' }}>
                  <div style={{ ...lbl, marginBottom: '0.5rem' }}>Attach MAP report (PDF or image)</div>
                  <input ref={pdfRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePdfUpload(f) }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" disabled={pdfUploading} onClick={() => pdfRef.current?.click()} style={{ ...toggleBtn, opacity: pdfUploading ? 0.6 : 1 }}>
                      {pdfUploading ? 'Uploading…' : 'Choose file'}
                    </button>
                    <button type="button" onClick={() => { setFields({ assessmentType: defaultType, score: '', percentile: '', term: '', academicYear: '' }); close(); router.refresh() }} style={{ ...toggleBtn, border: 'none', textDecoration: 'underline', color: 'var(--ink-light)' }}>
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
