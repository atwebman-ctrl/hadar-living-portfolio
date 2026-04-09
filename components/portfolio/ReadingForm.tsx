'use client'

// ============================================================
// components/portfolio/ReadingForm.tsx
// Enhanced book intake form with 4 grouped sections.
// ============================================================

import { useState } from 'react'
import BookCatalogPicker from './BookCatalogPicker'
import StarRating from './StarRating'
import {
  ACADEMIC_YEAR_OPTIONS,
  READING_DIFFICULTY_OPTIONS,
  CURRICULUM_CONNECTION_OPTIONS,
} from '@/lib/constants'

// ── Shared styles ─────────────────────────────────────────────

const inp: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)',
  background: 'var(--cream)', border: '1px solid var(--rule)',
  padding: '0.4rem 0.6rem', width: '100%', boxSizing: 'border-box', outline: 'none',
}
const lbl: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-light)', display: 'block', marginBottom: '0.25rem',
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }
const sectionHead: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--rule)', paddingBottom: '0.35rem',
  marginBottom: '0.75rem', marginTop: '1.25rem',
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={wide ? { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' } : { display: 'flex', flexDirection: 'column' }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────

interface Fields {
  title:                string
  author:               string
  academicYear:         string
  completed:            boolean
  readingDifficulty:    string
  dateStarted:          string
  dateFinished:         string
  curriculumConnection: string
  studentRating:        number
  whyChosen:            string
  keyQuote:             string
  teacherNotes:         string
}

const blank: Fields = {
  title: '', author: '', academicYear: '', completed: false,
  readingDifficulty: '', dateStarted: '', dateFinished: '',
  curriculumConnection: '', studentRating: 0,
  whyChosen: '', keyQuote: '', teacherNotes: '',
}

interface Props {
  studentId:  string
  readingId?: string        // if set → edit mode (PATCH instead of POST)
  initial?:   Partial<Fields>
  onStatus:   (s: { type: 'success' | 'error'; msg: string } | null) => void
  onSuccess?: () => void
}

// ── Component ─────────────────────────────────────────────────

export default function ReadingForm({ studentId, readingId, initial, onStatus, onSuccess }: Props) {
  const [fields,      setFields]      = useState<Fields>(initial ? { ...blank, ...initial } : blank)
  const [saving,      setSaving]      = useState(false)
  const [showPicker,  setShowPicker]  = useState(false)
  const isEdit = !!readingId

  const set = (k: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }))

  function handleCatalogSelect(book: { title: string; author: string }) {
    setFields((f) => ({ ...f, title: book.title, author: book.author }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onStatus(null)
    try {
      const body: Record<string, unknown> = {
        title:        fields.title,
        author:       fields.author   || null,
        academicYear: fields.academicYear,
        completed:    fields.completed,
        whyChosen:    fields.whyChosen || null,
        teacherNotes: fields.teacherNotes || null,
        keyQuote:     fields.keyQuote  || null,
        readingDifficulty:    fields.readingDifficulty    || null,
        curriculumConnection: fields.curriculumConnection || null,
        studentRating: fields.studentRating > 0 ? fields.studentRating : null,
        dateStarted:  fields.dateStarted  || null,
        dateFinished: fields.dateFinished || null,
      }
      const url = isEdit
        ? `/api/dashboard/students/${studentId}/readings/${readingId}`
        : `/api/dashboard/students/${studentId}/readings`
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        onStatus({ type: 'error', msg: (data as { error?: string }).error ?? 'Failed to save.' })
      } else {
        onStatus({ type: 'success', msg: isEdit ? 'Book updated.' : 'Book added to reading list.' })
        if (!isEdit) setFields(blank)
        onSuccess?.()
      }
    } catch {
      onStatus({ type: 'error', msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {showPicker && (
        <BookCatalogPicker onSelect={handleCatalogSelect} onClose={() => setShowPicker(false)} />
      )}

      <form onSubmit={handleSubmit}>
        {/* ── 1. Book info ─────────────────────────────────── */}
        <p style={sectionHead}>Book Info</p>
        <div style={grid2}>
          <Field label="Title" wide>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="text" value={fields.title} onChange={set('title')} style={{ ...inp, flex: 1 }} placeholder="Book title" required />
              <button type="button" onClick={() => setShowPicker(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)', background: 'none', border: '1px solid var(--navy)', padding: '0.38rem 0.6rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                From catalog
              </button>
            </div>
          </Field>
          <Field label="Author">
            <input type="text" value={fields.author} onChange={set('author')} style={inp} placeholder="Author name" />
          </Field>
          <Field label="Academic Year">
            <select value={fields.academicYear} onChange={set('academicYear')} style={inp} required>
              <option value="">Select year…</option>
              {ACADEMIC_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        </div>

        {/* ── 2. Reading details ───────────────────────────── */}
        <p style={sectionHead}>Reading Details</p>
        <div style={grid2}>
          <Field label="Difficulty Level">
            <select value={fields.readingDifficulty} onChange={set('readingDifficulty')} style={inp}>
              <option value="">Select…</option>
              {READING_DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Curriculum Connection">
            <select value={fields.curriculumConnection} onChange={set('curriculumConnection')} style={inp}>
              <option value="">Select…</option>
              {CURRICULUM_CONNECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Date Started">
            <input type="date" value={fields.dateStarted} onChange={set('dateStarted')} style={inp} />
          </Field>
          <Field label="Date Finished">
            <input type="date" value={fields.dateFinished} onChange={set('dateFinished')} style={inp} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="rf-completed" checked={fields.completed} onChange={(e) => setFields((f) => ({ ...f, completed: e.target.checked }))} style={{ accentColor: 'var(--navy)', width: '1rem', height: '1rem' }} />
            <label htmlFor="rf-completed" style={{ ...lbl, margin: 0, cursor: 'pointer' }}>Completed</label>
          </div>
          <StarRating label="Student Rating" value={fields.studentRating} onChange={(n) => setFields((f) => ({ ...f, studentRating: n }))} />
        </div>

        {/* ── 3. Reflections ──────────────────────────────── */}
        <p style={sectionHead}>Reflections</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Why Chosen" wide>
            <textarea value={fields.whyChosen} onChange={set('whyChosen')} style={{ ...inp, resize: 'vertical', minHeight: '3.5rem' }} placeholder="Reason this book was selected…" />
          </Field>
          <Field label="Key Quote" wide>
            <textarea value={fields.keyQuote} onChange={set('keyQuote')} style={{ ...inp, resize: 'vertical', minHeight: '3.5rem' }} placeholder="A memorable quote or passage the student connected with…" />
          </Field>
          <Field label="Teacher Notes" wide>
            <textarea value={fields.teacherNotes} onChange={set('teacherNotes')} style={{ ...inp, resize: 'vertical', minHeight: '3.5rem' }} placeholder="Notes about this student's experience with the book…" />
          </Field>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-pale)', background: 'var(--navy)', border: '1px solid var(--gold)', padding: '0.5rem 1.25rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Reading List'}
          </button>
        </div>
      </form>
    </>
  )
}
