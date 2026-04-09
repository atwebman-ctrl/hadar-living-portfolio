'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Reading, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import InlineReadingForm from '@/components/portfolio/InlineReadingForm'
import BookDetail from '@/components/portfolio/BookDetail'
import ReadingForm from '@/components/portfolio/ReadingForm'

interface Props {
  readings?:      Reading[]
  studentId?:     string
  studentName?:   string
  role?:          UserRole
  existingDraft?: AiDraft
}

const SPINE_PALETTE = [
  { color: '#1B3A6B', text: '#E8EDF5' }, { color: '#8B4A2D', text: '#F5EDE8' },
  { color: '#2E4A3B', text: '#E8F0EC' }, { color: '#5E7FA0', text: '#EBF0F5' },
  { color: '#7B5EA0', text: '#F0EBF5' }, { color: '#4A7A5E', text: '#E8F2ED' },
  { color: '#A07B3E', text: '#F5EEE0' }, { color: '#6B2D2D', text: '#F5E8E8' },
  { color: '#4A6B8A', text: '#E8EFF5' }, { color: '#8A8074', text: '#F5F3F0' },
]
const SPINE_HEIGHTS = [160, 150, 155, 148, 158, 144, 152, 162, 156, 145]

const DEMO_BOOKS = [
  { title: 'Alice in Wonderland', done: true }, { title: "Grimm's Fairy Tales", done: true },
  { title: 'Black Beauty', done: true },        { title: 'The Snow Queen', done: true },
  { title: 'Charlie & the Choc. Factory', done: true }, { title: 'The Jungle Book', done: true },
  { title: 'Homer Price', done: true },         { title: 'Tales from Shakespeare', done: true },
  { title: 'Aladdin & Arabian Nights', done: true }, { title: 'Guns for Gen. Washington', done: false },
]

function buildDraftContext(readings: Reading[], firstName: string | null) {
  return {
    studentFirstName: firstName,
    completedCount: readings.filter((r) => r.completed).length,
    totalCount: readings.length,
    books: readings.map((r) => ({ title: r.title, author: r.author, completed: r.completed, whyChosen: r.whyChosen })),
  }
}

/** Map a Reading to the Fields shape ReadingForm expects */
function toFields(r: Reading) {
  return {
    title: r.title, author: r.author ?? '', academicYear: r.academicYear,
    completed: r.completed, readingDifficulty: r.readingDifficulty ?? '',
    dateStarted: r.dateStarted ?? '', dateFinished: r.dateFinished ?? '',
    curriculumConnection: r.curriculumConnection ?? '', studentRating: r.studentRating ?? 0,
    whyChosen: r.whyChosen ?? '', keyQuote: r.keyQuote ?? '', teacherNotes: r.teacherNotes ?? '',
  }
}

// ── Modal overlay styles ──────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const MODAL: React.CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--navy)',
  width: '100%', maxWidth: 580, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
}
const MODAL_HEADER: React.CSSProperties = {
  background: 'var(--navy)', padding: '0.6rem 1.25rem',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
}

// ── Component ─────────────────────────────────────────────────

export default function TheCanon({ readings, studentId, studentName, role, existingDraft }: Props) {
  const router = useRouter()
  const [openId,         setOpenId]         = useState<string | null>(null)
  const [editingReading, setEditingReading] = useState<Reading | null>(null)
  const [editStatus,     setEditStatus]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const hasData = !!readings && readings.length > 0
  const canEdit = hasData && !!studentId && !!role && role !== 'parent'

  const books = hasData ? readings!.map((r) => ({ title: r.title, done: r.completed })) : DEMO_BOOKS
  const completedCount = books.filter((b) => b.done).length
  const description = hasData
    ? `${completedCount} of ${books.length} title${books.length !== 1 ? 's' : ''} completed.`
    : "Athena\u2019s Grade 3 reading list. Nine of ten titles completed \u2014 from Lewis Carroll to Charles and Mary Lamb\u2019s Tales from Shakespeare."

  const draftContext = (studentId && role && role !== 'parent' && hasData)
    ? buildDraftContext(readings!, studentName ?? null) : null

  const openReading = hasData && openId ? readings!.find((r) => r.id === openId) ?? null : null
  const openIndex   = hasData && openId ? readings!.findIndex((r) => r.id === openId) : -1

  async function handleDelete(readingId: string) {
    await fetch(`/api/dashboard/students/${studentId}/readings/${readingId}`, { method: 'DELETE' })
    setOpenId(null)
    router.refresh()
  }

  return (
    <section id="canon">
      <div className="section-header reveal">
        <span className="section-num">03</span>
        <h2 className="section-title">The Canon</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {description}
      </p>

      <div className="bookshelf reveal">
        <div className="books-row">
          {books.map((b, i) => {
            const palette   = SPINE_PALETTE[i % SPINE_PALETTE.length]
            const readingId = hasData ? readings![i]?.id : null
            const isOpen    = readingId !== null && openId === readingId
            return (
              <div key={`${b.title}-${i}`} className={`book ${b.done ? 'done' : 'pending'}`}
                style={{ background: palette.color, color: palette.text, height: SPINE_HEIGHTS[i % SPINE_HEIGHTS.length], width: 36, cursor: hasData ? 'pointer' : 'default', outline: isOpen ? '2px solid #B8A050' : 'none', outlineOffset: '2px', transition: 'outline 0.15s ease' }}
                onClick={() => { if (!readingId) return; setOpenId(openId === readingId ? null : readingId) }}
                title={hasData ? `${b.title} — click for details` : undefined}
                role={hasData ? 'button' : undefined} aria-expanded={isOpen}
              >
                <span className="book-title">{b.title}</span>
                <span className="book-done">{b.done ? '\u2713' : '\u2026'}</span>
              </div>
            )
          })}
        </div>

        {openReading && openIndex >= 0 && (
          <BookDetail
            reading={openReading}
            spineColor={SPINE_PALETTE[openIndex % SPINE_PALETTE.length].color}
            canEdit={canEdit}
            onEdit={() => { setEditingReading(openReading); setEditStatus(null) }}
            onDelete={handleDelete}
          />
        )}
      </div>

      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        {hasData ? 'Click a spine to see details\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming' : 'Hover to browse\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming'}
      </div>

      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel studentId={studentId} role={role} sectionType="reading_bookshelf"
          existingDraft={existingDraft} draftContext={draftContext ?? {}} />
      )}
      {studentId && role && role !== 'parent' && <InlineReadingForm studentId={studentId} />}

      {/* ── Edit modal ─────────────────────────────────────── */}
      {editingReading && studentId && (
        <div style={OVERLAY} onClick={() => setEditingReading(null)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Edit Book
              </span>
              <button onClick={() => setEditingReading(null)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {editStatus && (
                <div style={{ padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: editStatus.type === 'success' ? '#166534' : '#991b1b', background: editStatus.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${editStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                  {editStatus.msg}
                </div>
              )}
              <ReadingForm
                studentId={studentId}
                readingId={editingReading.id}
                initial={toFields(editingReading)}
                onStatus={setEditStatus}
                onSuccess={() => { setEditingReading(null); setOpenId(null); router.refresh() }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
