'use client'

import { useState } from 'react'
import type { HandwritingSample } from '@/lib/types'
import UploadButton from '@/components/shared/UploadButton'
import s from './sections.module.css'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'
import { TERM_OPTIONS } from '@/lib/constants'

interface Props {
  samples?:       HandwritingSample[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

// Demo fallback — three placeholder samples
const DEMO_SAMPLES = [
  { id: '1', term: 'Fall 2025',   gradeLabel: 'Grade 3', notes: 'Cursive introduction — consistent letter height observed.', imageUrl: null },
  { id: '2', term: 'Winter 2026', gradeLabel: 'Grade 3', notes: 'Improved spacing and word separation.',                    imageUrl: null },
  { id: '3', term: 'Spring 2026', gradeLabel: 'Grade 3', notes: null,                                                       imageUrl: null },
]

export default function HandwritingSamples({ samples, uploadEnabled, studentId, academicYear = '', gradeLevel = '' }: Props) {
  const hasData = !!samples && samples.length > 0
  const [selectedTerm, setSelectedTerm] = useState('')
  const [lightboxIdx,  setLightboxIdx]  = useState<number | null>(null)

  // Build lightbox items from whichever dataset is active (real or demo)
  const lightboxItems: LightboxPhoto[] = hasData
    ? samples!.map((s) => ({
        id:        s.id,
        publicUrl: s.publicUrl ?? '',
        caption:   s.teacherNotes ?? null,
        term:      s.term ?? null,
        category:  null,
      }))
    : DEMO_SAMPLES.map((s) => ({
        id:        s.id,
        publicUrl: '',
        caption:   s.notes,
        term:      s.term,
        category:  null,
      }))

  return (
    <section id="handwriting">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>08</span>
        <h2 className={s.sectionTitle}>Handwriting Samples</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${samples!.length} handwriting sample${samples!.length !== 1 ? 's' : ''} — scanned originals with teacher observations.`
          : 'Three handwriting samples collected across the academic year, charting growth in cursive fluency and spatial consistency.'}
      </p>

      {uploadEnabled && studentId && (
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
            <UploadButton
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

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {hasData
          ? samples!.map((s, idx) => (
              <SampleCard
                key={s.id}
                label={`${s.term} · ${s.academicYear}`}
                notes={s.teacherNotes}
                imageUrl={s.publicUrl}
                onExpand={s.publicUrl ? () => setLightboxIdx(idx) : undefined}
              />
            ))
          : DEMO_SAMPLES.map((s, idx) => (
              <SampleCard
                key={s.id}
                label={`${s.term} · ${s.gradeLabel}`}
                notes={s.notes}
                imageUrl={s.imageUrl}
                onExpand={s.imageUrl ? () => setLightboxIdx(idx) : undefined}
              />
            ))}
      </div>

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={lightboxItems}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </section>
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
        <div style={{
          height: 180,
          background: 'var(--cream-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--rule)',
        }}>
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
