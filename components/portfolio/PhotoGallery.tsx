'use client'

import { useRouter } from 'next/navigation'
import type { Photo } from '@/lib/types'
import UploadButton from '@/components/shared/UploadButton'

interface Props {
  photos?:        Photo[]
  uploadEnabled?: boolean
  studentId?:     string
  academicYear?:  string
  gradeLevel?:    string
}

const DEMO_PHOTOS = [
  { id: '1', caption: 'Science fair project — life cycle diagram', gradeLevel: 'Grade 3', academicYear: '2025–26' },
  { id: '2', caption: 'Purim play — Queen Esther costume',         gradeLevel: 'Grade 3', academicYear: '2025–26' },
  { id: '3', caption: 'Classroom Shabbat celebration',             gradeLevel: 'Grade 3', academicYear: '2025–26' },
  { id: '4', caption: 'Art exhibition — watercolor landscape',     gradeLevel: 'Grade 3', academicYear: '2025–26' },
  { id: '5', caption: 'Field trip — natural history museum',       gradeLevel: 'Grade 3', academicYear: '2025–26' },
  { id: '6', caption: 'Poetry recitation — school assembly',       gradeLevel: 'Grade 3', academicYear: '2025–26' },
]

export default function PhotoGallery({ photos, uploadEnabled, studentId, academicYear = '', gradeLevel = '' }: Props) {
  const router  = useRouter()
  const hasData = !!photos && photos.length > 0
  const items   = hasData
    ? photos!.map((p) => ({ id: p.id, caption: p.caption ?? '', gradeLevel: p.gradeLevel, academicYear: p.academicYear }))
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
          : 'Six photographs from the 2025–26 academic year — celebrations, projects, and school events.'}
      </p>

      {uploadEnabled && studentId && (
        <div className="reveal" style={{ marginBottom: '1.5rem' }}>
          <UploadButton
            studentId={studentId}
            uploadType="photo"
            academicYear={academicYear}
            gradeLevel={gradeLevel}
            accept="image/*"
            label="Upload Photo"
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {items.map((p) => (
          <figure key={p.id} style={{ margin: 0, border: '1px solid var(--rule)', background: 'var(--parchment)' }}>
            {/* Image placeholder */}
            <div style={{
              height: 160,
              background: 'var(--cream-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid var(--rule)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', color: 'var(--ink-faint)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Photo
              </span>
            </div>
            {/* Caption */}
            {p.caption && (
              <figcaption style={{ padding: '.6rem .75rem' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '.8rem', color: 'var(--ink-mid)', margin: '0 0 .25rem', lineHeight: 1.4 }}>
                  {p.caption}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                  {p.gradeLevel} · {p.academicYear}
                </span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}
