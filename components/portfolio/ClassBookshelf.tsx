'use client'

// ============================================================
// components/portfolio/ClassBookshelf.tsx
//
// Class-wide bookshelf: all books read by students in the same
// grade_level and academic_year. Deduplicates by title; shows
// a count badge when multiple students read the same book.
// Each student gets a consistent spine color via hash.
// ============================================================

import { useEffect, useState } from 'react'
import { formatGrade } from '@/lib/gradeLevel'

// ── Types ─────────────────────────────────────────────────────

interface ClassReading {
  id: string; studentId: string; studentFirstName: string
  title: string; author: string | null; completed: boolean; studentRating: number | null
}

interface ApiResponse {
  gradeLevel: string; academicYear: string; studentCount: number; readings: ClassReading[]
}

interface BookEntry {
  title: string; author: string | null; primaryStudentId: string
  readers: { studentId: string; name: string; rating: number | null }[]
}

// ── Spine palette ─────────────────────────────────────────────

const COLORS = [
  '#1B3A6B','#8B4A2D','#2E4A3B','#5E7FA0','#7B5EA0',
  '#4A7A5E','#A07B3E','#6B2D2D','#4A6B8A','#8A8074',
  '#3D6B5E','#6B5E3D','#5E3D6B','#3D5E6B','#6B3D5E',
]
const TEXTS = [
  '#E8EDF5','#F5EDE8','#E8F0EC','#EBF0F5','#F0EBF5',
  '#E8F2ED','#F5EEE0','#F5E8E8','#E8EFF5','#F5F3F0',
  '#ECF0EE','#F0EDEC','#EDEAF0','#EAF0F0','#F0EAF0',
]
const HEIGHTS = [160, 150, 155, 148, 158, 144, 152, 162, 156, 145]

function colorIdx(studentId: string): number {
  let h = 0
  for (let i = 0; i < studentId.length; i++) h = (h * 31 + studentId.charCodeAt(i)) & 0xffff
  return h % COLORS.length
}

function deduplicate(readings: ClassReading[]): BookEntry[] {
  const map = new Map<string, BookEntry>()
  for (const r of readings) {
    const key = r.title.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, { title: r.title, author: r.author, primaryStudentId: r.studentId, readers: [] })
    }
    map.get(key)!.readers.push({ studentId: r.studentId, name: r.studentFirstName, rating: r.studentRating })
  }
  return Array.from(map.values())
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

  const books      = deduplicate(data.readings)
  const mostPop    = books.reduce((b, a) => a.readers.length > b.readers.length ? a : b)
  const gradeName  = formatGrade(data.gradeLevel)
  const openBook   = openTitle ? books.find((b) => b.title === openTitle) ?? null : null

  return (
    <div>
      <div className="bookshelf">
        <div className="books-row">
          {books.map((book, i) => {
            const ci    = colorIdx(book.primaryStudentId)
            const color = COLORS[ci]
            const text  = TEXTS[ci]
            const h     = HEIGHTS[i % HEIGHTS.length]
            const isOpen = openTitle === book.title
            return (
              <div key={book.title} style={{ position: 'relative' }}>
                <div
                  className="book done"
                  style={{ background: color, color: text, height: h, width: 36, cursor: 'pointer',
                    outline: isOpen ? '2px solid #B8A050' : 'none', outlineOffset: '2px', transition: 'outline 0.15s ease' }}
                  onClick={() => setOpenTitle(isOpen ? null : book.title)}
                  title={`${book.title} — click for details`}
                  role="button" aria-expanded={isOpen}
                >
                  <span className="book-title">{book.title}</span>
                  <span className="book-done">✓</span>
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

        {openBook && (
          <div style={{ borderTop: '1px solid var(--rule)', borderRight: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)', borderLeft: `3px solid ${COLORS[colorIdx(openBook.primaryStudentId)]}`,
            background: 'var(--cream)', padding: '1rem 1.25rem', marginTop: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '0.25rem' }}>
              {openBook.title}
            </div>
            {openBook.author && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>
                {openBook.author}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {openBook.readers.map((r) => (
                <div key={r.studentId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-mid)', minWidth: 90 }}>
                    {r.name}
                  </span>
                  {r.rating != null && (
                    <span style={{ color: '#B8A050', fontSize: '0.8rem', letterSpacing: 1 }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  )}
                </div>
              ))}
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
