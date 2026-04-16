'use client'

// ============================================================
// components/dashboard/StudentAutocomplete.tsx
//
// Type-ahead student picker for the Teacher Workbench.
// Filters the pre-loaded students array client-side.
// ============================================================

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Student } from '@/lib/types'
import { formatGrade } from '@/lib/gradeLevel'

interface Props {
  students:  Student[]
  selected:  { id: string; name: string } | null
  onSelect:  (s: { id: string; name: string } | null) => void
}

const INPUT: CSSProperties = {
  width: '100%', border: '1px solid var(--rule)', borderRadius: 6,
  padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)',
  color: 'var(--ink)', background: 'var(--white)', boxSizing: 'border-box',
}

const DROP: CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
  background: 'var(--white)', border: '1px solid var(--rule)', borderTop: 'none',
  borderRadius: '0 0 6px 6px', maxHeight: 280, overflowY: 'auto',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

const ITEM: CSSProperties = {
  padding: '8px 12px', cursor: 'pointer', display: 'flex',
  alignItems: 'baseline', gap: 8, fontSize: 14,
  fontFamily: 'var(--font-body)', color: 'var(--ink)',
}

const ITEM_HOVER: CSSProperties = {
  ...ITEM, background: 'rgba(184,160,80,0.08)',
}

const GRADE_HINT: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
  color: 'var(--ink-faint)', textTransform: 'uppercase',
}

export default function StudentAutocomplete({ students, selected, onSelect }: Props) {
  const [query, setQuery]       = useState('')
  const [open,  setOpen]        = useState(false)
  const [hover, setHover]       = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  const fullName = (s: Student) => `${s.firstName} ${s.lastName}`

  const matches = query.trim()
    ? students.filter((s) => fullName(s).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : students.slice(0, 8)

  useEffect(() => { setHover(-1) }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(s: Student) {
    onSelect({ id: s.id, name: fullName(s) })
    setQuery(fullName(s))
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHover((h) => Math.min(h + 1, matches.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHover((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && hover >= 0 && matches[hover]) { e.preventDefault(); pick(matches[hover]) }
    if (e.key === 'Tab' && matches.length === 1 && open) { e.preventDefault(); pick(matches[0]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        style={INPUT}
        placeholder="Student…"
        value={selected && !open ? selected.name : query}
        onFocus={() => { setOpen(true); if (selected) { setQuery(selected.name) } }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (selected) onSelect(null)
        }}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <div style={DROP}>
          {matches.map((s, i) => (
            <div
              key={s.id}
              style={i === hover ? ITEM_HOVER : ITEM}
              onMouseEnter={() => setHover(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
            >
              <span>{fullName(s)}</span>
              <span style={GRADE_HINT}>{formatGrade(s.gradeLevel)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
