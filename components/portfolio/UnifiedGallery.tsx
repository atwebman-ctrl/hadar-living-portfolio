'use client'

import { useState, useMemo } from 'react'
import type { Photo, ParentUpload, UserRole } from '@/lib/types'
import PhotoCard from './PhotoCard'
import ParentUploadCard, { type UploadCardItem } from './ParentUploadCard'
import ParentUploadForm from './ParentUploadForm'
import UploadButton from '@/components/shared/UploadButton'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'
import { TERM_OPTIONS } from '@/lib/constants'
import groupStyles from './GroupDetail.module.css'
import s from './sections.module.css'

interface Props {
  photos?:        Photo[]
  parentUploads?: ParentUpload[]
  studentId?:     string
  role?:          UserRole
  academicYear?:  string
  gradeLevel?:    string
}

type SourceFilter = 'all' | 'school' | 'parent'

type GalleryItem =
  | { source: 'school'; id: string; sortDate: string; photo: LightboxPhoto }
  | { source: 'parent'; id: string; sortDate: string; upload: UploadCardItem }

// ── Helpers ───────────────────────────────────────────────────

function isImagePath(path: string | null): boolean {
  if (!path) return false
  const ext = path.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const PARENT_CATEGORY_LABELS: Record<string, string> = {
  art_craft: 'Art / Craft', home_project: 'Home Project', recording: 'Recording',
  certificate: 'Certificate', photo: 'Photo', other: 'Other',
  art: 'Art', story: 'Story', poem: 'Poem',
}
const PARENT_CATEGORY_ICONS: Record<string, string> = {
  art_craft: '🎨', home_project: '🏡', recording: '🎙',
  certificate: '🏅', photo: '📷', other: '📎',
  art: '🖼', story: '📖', poem: '✍',
}

const PHOTO_CATEGORIES = [
  { value: 'classroom',   label: 'Classroom'   },
  { value: 'field_trip',  label: 'Field Trip'  },
  { value: 'project',     label: 'Project'     },
  { value: 'performance', label: 'Performance' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'portrait',    label: 'Portrait'    },
  { value: 'other',       label: 'Other'       },
]

const FILTERS: { slug: SourceFilter; label: string }[] = [
  { slug: 'all',    label: 'All'    },
  { slug: 'school', label: 'School' },
  { slug: 'parent', label: 'Parent' },
]

// ── Styles ────────────────────────────────────────────────────

const sel: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', cursor: 'pointer' }
const inp: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', width: 200 }
const mono55: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }
const badge: React.CSSProperties = {
  position: 'absolute', top: '0.5rem', left: '0.5rem',
  fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-light)',
  background: 'var(--cream)', padding: '2px 8px',
  border: '1px solid var(--rule)', pointerEvents: 'none', zIndex: 1,
}

// ── Component ─────────────────────────────────────────────────

export default function UnifiedGallery({
  photos, parentUploads, studentId, role, academicYear = '', gradeLevel = '',
}: Props) {
  const [filter,      setFilter]      = useState<SourceFilter>('all')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [selectedTerm,     setSelectedTerm]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('classroom')
  const [caption,          setCaption]          = useState('')

  const canEditSchool = (role === 'admin' || role === 'teacher') && !!studentId
  const isParent      = role === 'parent'

  const items = useMemo<GalleryItem[]>(() => {
    const schoolItems: GalleryItem[] = (photos ?? []).map((p) => ({
      source:   'school',
      id:       p.id,
      sortDate: p.dateTaken ?? p.createdAt,
      photo: {
        id:        p.id,
        publicUrl: p.publicUrl ?? '',
        caption:   p.caption,
        term:      p.term,
        category:  p.category,
      },
    }))
    const parentItems: GalleryItem[] = (parentUploads ?? []).map((u) => {
      const cat = u.category ?? u.uploadType
      return {
        source:   'parent',
        id:       u.id,
        sortDate: u.date ?? u.createdAt,
        upload: {
          id:          u.id,
          title:       u.title,
          category:    cat,
          label:       PARENT_CATEGORY_LABELS[cat] ?? cat,
          icon:        PARENT_CATEGORY_ICONS[cat] ?? PARENT_CATEGORY_ICONS.other,
          date:        fmtDate(u.date),
          gradeLevel:  u.gradeLevel,
          description: u.description,
          publicUrl:   u.publicUrl,
          storagePath: u.storagePath,
          showImg:     isImagePath(u.storagePath) && !!u.publicUrl,
        },
      }
    })
    return [...schoolItems, ...parentItems].sort((a, b) =>
      (b.sortDate ?? '').localeCompare(a.sortDate ?? ''),
    )
  }, [photos, parentUploads])

  const visible = filter === 'all' ? items : items.filter((i) => i.source === filter)

  // Only image-eligible items enter the lightbox; non-images (recordings, PDFs) skip.
  const lightboxItems: LightboxPhoto[] = visible.flatMap((i) => {
    if (i.source === 'school') return i.photo.publicUrl ? [i.photo] : []
    return i.upload.showImg && i.upload.publicUrl
      ? [{ id: i.upload.id, publicUrl: i.upload.publicUrl, caption: i.upload.title, term: i.upload.date, category: i.upload.category }]
      : []
  })
  const lightboxIdxMap = new Map(lightboxItems.map((li, idx) => [li.id, idx]))

  const showBadges = filter === 'all'

  return (
    <section id="gallery">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>09</span>
        <h2 className={s.sectionTitle}>Gallery</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.25rem', maxWidth: 560 }}>
        Classroom photos and artifacts from home — {items.length} item{items.length !== 1 ? 's' : ''}.
      </p>

      <div className={groupStyles.groupTabBar} style={{ marginBottom: '1.5rem', padding: 0 }}>
        {FILTERS.map((f) => (
          <button
            key={f.slug}
            className={`${groupStyles.groupTab}${filter === f.slug ? ` ${groupStyles.groupTabActive}` : ''}`}
            onClick={() => setFilter(f.slug)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="reveal" style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink-faint)', fontStyle: 'italic', margin: '0 0 1.5rem' }}>
          No items yet.
        </p>
      )}

      {visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {visible.map((item) => {
            const tag = showBadges ? (
              <span style={badge}>{item.source === 'school' ? 'School' : 'Parent'}</span>
            ) : null
            if (item.source === 'school') {
              const lbIdx = lightboxIdxMap.get(item.photo.id)
              return (
                <div key={`s-${item.id}`} style={{ position: 'relative' }}>
                  <PhotoCard
                    photo={item.photo}
                    studentId={studentId ?? ''}
                    canEdit={canEditSchool}
                    onExpand={lbIdx !== undefined ? () => setLightboxIdx(lbIdx) : () => {}}
                  />
                  {tag}
                </div>
              )
            }
            const lbIdx = lightboxIdxMap.get(item.upload.id)
            return (
              <div key={`p-${item.id}`} style={{ position: 'relative' }}>
                <ParentUploadCard
                  item={item.upload}
                  studentId={studentId ?? ''}
                  canEdit={canEditSchool}
                  onExpand={lbIdx !== undefined ? () => setLightboxIdx(lbIdx) : undefined}
                />
                {tag}
              </div>
            )
          })}
        </div>
      )}

      {studentId && (canEditSchool || isParent) && (
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule)' }}>
          {canEditSchool && (
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px dashed var(--rule)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '0 0 0.6rem' }}>Upload classroom photo</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={mono55}>Caption</span>
                  <input style={inp} type="text" value={caption} placeholder="Optional caption…" onChange={(e) => setCaption(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={mono55}>Term</span>
                  <select style={sel} value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                    <option value="">Select term…</option>
                    {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={mono55}>Category</span>
                  <select style={sel} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {PHOTO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
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
          <ParentUploadForm studentId={studentId} academicYear={academicYear} gradeLevel={gradeLevel} />
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
    </section>
  )
}
