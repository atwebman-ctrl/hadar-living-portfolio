'use client'

// ============================================================
// components/portfolio/InlineReadingForm.tsx
//
// Collapsible "Add Book" form + "Manage Catalog" modal rendered
// inside TheCanon. Visible to admin/teacher only (caller gates).
// ReadingForm already includes the "Add from catalog" picker.
// ============================================================

import { useState } from 'react'
import ReadingForm from './ReadingForm'
import BookCatalogManager from './BookCatalogManager'

interface Props {
  studentId: string
}

// ── Styles ────────────────────────────────────────────────────

const monoBtn = (variant: 'primary' | 'ghost'): React.CSSProperties => ({
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor:        'pointer',
  padding:       '4px 12px',
  background:    variant === 'primary' ? 'none' : 'none',
  color:         variant === 'primary' ? 'var(--navy)' : 'var(--ink-light)',
  border:        variant === 'primary' ? '1px solid var(--navy)' : '1px solid var(--rule)',
})

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}

const modalPanel: React.CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--navy)',
  width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
}

const modalHeader: React.CSSProperties = {
  background: 'var(--navy)', padding: '0.6rem 1.25rem',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
}

const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '0.4rem 0.75rem', marginBottom: '0.75rem',
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em',
  color:      type === 'success' ? '#166534' : '#991b1b',
  background: type === 'success' ? '#f0fdf4' : '#fef2f2',
  border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
})

// ── Component ─────────────────────────────────────────────────

export default function InlineReadingForm({ studentId }: Props) {
  const [open,        setOpen]        = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [status,      setStatus]      = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  return (
    <>
      {/* Toggle row */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button style={monoBtn('primary')} onClick={() => { setOpen((o) => !o); setStatus(null) }}>
          {open ? '− ' : '+ '}Add Book
        </button>
        <button style={monoBtn('ghost')} onClick={() => setCatalogOpen(true)}>
          Manage Catalog
        </button>
      </div>

      {/* Inline reading form */}
      {open && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
          {status && <div style={statusBar(status.type)}>{status.msg}</div>}
          <ReadingForm studentId={studentId} onStatus={setStatus} />
        </div>
      )}

      {/* Book catalog manager modal */}
      {catalogOpen && (
        <div style={overlay} onClick={() => setCatalogOpen(false)}>
          <div style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Book Catalog
              </span>
              <button
                onClick={() => setCatalogOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              <BookCatalogManager />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
