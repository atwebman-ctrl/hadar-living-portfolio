const PlayIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M1 1l12 7L1 15V1z" fill="white" />
  </svg>
)

const poems = ['Poem I','Poem II','Poem III','Poem IV','Poem V','Poem VI','Poem VII','Poem VIII','Poem IX','Poem X']

function VideoCard({ grade, type, caption, footer }: { grade: string; type: string; caption: string; footer: string }) {
  return (
    <div className="video-card">
      <div className="video-header">
        <span className="video-grade">{grade}</span>
        <span className="video-type">{type}</span>
      </div>
      <div className="video-slot">
        <div className="play-btn"><PlayIcon /></div>
        <div className="video-caption" dangerouslySetInnerHTML={{ __html: caption }} />
      </div>
      <div className="video-footer">{footer}</div>
    </div>
  )
}

export default function RhetoricRoom() {
  return (
    <section id="rhetoric">
      <div className="section-header reveal">
        <span className="section-num">05</span>
        <h2 className="section-title">The Rhetoric Room</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '.5rem', maxWidth: 560 }}>
        &ldquo;Then &amp; Now&rdquo; — add video clips to trace Athena&apos;s spoken voice from
        first-grade Hebrew introduction to Grade 3 public recitation.
      </p>
      <p className="reveal" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em', marginBottom: '2rem' }}>
        Upload video recordings or paste YouTube/Vimeo links to activate each slot.
      </p>

      <div className="then-now reveal">
        <VideoCard
          grade="Grade 1 · Fall 2023"
          type="Hebrew Speaking"
          caption="First-grade Hebrew<br/>classroom introduction"
          footer="Link video · AVANT Speaking: Level 2"
        />
        <div className="then-now-divider">
          <div className="then-now-line" />
          <div className="then-now-arrow">→</div>
          <div className="then-now-line" />
        </div>
        <VideoCard
          grade="Grade 3 · Jan 2026"
          type="Poetry Recitation"
          caption="Bronze Level Poetry<br/>Recitation — school stage"
          footer="Link video · 10 poems memorized & recited"
        />
      </div>

      <div className="video-grid reveal">
        <VideoCard
          grade="Socratic Reflection"
          type="Self-Assessment"
          caption="Athena explains Ometz (courage)<br/>in her own words"
          footer="Student explains a Middah or Latin phrase they mastered"
        />
        <VideoCard
          grade="Hebrew Fluency · Grade 3"
          type="Immersion"
          caption="Conversational Hebrew<br/>classroom moment"
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
            {poems.map((p) => <span key={p} className="poem-chip">{p}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
