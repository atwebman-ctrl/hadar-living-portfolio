'use client'

// ============================================================
// components/portfolio/ReadingForm.tsx
// Sub-form for TeacherDataPanel — reading list entry.
// ============================================================

import { useState } from 'react'
import BookCatalogPicker from './BookCatalogPicker'
import { ACADEMIC_YEAR_OPTIONS } from '@/lib/constants'

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
  studentId:  string
  onStatus:   (s: { type: 'success' | 'error'; msg: string } | null) => void
  onSuccess?: () => void
}

interface Fields {
  title: string
  author: string
  whyChosen: string
  completed: boolean
  academicYear: string
}

const blank: Fields = { title: '', author: '', whyChosen: '', completed: false, academicYear: '' }

export default function ReadingForm({ studentId, onStatus, onSuccess }: Props) {
  const [fields,     setFields]     = useState<Fields>(blank)
  const [saving,     setSaving]     = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  function handleCatalogSelect(book: { title: string; author: string }) {
    setFields((f) => ({ ...f, title: book.title, author: book.author }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onStatus(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fields.title,
          author: fields.author || null,
          whyChosen: fields.whyChosen || null,
          completed: fields.completed,
          academicYear: fields.academicYear,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        onStatus({ type: 'error', msg: (body as { error?: string }).error ?? 'Failed to save.' })
      } else {
        onStatus({ type: 'success', msg: 'Book added to reading list.' })
        setFields(blank)
        onSuccess?.()
      }
    } catch {
      onStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof Omit<Fields, 'completed'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      {showPicker && (
        <BookCatalogPicker
          onSelect={handleCatalogSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Title</label>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)', background: 'none', border: '1px solid var(--navy)', padding: '2px 8px', cursor: 'pointer' }}
            >
              Add from catalog
            </button>
          </div>
          <input type="text" value={fields.title} onChange={set('title')} style={inputStyle} placeholder="Book title" required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Author</label>
          <input type="text" value={fields.author} onChange={set('author')} style={inputStyle} placeholder="Author name" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Academic Year</label>
          <select value={fields.academicYear} onChange={set('academicYear')} style={inputStyle} required>
            <option value="">Select year…</option>
            {ACADEMIC_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Why Chosen</label>
          <textarea value={fields.whyChosen} onChange={set('whyChosen')} style={{ ...inputStyle, resize: 'vertical', minHeight: '4rem' }} placeholder="Reason this book was selected…" />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="reading-completed"
            checked={fields.completed}
            onChange={(e) => setFields((f) => ({ ...f, completed: e.target.checked }))}
            style={{ accentColor: 'var(--navy)', width: '1rem', height: '1rem' }}
          />
          <label htmlFor="reading-completed" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
            Completed
          </label>
        </div>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={saving} style={{ ...submitBtnStyle, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Add to Reading List'}
        </button>
      </div>
    </form>
    </>
  )
}
