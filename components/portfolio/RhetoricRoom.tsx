import type { Video } from '@/lib/types'

interface Props {
  videos?: Video[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VIDEO_TYPE_LABELS: Record<string, string> = {
  rhetoric:       'Rhetoric',
  reading_aloud:  'Reading Aloud',
  hebrew_speech:  'Hebrew Speaking',
  presentation:   'Presentation',
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return ''
  // Parse as local date to avoid UTC-offset surprises on date-only strings
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M1 1l12 7L1 15V1z" fill="white" />
  </svg>
)

// No dangerouslySetInnerHTML — captionLine1/2 are plain text
function VideoCard({
  grade,
  type,
  captionLine1,
  captionLine2,
  footer,
}: {
  grade: string
  type: string
  captionLine1: string
  captionLine2?: string
  footer: string
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

const DEMO_POEMS = ['Poem I','Poem II','Poem III','Poem IV','Poem V','Poem VI','Poem VII','Poem VIII','Poem IX','Poem X']

// ── Component ─────────────────────────────────────────────────────────────────

export default function RhetoricRoom({ videos }: Props) {
  const hasData = !!videos && videos.length > 0

  if (!hasData) {
    return (
      <section id="rhetoric">
        <SectionHeader />
        <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '.5rem', maxWidth: 560 }}>
          &ldquo;Then &amp; Now&rdquo; — add video clips to trace the student&apos;s spoken voice from
          first-grade Hebrew introduction to Grade 3 public recitation.
        </p>
        <p className="reveal" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em', marginBottom: '2rem' }}>
          Upload video recordings or paste YouTube/Vimeo links to activate each slot.
        </p>

        <div className="then-now reveal">
          <VideoCard
            grade="Grade 1 · Fall 2023"
            type="Hebrew Speaking"
            captionLine1="First-grade Hebrew"
            captionLine2="classroom introduction"
            footer="Link video · AVANT Speaking: Level 2"
          />
          <div className="then-now-divider">
            <div className="then-now-line" />
            <div className="then-now-arrow">&rarr;</div>
            <div className="then-now-line" />
          </div>
          <VideoCard
            grade="Grade 3 · Jan 2026"
            type="Poetry Recitation"
            captionLine1="Bronze Level Poetry"
            captionLine2="Recitation — school stage"
            footer="Link video · 10 poems memorized & recited"
          />
        </div>

        <div className="video-grid reveal">
          <VideoCard
            grade="Socratic Reflection"
            type="Self-Assessment"
            captionLine1="Student explains a Middah"
            captionLine2="or Latin phrase they mastered"
            footer="Student explains a Middah or Latin phrase they mastered"
          />
          <VideoCard
            grade="Hebrew Fluency · Grade 3"
            type="Immersion"
            captionLine1="Conversational Hebrew"
            captionLine2="classroom moment"
            footer="AVANT Listening: Level 7 · Advanced tier"
          />
        </div>

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
      </section>
    )
  }

  // Real data path — sort chronologically, show oldest/newest as Then & Now,
  // remaining in the grid (capped at 2 for layout)
  const sorted = [...videos!].sort((a, b) => {
    const da = a.recordedAt ?? a.academicYear
    const db = b.recordedAt ?? b.academicYear
    return da.localeCompare(db)
  })

  const [then, now, ...rest] = sorted
  const gridVideos = rest.slice(0, 2)

  return (
    <section id="rhetoric">
      <SectionHeader />
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '2rem', maxWidth: 560 }}>
        {sorted.length} video{sorted.length !== 1 ? 's' : ''} — trace the arc of spoken performance over time.
      </p>

      {then && now && (
        <div className="then-now reveal">
          <VideoCard
            grade={then.academicYear}
            type={VIDEO_TYPE_LABELS[then.videoType] ?? then.videoType}
            captionLine1={then.title}
            captionLine2={then.description ?? undefined}
            footer={fmtDate(then.recordedAt)}
          />
          <div className="then-now-divider">
            <div className="then-now-line" />
            <div className="then-now-arrow">&rarr;</div>
            <div className="then-now-line" />
          </div>
          <VideoCard
            grade={now.academicYear}
            type={VIDEO_TYPE_LABELS[now.videoType] ?? now.videoType}
            captionLine1={now.title}
            captionLine2={now.description ?? undefined}
            footer={fmtDate(now.recordedAt)}
          />
        </div>
      )}

      {then && !now && (
        <div className="video-grid reveal">
          <VideoCard
            grade={then.academicYear}
            type={VIDEO_TYPE_LABELS[then.videoType] ?? then.videoType}
            captionLine1={then.title}
            captionLine2={then.description ?? undefined}
            footer={fmtDate(then.recordedAt)}
          />
        </div>
      )}

      {gridVideos.length > 0 && (
        <div className="video-grid reveal">
          {gridVideos.map((v) => (
            <VideoCard
              key={v.id}
              grade={v.academicYear}
              type={VIDEO_TYPE_LABELS[v.videoType] ?? v.videoType}
              captionLine1={v.title}
              captionLine2={v.description ?? undefined}
              footer={fmtDate(v.recordedAt)}
            />
          ))}
        </div>
      )}
    </section>
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
