import type { Video, StudentVideo } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import InlineVideoForm from './InlineVideoForm'

interface Props {
  videos?:        Video[]         // legacy table — kept for compat
  studentVideos?: StudentVideo[]  // 0008 table — YouTube/Vimeo embeds
  studentId?:     string
  role?:          UserRole
}

// ── Constants ─────────────────────────────────────────────────

const VIDEO_TYPE_LABELS: Record<string, string> = {
  rhetoric:       'Rhetoric',
  reading_aloud:  'Reading Aloud',
  hebrew_speech:  'Hebrew Speaking',
  presentation:   'Presentation',
}

const CATEGORY_LABELS: Record<string, string> = {
  hebrew_speaking:     'Hebrew Speaking',
  poetry_recitation:   'Poetry Recitation',
  socratic_reflection: 'Socratic Reflection',
  immersion:           'Immersion',
  other:               'Other',
}

const DEMO_POEMS = ['Poem I','Poem II','Poem III','Poem IV','Poem V','Poem VI','Poem VII','Poem VIII','Poem IX','Poem X']

// ── Helpers ───────────────────────────────────────────────────

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Convert a YouTube or Vimeo watch URL to its embed URL.
 * Returns null for unrecognised hosts so the caller can fall back gracefully.
 */
export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube: youtube.com/watch?v=ID
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // YouTube short: youtu.be/ID
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // Vimeo: vimeo.com/ID
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch {
    return null
  }
}

// ── Sub-components ────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M1 1l12 7L1 15V1z" fill="white" />
  </svg>
)

function VideoCard({ grade, type, captionLine1, captionLine2, footer }: {
  grade: string; type: string; captionLine1: string; captionLine2?: string; footer: string
}) {
  return (
    <div className="video-card">
      <div className="video-header">
        <span className="video-grade">{grade}</span>
        <span className="video-type">{type}</span>
      </div>
      <div className="video-slot">
        <div className="play-btn"><PlayIcon /></div>
        <div className="video-caption">
          {captionLine1}
          {captionLine2 && <><br />{captionLine2}</>}
        </div>
      </div>
      <div className="video-footer">{footer}</div>
    </div>
  )
}

function EmbedVideoCard({ video }: { video: StudentVideo }) {
  const embedUrl = video.videoUrl ? getEmbedUrl(video.videoUrl) : null
  const nativeUrl = video.videoPublicUrl ?? null

  return (
    <div className="video-card">
      <div className="video-header">
        <span className="video-grade">{video.gradeLevel} · {video.term}</span>
        <span className="video-type">{CATEGORY_LABELS[video.category] ?? video.category}</span>
      </div>
      <div className="video-slot" style={{ padding: 0 }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : nativeUrl ? (
          <video
            controls
            preload="metadata"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
          >
            <source src={nativeUrl} />
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="video-caption" style={{ padding: '1rem' }}>
            Video unavailable
          </div>
        )}
      </div>
      <div className="video-footer">{video.title}</div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function RhetoricRoom({ videos, studentVideos, studentId, role }: Props) {
  const canEdit   = (role === 'admin' || role === 'teacher') && !!studentId
  const hasEmbeds = !!studentVideos && studentVideos.length > 0

  return (
    <section id="rhetoric">
      <SectionHeader />

      {hasEmbeds ? (
        <RealVideos videos={studentVideos!} canEdit={canEdit} studentId={studentId} />
      ) : (
        <PlaceholderVideos legacyVideos={videos} canEdit={canEdit} studentId={studentId} />
      )}
    </section>
  )
}

// ── Real video grid ───────────────────────────────────────────

function RealVideos({ videos, canEdit, studentId }: { videos: StudentVideo[]; canEdit: boolean; studentId?: string }) {
  const [then, now, ...rest] = videos
  const gridVideos = rest.slice(0, 2)

  return (
    <>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '2rem', maxWidth: 560 }}>
        {videos.length} video{videos.length !== 1 ? 's' : ''} — trace the arc of spoken performance over time.
      </p>

      {then && now && (
        <div className="then-now reveal">
          <EmbedVideoCard video={then} />
          <div className="then-now-divider">
            <div className="then-now-line" />
            <div className="then-now-arrow">&rarr;</div>
            <div className="then-now-line" />
          </div>
          <EmbedVideoCard video={now} />
        </div>
      )}

      {then && !now && (
        <div className="video-grid reveal">
          <EmbedVideoCard video={then} />
        </div>
      )}

      {gridVideos.length > 0 && (
        <div className="video-grid reveal">
          {gridVideos.map((v) => <EmbedVideoCard key={v.id} video={v} />)}
        </div>
      )}

      {canEdit && <InlineVideoForm studentId={studentId!} />}
    </>
  )
}

// ── Placeholder (no student_videos yet) ──────────────────────

function PlaceholderVideos({ legacyVideos, canEdit, studentId }: { legacyVideos?: Video[]; canEdit: boolean; studentId?: string }) {
  // If there are legacy Video rows (old table), render those titles in the grid.
  if (legacyVideos && legacyVideos.length > 0) {
    const sorted = [...legacyVideos].sort((a, b) =>
      (a.recordedAt ?? a.academicYear).localeCompare(b.recordedAt ?? b.academicYear)
    )
    const [then, now, ...rest] = sorted
    return (
      <>
        <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '2rem', maxWidth: 560 }}>
          {sorted.length} video{sorted.length !== 1 ? 's' : ''} — trace the arc of spoken performance over time.
        </p>
        {then && now && (
          <div className="then-now reveal">
            <VideoCard grade={then.academicYear} type={VIDEO_TYPE_LABELS[then.videoType] ?? then.videoType}
              captionLine1={then.title} captionLine2={then.description ?? undefined} footer={fmtDate(then.recordedAt)} />
            <div className="then-now-divider">
              <div className="then-now-line" /><div className="then-now-arrow">&rarr;</div><div className="then-now-line" />
            </div>
            <VideoCard grade={now.academicYear} type={VIDEO_TYPE_LABELS[now.videoType] ?? now.videoType}
              captionLine1={now.title} captionLine2={now.description ?? undefined} footer={fmtDate(now.recordedAt)} />
          </div>
        )}
        {rest.slice(0, 2).length > 0 && (
          <div className="video-grid reveal">
            {rest.slice(0, 2).map((v) => (
              <VideoCard key={v.id} grade={v.academicYear} type={VIDEO_TYPE_LABELS[v.videoType] ?? v.videoType}
                captionLine1={v.title} captionLine2={v.description ?? undefined} footer={fmtDate(v.recordedAt)} />
            ))}
          </div>
        )}
        {canEdit && <InlineVideoForm studentId={studentId!} />}
      </>
    )
  }

  // No data — show demo placeholders + form above the achievement banner
  return (
    <>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '.5rem', maxWidth: 560 }}>
        &ldquo;Then &amp; Now&rdquo; — add video clips to trace the student&apos;s spoken voice from
        first-grade Hebrew introduction to Grade 3 public recitation.
      </p>
      <p className="reveal" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em', marginBottom: '2rem' }}>
        Paste a YouTube or Vimeo link to activate each slot.
      </p>
      <div className="then-now reveal">
        <VideoCard grade="Grade 1 · Fall 2023" type="Hebrew Speaking" captionLine1="First-grade Hebrew"
          captionLine2="classroom introduction" footer="Link video · AVANT Speaking: Level 2" />
        <div className="then-now-divider">
          <div className="then-now-line" /><div className="then-now-arrow">&rarr;</div><div className="then-now-line" />
        </div>
        <VideoCard grade="Grade 3 · Jan 2026" type="Poetry Recitation" captionLine1="Bronze Level Poetry"
          captionLine2="Recitation — school stage" footer="Link video · 10 poems memorized &amp; recited" />
      </div>
      <div className="video-grid reveal">
        <VideoCard grade="Socratic Reflection" type="Self-Assessment" captionLine1="Student explains a Middah"
          captionLine2="or Latin phrase they mastered" footer="Student explains a Middah or Latin phrase they mastered" />
        <VideoCard grade="Hebrew Fluency · Grade 3" type="Immersion" captionLine1="Conversational Hebrew"
          captionLine2="classroom moment" footer="AVANT Listening: Level 7 · Advanced tier" />
      </div>

      {canEdit && <InlineVideoForm studentId={studentId!} />}

      <div className="achievement-banner reveal">
        <div className="achievement-medal">BRZ<br />LEVEL</div>
        <div className="achievement-text">
          <h3>Bronze Poetry Recitation Shield</h3>
          <p>
            Awarded by Dr. Liliana Worth, Hadar Jewish Classical Academy<br />
            &ldquo;Hard work, determination and consistent effort to perform beautiful recitations of classic poetry.&rdquo;
          </p>
          <div className="poems-list">
            {DEMO_POEMS.map((p) => <span key={p} className="poem-chip">{p}</span>)}
          </div>
        </div>
      </div>
    </>
  )
}

function SectionHeader() {
  return (
    <div className="section-header reveal">
      <span className="section-num">05</span>
      <h2 className="section-title">The Rhetoric Room</h2>
      <div className="section-rule" />
    </div>
  )
}
