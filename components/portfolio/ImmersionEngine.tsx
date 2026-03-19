import AvantChart from '@/components/charts/AvantChart'

type BenchRow = { lbl: string; val: string; pct: string; bg: string; opacity: number; athena?: boolean }

const readingRows: BenchRow[] = [
  { lbl: '3rd grade national', val: '2.49', pct: '25%', bg: 'var(--ink-faint)', opacity: .4 },
  { lbl: '4th grade national', val: '3.44', pct: '34%', bg: 'var(--ink-faint)', opacity: .5 },
  { lbl: '5th grade national', val: '3.86', pct: '38%', bg: 'var(--ink-faint)', opacity: .6 },
  { lbl: '6th grade national', val: '4.75', pct: '47%', bg: 'var(--ink-mid)',   opacity: .55 },
  { lbl: 'Athena (Grade 3)',   val: '6.00', pct: '100%', bg: 'var(--navy)',     opacity: 1, athena: true },
]
const listeningRows: BenchRow[] = [
  { lbl: '3rd grade national', val: '3.09', pct: '31%', bg: 'var(--ink-faint)', opacity: .4 },
  { lbl: '4th grade national', val: '3.65', pct: '36%', bg: 'var(--ink-faint)', opacity: .5 },
  { lbl: '5th grade national', val: '4.18', pct: '42%', bg: 'var(--ink-faint)', opacity: .6 },
  { lbl: '6th grade national', val: '4.75', pct: '48%', bg: 'var(--ink-mid)',   opacity: .55 },
  { lbl: 'Athena (Grade 3)',   val: '7.00', pct: '100%', bg: 'var(--navy)',     opacity: 1, athena: true },
]

function BenchCard({ title, rows }: { title: string; rows: BenchRow[] }) {
  return (
    <div className="bench-card">
      <div className="skill-name">{title}</div>
      {rows.map((r) => (
        <div key={r.lbl} className="bench-bar-row">
          <div className={`bench-bar-label${r.athena ? ' athena' : ''}`}>
            <span>{r.lbl}</span><span>{r.val}</span>
          </div>
          <div className="bench-bar-track">
            <div className="bench-bar-fill" style={{ width: r.pct, background: r.bg, opacity: r.opacity }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ImmersionEngine() {
  return (
    <section id="hebrew">
      <div className="section-header reveal">
        <span className="section-num">02</span>
        <h2 className="section-title">The Immersion Engine</h2>
        <div className="section-rule" />
      </div>

      <div className="callout reveal">
        <div className="big" style={{ fontSize: '1.8rem', lineHeight: 1.1, textAlign: 'center' }}>
          6th<br /><span style={{ fontSize: '1rem', color: 'rgba(255,255,255,.5)' }}>Grade</span>
        </div>
        <div className="text">
          <strong>A 3rd grader with 6th-grade Hebrew skills.</strong><br />
          On the national AVANT STAMP benchmark for Hebrew immersion schools (2022–23), Athena scores
          at or above the average for students three years her senior. Her reading score of 6.0 and
          listening score of 7.0 exceed the 6th-grade national averages of 4.75.
        </div>
      </div>

      <div className="chart-wrap reveal">
        <div className="chart-title">AVANT Hebrew — Four Skills Over Time</div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#1B3A6B' }} /> Speaking</span>
          <span><span className="legend-dot" style={{ background: '#B8963E' }} /> Reading</span>
          <span><span className="legend-dot" style={{ background: '#2E7D5E' }} /> Listening</span>
          <span><span className="legend-dot" style={{ background: '#7C3AED' }} /> Writing</span>
        </div>
        <div style={{ position: 'relative', height: 260 }}>
          <AvantChart />
        </div>
      </div>

      <div className="bench-grid reveal">
        <BenchCard title="Reading — Athena vs. national averages" rows={readingRows} />
        <BenchCard title="Listening — Athena vs. national averages" rows={listeningRows} />
      </div>
    </section>
  )
}
