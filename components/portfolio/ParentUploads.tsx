'use client'

import type { ParentUpload } from '@/lib/types'
import ParentUploadForm from './ParentUploadForm'

interface Props {
  uploads?:       ParentUpload[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

// ── Helpers ───────────────────────────────────────────────────

/** Returns true if the storage path has an image file extension. */
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
  art_craft:    'Art / Craft',
  home_project: 'Home Project',
  recording:    'Recording',
  certificate:  'Certificate',
  photo:        'Photo',
  other:        'Other',
  // legacy upload_type values
  art:          'Art',
  story:        'Story',
  poem:         'Poem',
}

const CATEGORY_ICONS: Record<string, string> = {
  art_craft:    '🎨',
  home_project: '🏡',
  recording:    '🎙',
  certificate:  '🏅',
  photo:        '📷',
  other:        '📎',
  art:          '🖼',
  story:        '📖',
  poem:         '✍',
}

// ── Demo data ─────────────────────────────────────────────────

const DEMO_UPLOADS = [
  {
    id: '1', category: 'art_craft', title: 'Mosaic — Jerusalem skyline',
    date: 'Jan 2026', gradeLevel: 'Grade 3',
    description: 'Mixed-media mosaic created for the Hanukkah art show.',
    publicUrl: null, storagePath: null,
  },
  {
    id: '2', category: 'home_project', title: 'The Lost Compass',
    date: 'Oct 2025', gradeLevel: 'Grade 3',
    description: 'Original short story written over a weekend.',
    publicUrl: null, storagePath: null,
  },
  {
    id: '3', category: 'recording', title: 'Shabbat candle blessing — home',
    date: 'Nov 2025', gradeLevel: 'Grade 3',
    description: null, publicUrl: null, storagePath: null,
  },
]

// ── Component ─────────────────────────────────────────────────

export default function ParentUploads({
  uploads, uploadEnabled, studentId, academicYear = '', gradeLevel = '',
}: Props) {
  const hasData = !!uploads && uploads.length > 0
  const isDemo  = !studentId

  const rawItems = hasData
    ? uploads!.map((u) => ({
        id:          u.id,
        category:    u.category ?? u.uploadType,
        title:       u.title,
        date:        fmtDate(u.date),
        gradeLevel:  u.gradeLevel,
        description: u.description,
        publicUrl:   u.publicUrl,
        storagePath: u.storagePath,
      }))
    : DEMO_UPLOADS

  return (
    <section id="parent-uploads">
      <div className="section-header reveal">
        <span className="section-num">11</span>
        <h2 className="section-title">Parent Uploads</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${rawItems.length} artifact${rawItems.length !== 1 ? 's' : ''} submitted by parents — home projects, recordings, and creative work.`
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
        <div className="reveal">
          <ParentUploadForm studentId={studentId} academicYear={academicYear} gradeLevel={gradeLevel} />
        </div>
      )}

      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {rawItems.map((u) => {
          const cat     = u.category ?? 'other'
          const icon    = CATEGORY_ICONS[cat] ?? CATEGORY_ICONS.other
          const label   = CATEGORY_LABELS[cat] ?? cat
          const showImg = isImagePath(u.storagePath) && !!u.publicUrl
          return (
            <div key={u.id} style={{ background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
              {/* Inline image preview for image uploads */}
              {showImg && (
                <img
                  src={u.publicUrl!}
                  alt={u.title}
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--rule)' }}
                />
              )}
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.4rem', lineHeight: 1, paddingTop: '.1rem', flexShrink: 0 }} aria-hidden>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--navy)', margin: 0 }}>
                      {u.title}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                      {u.gradeLevel}{u.date ? ` · ${u.date}` : ''}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: u.description ? '.35rem' : 0 }}>
                    {label}
                  </span>
                  {u.description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-mid)', margin: '0 0 .5rem', lineHeight: 1.5 }}>
                      {u.description}
                    </p>
                  )}
                  {u.publicUrl && !showImg && (
                    <a href={u.publicUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'underline' }}>
                      View / Download ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
