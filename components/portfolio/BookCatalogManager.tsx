'use client'

// ============================================================
// components/portfolio/BookCatalogManager.tsx
//
// "Book Catalog" tab inside TeacherDataPanel.
// Lets admin/teacher add books to the school-wide catalog and
// view the current list. No props needed — school is derived
// server-side by the API route.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookCatalogEntry } from '@/lib/types'

// ── Shared style tokens ────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         'var(--ink-light)',
  display:       'block',
  marginBottom:  '0.25rem',
}

const input: React.CSSProperties = {
  fontFamily:  'var(--font-body)',
  fontSize:    '0.875rem',
  color:       'var(--ink)',
  background:  'var(--cream)',
  border:      '1px solid var(--rule)',
  padding:     '0.4rem 0.6rem',
  width:       '100%',
  boxSizing:   'border-box',
  outline:     'none',
}

const submitBtn: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         'var(--gold-pale)',
  background:    'var(--navy)',
  border:        '1px solid var(--gold)',
  padding:       '0.5rem 1.25rem',
  cursor:        'pointer',
}

// ── Blank form state ──────────────────────────────────────────

interface Fields { title: string; author: string; gradeLevel: string }
const blank: Fields = { title: '', author: '', gradeLevel: '' }

// ── Component ─────────────────────────────────────────────────

export default function BookCatalogManager() {
  const router = useRouter()
  const [fields,  setFields]  = useState<Fields>(blank)
  const [saving,  setSaving]  = useState(false)
  const [books,   setBooks]   = useState<BookCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadCatalog = useCallback(() => {
    setLoading(true)
    fetch('/api/dashboard/schools/book-catalog')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: BookCatalogEntry[]) => { setBooks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const set = (k: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/dashboard/schools/book-catalog', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:      fields.title,
          author:     fields.author,
          gradeLevel: fields.gradeLevel,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ type: 'error', msg: (body as { error?: string }).error ?? 'Failed to save.' })
      } else {
        setStatus({ type: 'success', msg: `"${fields.title}" added to catalog.` })
        setFields(blank)
        loadCatalog()
        router.refresh()
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ── Add book form ──────────────────────────────────── */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-light)', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
        Add a title to the school-wide catalog. Teachers can select from it when adding reading list entries.
      </p>

      {status && (
        <div style={{
          padding:       '0.45rem 0.75rem',
          marginBottom:  '0.75rem',
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.62rem',
          letterSpacing: '0.06em',
          color:         status.type === 'success' ? '#166534' : '#991b1b',
          background:    status.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border:        `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
            <label style={monoLabel}>Title</label>
            <input type="text" value={fields.title} onChange={set('title')} style={input} placeholder="Book title" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={monoLabel}>Author</label>
            <input type="text" value={fields.author} onChange={set('author')} style={input} placeholder="Author name" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={monoLabel}>Grade Level</label>
            <input type="text" value={fields.gradeLevel} onChange={set('gradeLevel')} style={input} placeholder="e.g. 3rd Grade" required />
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} style={{ ...submitBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Add to Catalog'}
          </button>
        </div>
      </form>

      {/* ── Existing catalog ────────────────────────────────── */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>
          {loading ? 'Loading…' : `${books.length} book${books.length !== 1 ? 's' : ''} in catalog`}
        </div>
        {!loading && books.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)' }}>
            No books yet. Add the first one above.
          </p>
        )}
        {books.map((b) => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid var(--rule)' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)' }}>{b.title}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-light)', marginLeft: '0.5rem' }}>{b.author}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>{b.gradeLevel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
