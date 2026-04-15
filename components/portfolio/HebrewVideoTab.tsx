'use client'

import type { StudentVideo, TeacherNote, UserRole } from '@/lib/types'
import InlineVideoForm from '@/components/portfolio/InlineVideoForm'
import InlineSectionComment from '@/components/shared/InlineSectionComment'
import s from './sections.module.css'

interface Props {
  videos:       StudentVideo[]
  canEdit:      boolean
  studentId?:   string
  teacherNotes?: TeacherNote[]
  role?:        UserRole
}

const CATEGORY_LABELS: Record<string, string> = {
  hebrew_speaking:     'Hebrew Speaking',
  poetry_recitation:   'Poetry Recitation',
  socratic_reflection: 'Socratic Reflection',
  immersion:           'Immersion',
  other:               'Other',
}

const PlayIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M1 1l12 7L1 15V1z" fill="white" />
  </svg>
)

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch { return null }
}

function EmbedVideoCard({ video }: { video: StudentVideo }) {
  const embedUrl  = video.videoUrl ? getEmbedUrl(video.videoUrl) : null
  const nativeUrl = video.videoPublicUrl ?? null
  return (
    <div className={s.videoCard}>
      <div className={s.videoHeader}>
        <span className={s.videoGrade}>{video.gradeLevel} · {video.term}</span>
        <span className={s.videoType}>{CATEGORY_LABELS[video.category] ?? video.category}</span>
      </div>
      <div className={s.videoSlot} style={{ padding: 0 }}>
        {embedUrl ? (
          <iframe src={embedUrl} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
        ) : nativeUrl ? (
          <video controls preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}>
            <source src={nativeUrl} />
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className={s.videoCaption} style={{ padding: '1rem' }}>
            <div className={s.playBtn}><PlayIcon /></div>
            Video unavailable
          </div>
        )}
      </div>
      <div className={s.videoFooter}>{video.title}</div>
    </div>
  )
}

export default function HebrewVideoTab({ videos, canEdit, studentId, teacherNotes, role }: Props) {
  const commentEl = studentId ? (
    <InlineSectionComment
      studentId={studentId}
      sectionCategory="immersion_engine"
      sectionAnchor="hebrew-video"
      canEdit={canEdit}
      notes={teacherNotes}
      role={role}
    />
  ) : null

  if (videos.length === 0) {
    return (
      <div style={{ padding: '2rem 0' }}>
        <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.25rem', maxWidth: 560 }}>
          No Hebrew videos yet. Add a YouTube or Vimeo link below to start documenting Hebrew speaking progress.
        </p>
        {commentEl}
        {canEdit && studentId && <InlineVideoForm studentId={studentId} />}
      </div>
    )
  }
  const [then, now, ...rest] = videos
  const gridVideos = rest.slice(0, 2)
  return (
    <div style={{ paddingTop: '1.25rem' }}>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '2rem', maxWidth: 560 }}>
        {videos.length} Hebrew video{videos.length !== 1 ? 's' : ''} — trace the arc of spoken performance over time.
      </p>
      {then && now && (
        <div className={`${s.thenNow} reveal`}>
          <EmbedVideoCard video={then} />
          <div className={s.thenNowDivider}>
            <div className={s.thenNowLine} />
            <div className={s.thenNowArrow}>&rarr;</div>
            <div className={s.thenNowLine} />
          </div>
          <EmbedVideoCard video={now} />
        </div>
      )}
      {then && !now && (
        <div className={`${s.videoGrid} reveal`}>
          <EmbedVideoCard video={then} />
        </div>
      )}
      {gridVideos.length > 0 && (
        <div className={`${s.videoGrid} reveal`}>
          {gridVideos.map((v) => <EmbedVideoCard key={v.id} video={v} />)}
        </div>
      )}
      {commentEl}
      {canEdit && studentId && <InlineVideoForm studentId={studentId} />}
    </div>
  )
}
