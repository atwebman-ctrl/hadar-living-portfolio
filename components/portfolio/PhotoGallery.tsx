'use client'

// DEPRECATED: Replaced by UnifiedGallery in Sprint 5. Safe to delete after confirming no remaining references.

import { useState } from 'react'
import type { Photo } from '@/lib/types'
import UploadButton from '@/components/shared/UploadButton'
import s from './sections.module.css'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'
import PhotoCard from './PhotoCard'
import { TERM_OPTIONS } from '@/lib/constants'

const CATEGORIES = [
  { value: 'classroom',   label: 'Classroom'   },
  { value: 'field_trip',  label: 'Field Trip'  },
  { value: 'project',     label: 'Project'     },
  { value: 'performance', label: 'Performance' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'portrait',    label: 'Portrait'    },
  { value: 'other',       label: 'Other'       },
]

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

const sel: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', cursor: 'pointer' }
const inp: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', width: 200 }

export default function PhotoGallery({
  photos, uploadEnabled, studentId, academicYear = '', gradeLevel = '',
}: Props) {
  const [lightboxIdx,      setLightboxIdx]      = useState<number | null>(null)
  const [selectedTerm,     setSelectedTerm]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('classroom')
  const [caption,          setCaption]          = useState('')

  const hasData = !!photos && photos.length > 0
  const isDemo  = !studentId
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
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>09</span>
        <h2 className={s.sectionTitle}>Photo Gallery</h2>
        <div className={s.sectionRule} />
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
        <div className="reveal" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '0 0 0.6rem' }}>Fill in details, then upload:</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }}>Caption</span>
            <input style={inp} type="text" value={caption} placeholder="Optional caption…" onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }}>Term</span>
            <select style={sel} value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
              <option value="">Select term…</option>
              {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }}>Category</span>
            <select style={sel} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {selectedTerm ? (
            <UploadButton
              studentId={studentId}
              uploadType="photo"
              academicYear={academicYear}
              gradeLevel={gradeLevel}
              accept="image/*"
              label="+ Upload Photo"
              metadata={{ term: selectedTerm, category: selectedCategory, caption: caption || undefined }}
              onSuccess={() => { setSelectedTerm(''); setCaption('') }}
            />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>Select a term above to enable upload</span>
          )}
        </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
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
