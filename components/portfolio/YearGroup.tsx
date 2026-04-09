'use client'

// ============================================================
// components/portfolio/YearGroup.tsx
//
// Collapsible section wrapper for a single academic year.
// Used by IntellectualArcAllYears and will be reused by other
// sections as multi-year support rolls out.
// ============================================================

import { useState } from 'react'

interface Props {
  year:         string
  defaultOpen?: boolean
  children:     React.ReactNode
}

export default function YearGroup({ year, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '0.5rem',
          width:         '100%',
          background:    'none',
          border:        'none',
          borderBottom:  '1px solid var(--rule)',
          padding:       '0.4rem 0',
          cursor:        'pointer',
          textAlign:     'left',
        }}
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         open ? 'var(--navy)' : 'var(--ink-faint)',
            fontWeight:    open ? 600 : 400,
          }}
        >
          {year}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   '0.5rem',
            color:      'var(--ink-faint)',
            marginLeft: 'auto',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ paddingTop: '0.5rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}
