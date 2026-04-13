'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Reading, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import AiDraftEditor from '@/components/shared/AiDraftEditor'
import { DEMO_READINGS, DEMO_CANON_NARRATIVE } from './TheCanonDemoData'
import InlineReadingForm from '@/components/portfolio/InlineReadingForm'
import BookDetail from '@/components/portfolio/BookDetail'
import ReadingForm from '@/components/portfolio/ReadingForm'
import ClassBookshelf from '@/components/portfolio/ClassBookshelf'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'
import s from './sections.module.css'

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

// ── Component ─────────────────────────────────────────────────

export default function TheCanon({ readings, studentId, studentName, role, existingDraft }: Props) {
  const router = useRouter()
  const [tab,            setTab]            = useState<'my-books' | 'class'>('my-books')
  const [openId,         setOpenId]         = useState<string | null>(null)
  const [editingReading, setEditingReading] = useState<Reading | null>(null)
  const [editStatus,     setEditStatus]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const isLive  = !!readings && readings.length > 0
  const isDemo  = !isLive && !studentId
  const readingsData = isLive ? readings! : (isDemo ? DEMO_READINGS : [])
  const canEdit = isLive && !!studentId && !!role && role !== 'parent'

  const books = readingsData.map((r) => ({ title: r.title, done: r.completed }))
  const completedCount = books.filter((b) => b.done).length
  const description = isDemo
    ? "Athena\u2019s Grade 3 reading list \u2014 twelve of thirteen titles completed, from Lewis Carroll to C. S. Lewis, with the d\u2019Aulaires\u2019 Greek Myths as the year\u2019s anchor reference text."
    : `${completedCount} of ${books.length} title${books.length !== 1 ? 's' : ''} completed.`

  const draftContext = (studentId && role && role !== 'parent' && isLive)
    ? buildDraftContext(readings!, studentName ?? null) : null

  const openReading = openId ? readingsData.find((r) => r.id === openId) ?? null : null
  const openIndex   = openId ? readingsData.findIndex((r) => r.id === openId) : -1

  async function handleDelete(readingId: string) {
    await fetch(`/api/dashboard/students/${studentId}/readings/${readingId}`, { method: 'DELETE' })
    setOpenId(null)
    router.refresh()
  }

  return (
    <section id="canon">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>03</span>
        <h2 className={s.sectionTitle}>The Canon</h2>
        <div className={s.sectionRule} />
      </div>

      {/* ── Tabs (only in live mode) ──────────────────────── */}
      {studentId && (
        <div className={s.flipTabs} style={{ marginBottom: '1.5rem' }}>
          <button className={`${s.flipTab}${tab === 'my-books' ? ` ${s.flipTabActive}` : ''}`} onClick={() => setTab('my-books')}>
            My Books
          </button>
          <button className={`${s.flipTab}${tab === 'class' ? ` ${s.flipTabActive}` : ''}`} onClick={() => setTab('class')}>
            Class Bookshelf
          </button>
        </div>
      )}

      {/* ── My Books tab ─────────────────────────────────── */}
      {tab === 'my-books' && (
        <>
          <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
            {description}
          </p>
          <div className={`${s.bookshelf} reveal`}>
            <div className={s.booksRow}>
              {books.map((b, i) => {
                const palette   = SPINE_PALETTE[i % SPINE_PALETTE.length]
                const readingId = readingsData[i]?.id ?? null
                const isOpen    = readingId !== null && openId === readingId
                const clickable = readingId !== null
                return (
                  <div key={`${b.title}-${i}`} className={`${s.book} ${b.done ? s.bookComplete : s.bookPending}`}
                    style={{ background: palette.color, color: palette.text, height: SPINE_HEIGHTS[i % SPINE_HEIGHTS.length], width: 36, cursor: clickable ? 'pointer' : 'default', outline: isOpen ? '2px solid #B8A050' : 'none', outlineOffset: '2px', transition: 'outline 0.15s ease' }}
                    onClick={() => { if (!readingId) return; setOpenId(openId === readingId ? null : readingId) }}
                    title={clickable ? `${b.title} — click for details` : undefined}
                    role={clickable ? 'button' : undefined} aria-expanded={isOpen}
                  >
                    <span className={s.bookTitle}>{b.title}</span>
                    <span className={s.bookDoneLabel}>{b.done ? '\u2713' : '\u2026'}</span>
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
            {readingsData.length > 0 ? 'Click a spine to see details\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming' : 'Hover to browse\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming'}
          </div>
          {studentId && role && (draftContext || role === 'parent') && (
            <AiNarrativePanel studentId={studentId} role={role} sectionType="reading_bookshelf"
              existingDraft={existingDraft} draftContext={draftContext ?? {}} />
          )}
          {isDemo && (
            <AiDraftEditor
              draftId="demo-canon"
              sectionType="reading_bookshelf"
              initialStatus="accepted"
              initialText={DEMO_CANON_NARRATIVE}
              initialFinalText={DEMO_CANON_NARRATIVE}
            />
          )}
          {studentId && role && role !== 'parent' && <InlineReadingForm studentId={studentId} />}
        </>
      )}

      {/* ── Class Bookshelf tab ───────────────────────────── */}
      {tab === 'class' && studentId && (
        <ClassBookshelf studentId={studentId} />
      )}

      {/* ── Edit modal ─────────────────────────────────────── */}
      {editingReading && studentId && (
        <div style={MODAL_OVERLAY} onClick={() => setEditingReading(null)}>
          <div style={modalPanel(580)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Edit Book
              </span>
              <button onClick={() => setEditingReading(null)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
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
