'use client'

// ============================================================
// components/portfolio/PhotoLightbox.tsx
//
// Full-screen lightbox for Photo Gallery.
// Keyboard: ArrowLeft / ArrowRight to navigate, Escape to close.
// ============================================================

import { useEffect } from 'react'

export interface LightboxPhoto {
  id:       string
  publicUrl: string
  caption:  string | null
  term:     string | null
  category: string | null
}

interface Props {
  photos:  LightboxPhoto[]
  index:   number
  onClose: () => void
  onNav:   (next: number) => void
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

export default function PhotoLightbox({ photos, index, onClose, onNav }: Props) {
  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft'  && hasPrev) onNav(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onNav(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, hasPrev, hasNext, onClose, onNav])

  if (!photo) return null

  const tag = [
    photo.term,
    photo.category ? (CATEGORY_LABELS[photo.category] ?? photo.category) : null,
  ].filter(Boolean).join(' · ')

  const navBtn = (dir: 'left' | 'right', enabled: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={!enabled}
      aria-label={dir === 'left' ? 'Previous photo' : 'Next photo'}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [dir === 'left' ? 'left' : 'right']: '1rem',
        background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff', fontSize: '1.2rem', width: 40, height: 40,
        cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  )

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 600,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none',
          border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
      >
        ✕
      </button>

      {/* Image */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={photo.publicUrl}
          alt={photo.caption ?? 'Portfolio photo'}
          style={{ maxHeight: '78vh', maxWidth: '88vw', objectFit: 'contain', display: 'block' }}
        />

        {/* Caption + tag */}
        {(photo.caption || tag) && (
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            {photo.caption && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#e8e4da', margin: '0 0 0.3rem', lineHeight: 1.5 }}>
                {photo.caption}
              </p>
            )}
            {tag && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                {tag}
              </span>
            )}
          </div>
        )}

        {/* Counter */}
        <span style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
          {index + 1} / {photos.length}
        </span>
      </div>

      {/* Nav arrows */}
      {navBtn('left',  hasPrev, () => onNav(index - 1))}
      {navBtn('right', hasNext, () => onNav(index + 1))}
    </div>
  )
}
