'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/types'
import PhotoUploadModal from './PhotoUploadModal'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'
import PhotoCard from './PhotoCard'

interface Props {
  photos?:        Photo[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

const DEMO_PHOTOS: LightboxPhoto[] = [
  { id: '1', caption: 'Science fair — life cycle diagram',   term: 'Spring 2026', category: 'project',     publicUrl: '' },
  { id: '2', caption: 'Purim play — Queen Esther costume',   term: 'Spring 2026', category: 'performance', publicUrl: '' },
  { id: '3', caption: 'Classroom Shabbat celebration',       term: 'Fall 2025',   category: 'celebration', publicUrl: '' },
  { id: '4', caption: 'Art exhibition — watercolor',         term: 'Winter 2026', category: 'project',     publicUrl: '' },
  { id: '5', caption: 'Field trip — natural history museum', term: 'Fall 2025',   category: 'field_trip',  publicUrl: '' },
  { id: '6', caption: 'Poetry recitation — school assembly', term: 'Winter 2026', category: 'performance', publicUrl: '' },
]

export default function PhotoGallery({
  photos, uploadEnabled, studentId, academicYear = '', gradeLevel = '',
}: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const hasData = !!photos && photos.length > 0
  const isDemo  = !studentId
  // uploadEnabled is true only for admin/teacher on real student pages
  const canEdit = !!uploadEnabled && !!studentId

  const items: LightboxPhoto[] = hasData
    ? photos!.map((p) => ({
        id:        p.id,
        publicUrl: p.publicUrl ?? '',
        caption:   p.caption,
        term:      p.term,
        category:  p.category,
      }))
    : DEMO_PHOTOS

  return (
    <section id="photos">
      <div className="section-header reveal">
        <span className="section-num">09</span>
        <h2 className="section-title">Photo Gallery</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${items.length} photo${items.length !== 1 ? 's' : ''} — moments from the academic year.`
          : isDemo
            ? 'Photographs from the academic year — celebrations, projects, and school events.'
            : null}
      </p>

      {!hasData && !isDemo && (
        <p className="reveal" style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink-faint)', fontStyle: 'italic', margin: '0 0 1.5rem' }}>
          No photos yet.
        </p>
      )}

      {uploadEnabled && studentId && (
        <div className="reveal">
          <PhotoUploadModal studentId={studentId} academicYear={academicYear} gradeLevel={gradeLevel} />
        </div>
      )}

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {items.map((p, idx) => (
          <PhotoCard
            key={p.id}
            photo={p}
            studentId={studentId ?? ''}
            canEdit={canEdit && !isDemo}
            onExpand={() => setLightboxIdx(idx)}
          />
        ))}
      </div>

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={items}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </section>
  )
}
