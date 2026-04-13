'use client'

import { useState } from 'react'
import type { ParentUpload, UserRole } from '@/lib/types'
import ParentUploadForm from './ParentUploadForm'
import ParentUploadCard, { type UploadCardItem } from './ParentUploadCard'
import s from './sections.module.css'
import PhotoLightbox, { type LightboxPhoto } from './PhotoLightbox'

interface Props {
  uploads?:       ParentUpload[]
  uploadEnabled?: boolean
  studentId?:     string
  role?:          UserRole
  academicYear?:  string
  gradeLevel?:    string
}

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

// ── Category display ──────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  art_craft: 'Art / Craft', home_project: 'Home Project', recording: 'Recording',
  certificate: 'Certificate', photo: 'Photo', other: 'Other',
  art: 'Art', story: 'Story', poem: 'Poem',
}
const CATEGORY_ICONS: Record<string, string> = {
  art_craft: '🎨', home_project: '🏡', recording: '🎙',
  certificate: '🏅', photo: '📷', other: '📎',
  art: '🖼', story: '📖', poem: '✍',
}

// ── Demo data ─────────────────────────────────────────────────

const DEMO_UPLOADS: UploadCardItem[] = [
  { id: '1', category: 'art_craft',    title: 'Mosaic — Jerusalem skyline',      label: 'Art / Craft',   icon: '🎨', date: 'Jan 2026', gradeLevel: 'Grade 3', description: 'Mixed-media mosaic created for the Hanukkah art show.', publicUrl: null, storagePath: null, showImg: false },
  { id: '2', category: 'home_project', title: 'The Lost Compass',                label: 'Home Project',  icon: '🏡', date: 'Oct 2025', gradeLevel: 'Grade 3', description: 'Original short story written over a weekend.',           publicUrl: null, storagePath: null, showImg: false },
  { id: '3', category: 'recording',    title: 'Shabbat candle blessing — home',  label: 'Recording',     icon: '🎙', date: 'Nov 2025', gradeLevel: 'Grade 3', description: null,                                                    publicUrl: null, storagePath: null, showImg: false },
]

// ── Component ─────────────────────────────────────────────────

export default function ParentUploads({
  uploads, uploadEnabled, studentId, role, academicYear = '', gradeLevel = '',
}: Props) {
  const hasData = !!uploads && uploads.length > 0
  const isDemo  = !studentId
  const canEdit = (role === 'admin' || role === 'teacher') && !!studentId
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const items: UploadCardItem[] = hasData
    ? uploads!.map((u) => {
        const cat = u.category ?? u.uploadType
        return {
          id:          u.id,
          title:       u.title,
          category:    cat,
          label:       CATEGORY_LABELS[cat] ?? cat,
          icon:        CATEGORY_ICONS[cat] ?? CATEGORY_ICONS.other,
          date:        fmtDate(u.date),
          gradeLevel:  u.gradeLevel,
          description: u.description,
          publicUrl:   u.publicUrl,
          storagePath: u.storagePath,
          showImg:     isImagePath(u.storagePath) && !!u.publicUrl,
        }
      })
    : DEMO_UPLOADS

  // Only items with a real image participate in lightbox navigation
  const lightboxItems: LightboxPhoto[] = items
    .filter((i) => i.showImg && !!i.publicUrl)
    .map((i) => ({
      id:        i.id,
      publicUrl: i.publicUrl!,
      caption:   i.title,
      term:      i.date,
      category:  i.category,
    }))

  // Map item id → lightbox index for quick lookup
  const lightboxIdxMap = new Map(lightboxItems.map((li, idx) => [li.id, idx]))

  return (
    <section id="parent-uploads">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>11</span>
        <h2 className={s.sectionTitle}>Parent Uploads</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${items.length} artifact${items.length !== 1 ? 's' : ''} submitted by parents — home projects, recordings, and creative work.`
          : isDemo
            ? 'Three artifacts submitted by parents — work created at home that complements the classroom portfolio.'
            : null}
      </p>

      {!hasData && !isDemo && (
        <p className="reveal" style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink-faint)', fontStyle: 'italic', margin: '0 0 1.5rem' }}>
          No uploads yet.
        </p>
      )}

      {uploadEnabled && studentId && (
        <ParentUploadForm studentId={studentId} academicYear={academicYear} gradeLevel={gradeLevel} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {items.map((item) => {
          const lbIdx = lightboxIdxMap.get(item.id)
          return (
            <ParentUploadCard
              key={item.id}
              item={item}
              studentId={studentId ?? ''}
              canEdit={canEdit && !isDemo}
              onExpand={lbIdx !== undefined ? () => setLightboxIdx(lbIdx) : undefined}
            />
          )
        })}
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
