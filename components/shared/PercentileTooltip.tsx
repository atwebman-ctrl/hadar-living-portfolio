'use client'

// ============================================================
// components/shared/PercentileTooltip.tsx
//
// Small "?" glyph next to a percentile label. Click to toggle
// an explanation popover; click outside to close. Lives next
// to an <a> (the dashboard card) so every interactive element
// must preventDefault + stopPropagation to avoid triggering
// card navigation.
// ============================================================

import { useEffect, useRef, useState } from 'react'

const NWEA_NORMS_URL = 'https://www.nwea.org/resource-center/resource/2025-norms-quick-reference/'

export default function PercentileTooltip({ percentile }: { percentile: number }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        role="button"
        tabIndex={0}
        aria-label="What does percentile mean?"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
        style={{
          display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
          border: '1px solid var(--rule)', fontSize: 9, color: 'var(--ink-light)',
          alignItems: 'center', justifyContent: 'center', cursor: 'help',
          marginLeft: 4, verticalAlign: 'middle',
        }}
      >
        ?
      </span>
      {open && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          style={{
            position: 'absolute', zIndex: 10,
            background: 'var(--white)', border: '1px solid var(--rule)', borderRadius: 8,
            padding: 12, fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.5,
            maxWidth: 280, width: 280, top: '100%', left: 0, marginTop: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          A {percentile} percentile ranking means this student scored higher than {percentile}% of similar students nationwide, based on the 2025 NWEA MAP Growth norms (approximately 13.8 million students from over 30,000 schools).{' '}
          <span
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(NWEA_NORMS_URL, '_blank', 'noopener,noreferrer')
            }}
            style={{ color: 'var(--teal)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Read more at nwea.org
          </span>
        </div>
      )}
    </span>
  )
}
