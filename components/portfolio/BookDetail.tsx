'use client'

// ============================================================
// components/portfolio/BookDetail.tsx
//
// Accordion detail panel for a book entry in TheCanon.
// Shows cover thumbnail + all reading fields.
// Edit/Delete buttons visible on hover (admin/teacher only).
// ============================================================

import { useState } from 'react'
import type { Reading, UserRole } from '@/lib/types'
import s from './sections.module.css'

// ── Book cover image ──────────────────────────────────────────

export function BookCoverImage({ title }: { title: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div style={{ width: 60, height: 80, flexShrink: 0, background: 'var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        📖
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`} alt="" width={60} height={80}
      onError={() => setFailed(true)}
      style={{ width: 60, height: 80, objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  )
}

// ── Detail field ──────────────────────────────────────────────

function DetailField({ label, value, wide, valueStyle }: { label: string; value: string; wide?: boolean; valueStyle?: React.CSSProperties }) {
  return (
    <div style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--ink-dark)', lineHeight: 1.45, ...valueStyle }}>{value}</div>
    </div>
  )
}

// ── Action button ─────────────────────────────────────────────

function ActionBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${danger ? '#b91c1c' : 'var(--rule)'}`, color: danger ? '#b91c1c' : 'var(--ink-mid)', padding: '2px 8px', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  reading:    Reading
  spineColor: string
  canEdit:    boolean
  onEdit:     () => void
  onDelete:   (id: string) => Promise<void>
}

export default function BookDetail({ reading, spineColor, canEdit, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete(reading.id)
    setDeleting(false)
    setConfirmDelete(false)
  }

  return (
    <div
      className={s.bookDetailPanel}
      style={{ borderTop: '1px solid var(--rule)', borderRight: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', borderLeft: `3px solid ${spineColor}`, background: 'var(--cream)', padding: '1.1rem 1.4rem', marginTop: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', position: 'relative' }}
    >
      <BookCoverImage title={reading.title} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem 1.5rem', flex: 1 }}>
        {reading.author && <DetailField label="Author" value={reading.author} />}
        <DetailField label="Academic Year" value={reading.academicYear} />
        <DetailField label="Status" value={reading.completed ? 'Completed' : 'In Progress'} valueStyle={{ color: reading.completed ? '#2E4A3B' : '#8B4A2D' }} />
        {reading.readingDifficulty && <DetailField label="Difficulty" value={reading.readingDifficulty.replace(/_/g, ' ')} />}
        {reading.curriculumConnection && <DetailField label="Connection" value={reading.curriculumConnection.replace(/_/g, ' ')} />}
        {reading.dateStarted  && <DetailField label="Started"  value={reading.dateStarted}  />}
        {reading.dateFinished && <DetailField label="Finished" value={reading.dateFinished} />}
        {reading.studentRating != null && <DetailField label="Rating" value={'★'.repeat(reading.studentRating) + '☆'.repeat(5 - reading.studentRating)} />}
        {reading.pageCount != null && <DetailField label="Pages" value={String(reading.pageCount)} />}
        {reading.whyChosen    && <DetailField label="Why Chosen"      value={reading.whyChosen}            wide />}
        {reading.keyQuote     && <DetailField label="Key Quote"       value={`"${reading.keyQuote}"`}      wide />}
        {reading.teacherNotes && <DetailField label="Teacher Notes"   value={reading.teacherNotes}         wide />}
        {reading.valuesSkills && <DetailField label="Values & Skills" value={reading.valuesSkills}         wide />}
      </div>

      {/* Edit / Delete — hover-revealed via CSS class */}
      {canEdit && (
        <div className={s.bookDetailActions}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--ink-mid)' }}>Delete?</span>
              <ActionBtn danger onClick={handleConfirmDelete}>{deleting ? '…' : 'Yes'}</ActionBtn>
              <ActionBtn onClick={() => setConfirmDelete(false)}>No</ActionBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <ActionBtn onClick={onEdit}>Edit</ActionBtn>
              <ActionBtn danger onClick={() => setConfirmDelete(true)}>Delete</ActionBtn>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
