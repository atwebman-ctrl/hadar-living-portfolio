import MapsChart from '@/components/charts/MapsChart'

const lexileRows = [
  { lbl: '3rd Grade avg',  pct: '32%',  bg: 'var(--ink-faint)', opacity: .3,  val: '420L',  navy: false },
  { lbl: '8th Grade avg',  pct: '61%',  bg: 'var(--navy)',      opacity: .4,  val: '1010L', navy: false },
  { lbl: '11th Grade avg', pct: '80%',  bg: 'var(--navy)',      opacity: .55, val: '1200L', navy: false },
  { lbl: 'Athena (age 8)', pct: '90%',  bg: 'var(--navy)',      opacity: 1,   val: '1225L', navy: true  },
  { lbl: 'College-ready',  pct: '100%', bg: 'var(--gold)',      opacity: .4,  val: '1300L', navy: false },
]

export default function IntellectualArc() {
  return (
    <section id="academics">
      <div className="section-header reveal">
        <span className="section-num">01</span>
        <h2 className="section-title">The Intellectual Arc</h2>
        <div className="section-rule" />
      </div>

      <div className="callout reveal">
        <div className="big">+19</div>
        <div className="text">
          <strong>From 76th to 95th percentile in math</strong> across two years.<br />
          Athena entered 1st grade performing above the national average. By January 2026, she has
          accelerated into the top 5% of all students nationwide — a trajectory that demonstrates
          what classical immersion education does for a learner.
        </div>
      </div>

      <div className="chart-wrap reveal">
        <div className="chart-title">MAPS RIT Scores — Grade 1 through Grade 3</div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#1B3A6B' }} /> English (RIT)</span>
          <span><span className="legend-dot" style={{ background: '#B8963E' }} /> Math (RIT)</span>
        </div>
        <div style={{ position: 'relative', height: 260 }}>
          <MapsChart />
        </div>
      </div>

      <div className="chart-wrap reveal">
        <div className="chart-title">Lexile Reading Level — Athena vs. Grade Benchmarks</div>
        <p style={{ marginBottom: 8, fontStyle: 'italic', fontSize: '.85rem', color: 'var(--ink-light)' }}>
          At age 8, Athena reads at the same level as college-entry seniors. Her current range
          (1150–1300L) aligns with 11th–12th grade readiness benchmarks.
        </p>
        <div style={{ marginTop: '1.25rem' }}>
          {lexileRows.map((r) => (
            <div key={r.lbl} className="lexile-row">
              <span className="lexile-lbl" style={r.navy ? { color: 'var(--navy)', fontWeight: 500 } : undefined}>
                {r.lbl}
              </span>
              <div className="lexile-bar-outer" style={r.navy ? { background: 'rgba(27,58,107,.1)' } : undefined}>
                <div className="lexile-bar-inner" style={{ width: r.pct, background: r.bg, opacity: r.opacity }} />
              </div>
              <span className="lexile-val" style={r.navy ? { color: 'var(--navy)', fontWeight: 500 } : undefined}>
                {r.val}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--rule)', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink-light)' }}>
          Currently reading:{' '}
          <em style={{ fontStyle: 'normal', color: 'var(--ink)' }}>
            Tales from Shakespeare · Great Expectations · The Jungle Book
          </em>
        </div>
      </div>
    </section>
  )
}
