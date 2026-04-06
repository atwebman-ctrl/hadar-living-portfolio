'use client'

// ============================================================
// components/portfolio/AssessmentForm.tsx
// Sub-form for TeacherDataPanel — assessment score entry.
// ============================================================

import { useState } from 'react'

const ASSESSMENT_TYPES = [
  { value: 'maps_math',       label: 'MAP Math' },
  { value: 'maps_english',    label: 'MAP Reading' },
  { value: 'avant_reading',   label: 'AVANT Reading' },
  { value: 'avant_listening', label: 'AVANT Listening' },
  { value: 'avant_speaking',  label: 'AVANT Speaking' },
  { value: 'avant_writing',   label: 'AVANT Writing' },
] as const

interface ScoreRange { min: number; max: number; hint: string }

function getScoreRange(type: string): ScoreRange | null {
  if (type === 'maps_math' || type === 'maps_english') {
    return { min: 100, max: 350, hint: '100–350' }
  }
  if (type === 'avant_reading' || type === 'avant_listening' ||
      type === 'avant_speaking' || type === 'avant_writing') {
    return { min: 1, max: 10, hint: '1–10' }
  }
  return null
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--ink)',
  background: 'var(--cream)',
  border: '1px solid var(--rule)',
  padding: '0.4rem 0.6rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-light)',
  display: 'block',
  marginBottom: '0.25rem',
}

const submitBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold-pale)',
  background: 'var(--navy)',
  border: '1px solid var(--gold)',
  padding: '0.5rem 1.25rem',
}

interface Props {
  studentId: string
  onStatus: (s: { type: 'success' | 'error'; msg: string } | null) => void
}

interface Fields {
  assessmentType: string
  score: string
  percentile: string
  term: string
  academicYear: string
}

const blank: Fields = { assessmentType: 'maps_math', score: '', percentile: '', term: '', academicYear: '' }

export default function AssessmentForm({ studentId, onStatus }: Props) {
  const [fields, setFields] = useState<Fields>(blank)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onStatus(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentType: fields.assessmentType,
          score: fields.score !== '' ? Number(fields.score) : null,
          percentile: fields.percentile !== '' ? Number(fields.percentile) : null,
          term: fields.term,
          academicYear: fields.academicYear,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        onStatus({ type: 'error', msg: (body as { error?: string }).error ?? 'Failed to save.' })
      } else {
        onStatus({ type: 'success', msg: 'Assessment saved.' })
        setFields(blank)
      }
    } catch {
      onStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  const scoreRange = getScoreRange(fields.assessmentType)

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Assessment Type</label>
          <select value={fields.assessmentType} onChange={set('assessmentType')} style={inputStyle} required>
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>
            Score{scoreRange && <span style={{ fontWeight: 'normal', letterSpacing: 0, textTransform: 'none' }}> ({scoreRange.hint})</span>}
          </label>
          <input
            type="number"
            min={scoreRange?.min}
            max={scoreRange?.max}
            value={fields.score}
            onChange={set('score')}
            style={inputStyle}
            placeholder={scoreRange ? scoreRange.hint : 'Score'}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Percentile (0–100)</label>
          <input type="number" min={0} max={100} value={fields.percentile} onChange={set('percentile')} style={inputStyle} placeholder="e.g. 85" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Term</label>
          <input type="text" value={fields.term} onChange={set('term')} style={inputStyle} placeholder="e.g. Fall 2025" required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Academic Year</label>
          <input type="text" value={fields.academicYear} onChange={set('academicYear')} style={inputStyle} placeholder="e.g. 2025-2026" pattern="\d{4}-\d{4}" title="Format: YYYY-YYYY" required />
        </div>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={saving} style={{ ...submitBtnStyle, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Assessment'}
        </button>
      </div>
    </form>
  )
}
