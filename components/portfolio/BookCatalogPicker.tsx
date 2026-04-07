'use client'

// ============================================================
// components/portfolio/BookCatalogPicker.tsx
//
// Modal overlay that fetches the school's book catalog and lets
// a teacher pick a title to auto-fill ReadingForm fields.
// ============================================================

import { useEffect, useState } from 'react'
import type { BookCatalogEntry } from '@/lib/types'

interface Props {
  onSelect: (book: { title: string; author: string }) => void
  onClose:  () => void
}

// ── Styles ────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position:       'fixed',
  inset:          0,
  background:     'rgba(0,0,0,0.45)',
  zIndex:         500,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        '1rem',
}

const panel: React.CSSProperties = {
  background:   'var(--cream)',
  border:       '1px solid var(--navy)',
  width:        '100%',
  maxWidth:     480,
  maxHeight:    '80vh',
  display:      'flex',
  flexDirection:'column',
  overflow:     'hidden',
}

const header: React.CSSProperties = {
  background:     'var(--navy)',
  padding:        '0.6rem 1.25rem',
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
}

const headingText: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color:         'var(--gold)',
}

const closeBtn: React.CSSProperties = {
  background:    'none',
  border:        'none',
  color:         'var(--gold)',
  fontSize:      '0.8rem',
  cursor:        'pointer',
  lineHeight:    1,
  padding:       '0 0.25rem',
}

const searchInput: React.CSSProperties = {
  width:         '100%',
  boxSizing:     'border-box',
  fontFamily:    'var(--font-body)',
  fontSize:      '0.875rem',
  color:         'var(--ink)',
  background:    'var(--cream)',
  border:        '1px solid var(--rule)',
  padding:       '0.4rem 0.6rem',
  outline:       'none',
}

const emptyText: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   '0.65rem',
  color:      'var(--ink-faint)',
  padding:    '1.25rem',
  textAlign:  'center',
}

const bookRow: React.CSSProperties = {
  width:         '100%',
  background:    'none',
  border:        'none',
  borderBottom:  '1px solid var(--rule)',
  padding:       '0.65rem 1.25rem',
  cursor:        'pointer',
  textAlign:     'left',
  display:       'flex',
  flexDirection: 'column',
  gap:           '0.15rem',
}

// ── Component ─────────────────────────────────────────────────

export default function BookCatalogPicker({ onSelect, onClose }: Props) {
  const [books,   setBooks]   = useState<BookCatalogEntry[]>([])
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/schools/book-catalog')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: BookCatalogEntry[]) => { setBooks(data); setLoading(false) })
      .catch(() => { setFetchErr('Failed to load catalog.'); setLoading(false) })
  }, [])

  const q = query.toLowerCase()
  const filtered = books.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={header}>
          <span style={headingText}>Book Catalog</span>
          <button style={closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--rule)' }}>
          <input
            type="text"
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={searchInput}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading  && <p style={emptyText}>Loading…</p>}
          {fetchErr && <p style={{ ...emptyText, color: '#991b1b' }}>{fetchErr}</p>}
          {!loading && !fetchErr && filtered.length === 0 && (
            <p style={emptyText}>{query ? 'No matches.' : 'No books in catalog yet.'}</p>
          )}
          {filtered.map((b) => (
            <button
              key={b.id}
              style={bookRow}
              onClick={() => { onSelect({ title: b.title, author: b.author }); onClose() }}
            >
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)' }}>
                {b.title}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-light)' }}>
                {b.author}
                {b.gradeLevel && (
                  <span style={{ color: 'var(--ink-faint)', marginLeft: '0.75rem' }}>
                    {b.gradeLevel}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
