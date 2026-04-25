'use client'

import { useState } from 'react'
import type { HandwritingSample, UserRole } from '@/lib/types'
import DirectUploadButton from '@/components/shared/DirectUploadButton'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'
import { TERM_OPTIONS } from '@/lib/constants'
import s from './sections.module.css'

interface Props {
  samples:       HandwritingSample[]
  studentId:     string
  role:          UserRole
  academicYear?: string
  gradeLevel?:   string
}

export default function CompositionHandwriting({ samples, studentId, role, academicYear = '', gradeLevel = '' }: Props) {
  const canUpload = role === 'admin' || role === 'teacher'
  const [selectedTerm, setSelectedTerm] = useState('')
  const [lightboxIdx,  setLightboxIdx]  = useState<number | null>(null)

  const lightboxItems: LightboxPhoto[] = samples.map((h) => ({
    id:        h.id,
    publicUrl: h.publicUrl ?? '',
    caption:   h.teacherNotes ?? null,
    term:      h.term ?? null,
    category:  null,
  }))

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderTop: '1px solid var(--rule)', paddingTop: '1.25rem', marginBottom: '1rem',
      }}>
        <span className={s.sectionNum} style={{ fontSize: '0.65rem' }}>—</span>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--navy)', margin: 0 }}>
          Handwriting
        </h3>
      </div>

      {/* TODO: PDF upload for compositions — extract front page as handwriting preview */}

      {canUpload && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', padding: '0.45rem 0.6rem', cursor: 'pointer' }}
            aria-label="Select term"
          >
            <option value="">Select term…</option>
            {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {selectedTerm ? (
            <DirectUploadButton
              studentId={studentId}
              uploadType="handwriting"
              academicYear={academicYear}
              gradeLevel={gradeLevel}
              accept="image/*"
              label="Upload Handwriting Sample"
              metadata={{ term: selectedTerm }}
              onSuccess={() => setSelectedTerm('')}
            />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
              ← select a term to upload
            </span>
          )}
        </div>
      )}

      {samples.length === 0 ? (
        <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
          No handwriting samples yet.
        </p>
      ) : (
        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {samples.map((h, idx) => (
            <SampleCard
              key={h.id}
              label={`${h.term} · ${h.academicYear}`}
              notes={h.teacherNotes}
              imageUrl={h.publicUrl}
              onExpand={h.publicUrl ? () => setLightboxIdx(idx) : undefined}
            />
          ))}
        </div>
      )}

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={lightboxItems}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  )
}

function SampleCard({ label, notes, imageUrl, onExpand }: {
  label:     string
  notes:     string | null
  imageUrl:  string | null
  onExpand?: () => void
}) {
  return (
    <div style={{ border: '1px solid var(--rule)', background: 'var(--parchment)' }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Handwriting sample — ${label}`}
          onClick={onExpand}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--rule)', cursor: onExpand ? 'zoom-in' : 'default' }}
        />
      ) : (
        <div style={{ height: 180, background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--rule)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'var(--ink-faint)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Placeholder
          </span>
        </div>
      )}
      <div style={{ padding: '.75rem 1rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 .35rem' }}>
          {label}
        </p>
        {notes && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
            {notes}
          </p>
        )}
      </div>
    </div>
  )
}
