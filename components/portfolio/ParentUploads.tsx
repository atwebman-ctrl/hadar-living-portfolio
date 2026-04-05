'use client'

import { useRouter } from 'next/navigation'
import type { ParentUpload } from '@/lib/types'
import UploadButton from '@/components/shared/UploadButton'

interface Props {
  uploads?:       ParentUpload[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

const TYPE_ICONS: Record<string, string> = {
  art:       '🖼',
  story:     '📖',
  poem:      '✍',
  recording: '🎙',
  other:     '📎',
}

const DEMO_UPLOADS = [
  { id: '1', uploadType: 'art',       title: 'Mosaic — Jerusalem skyline',         date: 'Jan 2026', gradeLevel: 'Grade 3', description: 'Mixed-media mosaic created for the Hanukkah art show.' },
  { id: '2', uploadType: 'story',     title: 'The Lost Compass',                   date: 'Oct 2025', gradeLevel: 'Grade 3', description: 'Original short story written over a weekend.' },
  { id: '3', uploadType: 'recording', title: 'Shabbat candle blessing — home',     date: 'Nov 2025', gradeLevel: 'Grade 3', description: null },
]

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function ParentUploads({ uploads, uploadEnabled, studentId, academicYear = '', gradeLevel = '' }: Props) {
  const router  = useRouter()
  const hasData = !!uploads && uploads.length > 0
  const items   = hasData
    ? uploads!.map((u) => ({
        id: u.id,
        uploadType: u.uploadType,
        title: u.title,
        date: fmtDate(u.date),
        gradeLevel: u.gradeLevel,
        description: u.description,
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
          ? `${items.length} artifact${items.length !== 1 ? 's' : ''} submitted by parents — home projects, recordings, and creative work.`
          : 'Three artifacts submitted by parents — work created at home that complements the classroom portfolio.'}
      </p>

      {uploadEnabled && studentId && (
        <div className="reveal" style={{ marginBottom: '1.5rem' }}>
          <UploadButton
            studentId={studentId}
            uploadType="parent_upload"
            academicYear={academicYear}
            gradeLevel={gradeLevel}
            accept="image/*,audio/*,video/*,.pdf"
            label="Upload from Home"
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {items.map((u) => {
          const icon = TYPE_ICONS[u.uploadType] ?? TYPE_ICONS.other
          return (
            <div key={u.id} style={{ display: 'flex', gap: '1rem', background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '1rem 1.25rem', alignItems: 'flex-start' }}>
              {/* Type icon */}
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
                  {u.uploadType}
                </span>
                {u.description && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
                    {u.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
