import type { Student, SchoolConfig } from '@/lib/types'

interface Props {
  student?: Student
  school?: SchoolConfig
}

// Demo fallback values — used when the component is rendered without props (/demo route)
const DEMO = {
  firstName: 'Athena',
  lastName: 'Lonsdale',
  gradeLevel: 'Grade 3',
  academicYear: '2025–26',
  schoolName: 'Hadar Jewish Classical Academy',
  heroSub: 'Age 8\u00a0·\u00a0Enrolled since 1st Grade\u00a0·\u00a0Hadar Jewish Classical Academy',
  summary: null as string | null,
}

// Highlight metrics stay hardcoded until HeroSection is wired to assessments
const DEMO_METRICS = [
  { lbl: "Math — Jan '26",    val: '95th',  gold: true,  ctx: 'Percentile · RIT 219' },
  { lbl: "English — Jan '26", val: '98th',  gold: true,  ctx: 'Percentile · RIT 229' },
  { lbl: 'Reading Level',     val: '1225L', gold: false, ctx: 'Upper HS / College Entry' },
  { lbl: 'Hebrew Composite',  val: '4.75',  gold: false, ctx: 'vs. 6th-grade avg 4.02' },
]

export default function HeroSection({ student, school }: Props) {
  const firstName = student?.firstName ?? DEMO.firstName
  const lastName  = student?.lastName  ?? DEMO.lastName
  const grade     = student?.gradeLevel  ?? DEMO.gradeLevel
  const year      = student?.academicYear ?? DEMO.academicYear
  const schoolName = school?.name ?? DEMO.schoolName
  const summary   = student?.summary ?? DEMO.summary

  // Sub-line: for real students just show school name; demo keeps the richer line
  const heroSub = student
    ? schoolName
    : DEMO.heroSub

  return (
    <div className="hero" id="overview">
      <div className="hero-tag">
        {schoolName} Living Portfolio{'\u00a0'}·{'\u00a0'}{grade}{'\u00a0'}·{'\u00a0'}Academic Year {year}
      </div>

      <h1>
        {firstName}<br /><em>{lastName}</em>
      </h1>

      <div className="hero-sub">{heroSub}</div>

      {summary && (
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '.85rem',
          color: 'rgba(255,255,255,.6)',
          marginBottom: '1.75rem',
          maxWidth: 560,
          lineHeight: 1.6,
        }}>
          {summary}
        </p>
      )}

      <div className="hero-metrics">
        {DEMO_METRICS.map((m) => (
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
