'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/types'
import PhotoUploadModal from './PhotoUploadModal'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'

interface Props {
  photos?:        Photo[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

const CATEGORY_LABELS: Record<string, string> = {
  classroom:   'Classroom',
  field_trip:  'Field Trip',
  project:     'Project',
  performance: 'Performance',
  celebration: 'Celebration',
  portrait:    'Portrait',
  other:       'Other',
}

const DEMO_PHOTOS = [
  { id: '1', caption: 'Science fair — life cycle diagram',   term: 'Spring 2026', category: 'project',     publicUrl: '' },
  { id: '2', caption: 'Purim play — Queen Esther costume',   term: 'Spring 2026', category: 'performance', publicUrl: '' },
  { id: '3', caption: 'Classroom Shabbat celebration',       term: 'Fall 2025',   category: 'celebration', publicUrl: '' },
  { id: '4', caption: 'Art exhibition — watercolor',         term: 'Winter 2026', category: 'project',     publicUrl: '' },
  { id: '5', caption: 'Field trip — natural history museum', term: 'Fall 2025',   category: 'field_trip',  publicUrl: '' },
  { id: '6', caption: 'Poetry recitation — school assembly', term: 'Winter 2026', category: 'performance', publicUrl: '' },
]

// ── Placeholder tile for demo/missing images ──────────────────

function PhotoPlaceholder({ caption }: { caption: string }) {
  return (
    <div style={{ aspectRatio: '4/3', background: 'var(--cream-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--rule)', gap: '0.4rem', padding: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', opacity: 0.3 }}>📷</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', maxWidth: '80%' }}>
        {caption || 'Photo'}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function PhotoGallery({
  photos, uploadEnabled, studentId, academicYear = '', gradeLevel = '',
}: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const hasData = !!photos && photos.length > 0
  const isDemo  = !studentId

  const items: LightboxPhoto[] = hasData
    ? photos!.map((p) => ({
        id:        p.id,
        publicUrl: p.publicUrl ?? '',
        caption:   p.caption,
        term:      p.term,
        category:  p.category,
      }))
    : DEMO_PHOTOS

  function handleClick(idx: number) {
    if (items[idx].publicUrl) setLightboxIdx(idx)
  }

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

      {/* Masonry-style grid */}
      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {items.map((p, idx) => {
          const catLabel = p.category ? (CATEGORY_LABELS[p.category] ?? p.category) : null
          const tag = [p.term, catLabel].filter(Boolean).join(' · ')
          const clickable = !!p.publicUrl
          return (
            <figure
              key={p.id}
              onClick={() => handleClick(idx)}
              title={clickable ? 'Click to expand' : undefined}
              style={{ margin: 0, border: '1px solid var(--rule)', background: 'var(--parchment)', cursor: clickable ? 'zoom-in' : 'default', overflow: 'hidden' }}
            >
              {p.publicUrl ? (
                <img
                  src={p.publicUrl}
                  alt={p.caption ?? 'Portfolio photo'}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <PhotoPlaceholder caption={p.caption ?? ''} />
              )}
              {(p.caption || tag) && (
                <figcaption style={{ padding: '0.6rem 0.75rem' }}>
                  {p.caption && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '.8rem', color: 'var(--ink-mid)', margin: '0 0 .2rem', lineHeight: 1.4 }}>
                      {p.caption}
                    </p>
                  )}
                  {tag && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.58rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                      {tag}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          )
        })}
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
