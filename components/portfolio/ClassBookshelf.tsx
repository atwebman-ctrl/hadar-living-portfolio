'use client'

// DEPRECATED: Replaced by CanonListView in Sprint 5. Safe to delete after confirming no remaining references.

// ============================================================
// components/portfolio/ClassBookshelf.tsx
//
// Class-wide bookshelf: all books read by students in the same
// grade_level and academic_year. Deduplicates by title; shows
// a count badge when multiple students read the same book.
// Clicking a spine opens a BookDetail-style panel with cover,
// author, page count, status, and the list of readers.
// ============================================================

import { useEffect, useState } from 'react'
import { formatGrade } from '@/lib/gradeLevel'
import { BookCoverImage } from '@/components/portfolio/BookDetail'
import { SPINE_PALETTE, SPINE_HEIGHTS } from '@/components/portfolio/spinePalette'
import s from './sections.module.css'

// ── Types ─────────────────────────────────────────────────────

interface ClassReading {
  id: string; studentId: string; studentFirstName: string
  title: string; author: string | null; completed: boolean
  studentRating: number | null; pageCount: number | null
}

interface ApiResponse {
  gradeLevel: string; academicYear: string; studentCount: number; readings: ClassReading[]
}

interface Reader { studentId: string; name: string; rating: number | null; completed: boolean }

interface BookEntry {
  title: string; author: string | null; pageCount: number | null
  primaryStudentId: string; readers: Reader[]; anyCompleted: boolean
}

// ── Helpers ───────────────────────────────────────────────────

function deduplicate(readings: ClassReading[]): BookEntry[] {
  const map = new Map<string, BookEntry>()
  for (const r of readings) {
    const key = r.title.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, {
        title: r.title, author: r.author, pageCount: r.pageCount,
        primaryStudentId: r.studentId, readers: [], anyCompleted: false,
      })
    }
    const entry = map.get(key)!
    entry.readers.push({ studentId: r.studentId, name: r.studentFirstName, rating: r.studentRating, completed: r.completed })
    if (r.completed) entry.anyCompleted = true
    if (r.pageCount != null && entry.pageCount == null) entry.pageCount = r.pageCount
  }
  return Array.from(map.values())
}

function MiniStars({ value }: { value: number }) {
  return (
    <span style={{ color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '0.05em' }} aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}<span style={{ opacity: 0.35 }}>{'☆'.repeat(Math.max(0, 5 - value))}</span>
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────

interface Props { studentId: string }

export default function ClassBookshelf({ studentId }: Props) {
  const [data,      setData]      = useState<ApiResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [openTitle, setOpenTitle] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/dashboard/students/${studentId}/class-readings`)
      .then((r) => r.json())
      .then((d: ApiResponse) => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load class bookshelf.'); setLoading(false) })
  }, [studentId])

  if (loading) return (
    <div style={{ padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
      Loading class bookshelf…
    </div>
  )
  if (error) return (
    <div style={{ padding: '1rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#991b1b' }}>
      {error}
    </div>
  )
  if (!data || data.readings.length === 0) return (
    <div style={{ padding: '1rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
      No readings found for {formatGrade(data?.gradeLevel ?? '')} this year.
    </div>
  )

  const books     = deduplicate(data.readings)
  const mostPop   = books.reduce((b, a) => a.readers.length > b.readers.length ? a : b)
  const gradeName = formatGrade(data.gradeLevel)
  const openBook  = openTitle ? books.find((b) => b.title === openTitle) ?? null : null
  const openIdx   = openTitle ? books.findIndex((b) => b.title === openTitle) : -1
  const openSpine = openIdx >= 0 ? SPINE_PALETTE[openIdx % SPINE_PALETTE.length] : null

  return (
    <div>
      <div className={s.bookshelf}>
        <div className={s.booksRow}>
          {books.map((book, i) => {
            const palette = SPINE_PALETTE[i % SPINE_PALETTE.length]
            const height  = SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]
            const isOpen  = openTitle === book.title
            return (
              <div key={book.title} style={{ position: 'relative' }}>
                <div
                  className={`${s.book} ${book.anyCompleted ? s.bookComplete : s.bookPending}`}
                  style={{ background: palette.color, color: palette.text, height, width: 36, cursor: 'pointer',
                    outline: isOpen ? '2px solid #B8A050' : 'none', outlineOffset: '2px', transition: 'outline 0.15s ease' }}
                  onClick={() => setOpenTitle(isOpen ? null : book.title)}
                  title={`${book.title} — click for details`}
                  role="button" aria-expanded={isOpen}
                >
                  <span className={s.bookTitle}>{book.title}</span>
                  <span className={s.bookDoneLabel}>{book.anyCompleted ? '\u2713' : '\u2026'}</span>
                </div>
                {book.readers.length > 1 && (
                  <div style={{ position: 'absolute', top: -6, right: -6, background: '#B8A050', color: 'white',
                    borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, zIndex: 2 }}>
                    {book.readers.length}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {openBook && openSpine && (
          <div style={{ borderTop: '1px solid var(--rule)', borderRight: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)', borderLeft: `3px solid ${openSpine.color}`,
            background: 'var(--cream)', padding: '1.5rem 1.75rem', marginTop: '1rem',
            display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>

            <BookCoverImage title={openBook.title} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--navy)', margin: 0, lineHeight: 1.25 }}>
                  {openBook.title}
                </h3>
                {openBook.author && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-light)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    by {openBook.author}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                  Read by {openBook.readers.length} student{openBook.readers.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {openBook.readers.map((r) => (
                    <div key={r.studentId} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--ink)', minWidth: 110 }}>{r.name}</span>
                      {r.rating != null && <MiniStars value={r.rating} />}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: r.completed ? 'var(--navy)' : 'var(--ink-faint)' }}>
                        {r.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--ink-faint)', textTransform: 'uppercase', paddingTop: '0.5rem', borderTop: '1px dotted var(--rule)' }}>
                {[
                  openBook.pageCount != null ? `${openBook.pageCount} pages` : null,
                  openBook.anyCompleted ? 'Completed by class' : 'In Progress',
                  data.academicYear,
                ].filter(Boolean).join('  \u00b7  ')}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        Click a spine to see readers · Badge = read by multiple students
      </div>

      {/* Summary stats */}
      <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'var(--cream-dark)', borderLeft: '3px solid #B8A050', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--navy)' }}>{gradeName}</strong>{' '}
        read <strong>{data.readings.length}</strong> book{data.readings.length !== 1 ? 's' : ''} this year
        {' '}across <strong>{data.studentCount}</strong> student{data.studentCount !== 1 ? 's' : ''}.
        {mostPop.readers.length > 1 && (
          <> Most popular: <em>{mostPop.title}</em> (read by {mostPop.readers.length} students).</>
        )}
      </div>
    </div>
  )
}
