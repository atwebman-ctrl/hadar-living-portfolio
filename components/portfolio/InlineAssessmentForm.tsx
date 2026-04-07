'use client'

// ============================================================
// components/portfolio/InlineAssessmentForm.tsx
//
// Collapsible "Add Assessment" disclosure rendered directly
// inside each IntellectualArc subject sub-section.
// Visible to admin/teacher only (caller is responsible for
// not rendering this for parents).
// ============================================================

import { useState } from 'react'
import AssessmentForm from './AssessmentForm'

interface Props {
  studentId:   string
  /** Pre-selects the assessment type dropdown. Defaults to 'maps_math'. */
  defaultType?: string
  label?:       string
}

// ── Styles ────────────────────────────────────────────────────

const toggleBtn: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         'var(--navy)',
  background:    'none',
  border:        '1px solid var(--navy)',
  padding:       '4px 12px',
  cursor:        'pointer',
}

const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding:       '0.4rem 0.75rem',
  marginBottom:  '0.75rem',
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.62rem',
  letterSpacing: '0.06em',
  color:         type === 'success' ? '#166534' : '#991b1b',
  background:    type === 'success' ? '#f0fdf4' : '#fef2f2',
  border:        `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
})

// ── Component ─────────────────────────────────────────────────

export default function InlineAssessmentForm({
  studentId,
  defaultType = 'maps_math',
  label = 'Add Assessment',
}: Props) {
  const [open,   setOpen]   = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function handleStatus(s: { type: 'success' | 'error'; msg: string } | null) {
    setStatus(s)
  }

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
      <button style={toggleBtn} onClick={() => { setOpen((o) => !o); setStatus(null) }}>
        {open ? '− ' : '+ '}{label}
      </button>

      {open && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}
          <AssessmentForm
            studentId={studentId}
            defaultType={defaultType}
            onStatus={handleStatus}
          />
        </div>
      )}
    </div>
  )
}
