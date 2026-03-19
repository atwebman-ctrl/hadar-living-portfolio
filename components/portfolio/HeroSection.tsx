const metrics = [
  { lbl: "Math — Jan '26",    val: '95th', gold: true,  ctx: 'Percentile · RIT 219' },
  { lbl: "English — Jan '26", val: '98th', gold: true,  ctx: 'Percentile · RIT 229' },
  { lbl: 'Reading Level',     val: '1225L', gold: false, ctx: 'Upper HS / College Entry' },
  { lbl: 'Hebrew Composite',  val: '4.75',  gold: false, ctx: 'vs. 6th-grade avg 4.02' },
]

export default function HeroSection() {
  return (
    <div className="hero" id="overview">
      <div className="hero-tag">Hadar Living Portfolio · Grade 3 · Academic Year 2025–26</div>
      <h1>Athena<br /><em>Lonsdale</em></h1>
      <div className="hero-sub">
        Age 8 &nbsp;·&nbsp; Enrolled since 1st Grade &nbsp;·&nbsp; Hadar Jewish Classical Academy
      </div>
      <div className="hero-metrics">
        {metrics.map((m) => (
          <div key={m.lbl} className="hero-metric">
            <div className="lbl">{m.lbl}</div>
            <div className={`val${m.gold ? ' gold' : ''}`}>{m.val}</div>
            <div className="ctx">{m.ctx}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
