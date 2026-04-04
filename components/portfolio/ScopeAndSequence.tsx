import type { SubjectProgress } from '@/lib/types'

interface Props {
  gradeLevel?: string
  subjects?: SubjectProgress[]
}

const DEMO_SUBJECTS: SubjectProgress[] = [
  { subject: 'Mathematics',       unit: 'Fractions & Decimals',     completionPct: 88, notes: null },
  { subject: 'English Language',  unit: 'Narrative Writing',        completionPct: 95, notes: null },
  { subject: 'Hebrew Language',   unit: 'Conversational Fluency',   completionPct: 72, notes: 'Accelerated track' },
  { subject: 'Tanakh Studies',    unit: 'Bereishit — Lech Lecha',   completionPct: 100, notes: null },
  { subject: 'Science',           unit: 'Life Cycles & Ecosystems', completionPct: 60, notes: null },
  { subject: 'History',           unit: 'Ancient Civilizations',    completionPct: 75, notes: null },
  { subject: 'Art & Music',       unit: 'Composition & Expression', completionPct: 50, notes: null },
]

function pctColor(pct: number): string {
  if (pct >= 90) return 'var(--teal)'
  if (pct >= 60) return 'var(--gold)'
  return 'var(--crimson)'
}

export default function ScopeAndSequence({ gradeLevel, subjects }: Props) {
  const data   = subjects && subjects.length > 0 ? subjects : DEMO_SUBJECTS
  const grade  = gradeLevel ?? 'Grade 3'
  const isDemo = !subjects || subjects.length === 0

  return (
    <section id="scope">
      <div className="section-header reveal">
        <span className="section-num">07</span>
        <h2 className="section-title">Scope &amp; Sequence</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {isDemo
          ? `Curriculum coverage for ${grade} — seven subjects tracked across units and completion milestones.`
          : `Curriculum coverage for ${grade} — ${data.length} subject${data.length !== 1 ? 's' : ''} tracked.`}
      </p>

      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map((s, i) => (
          <div key={i} style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--navy)' }}>
                  {s.subject}
                </span>
                {s.unit && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-light)', marginLeft: '0.75rem' }}>
                    {s.unit}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', letterSpacing: '.06em', color: pctColor(s.completionPct) }}>
                {s.completionPct}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--cream-dark)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.completionPct}%`, background: pctColor(s.completionPct), transition: 'width .6s ease' }} />
            </div>
            {s.notes && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.08em', color: 'var(--ink-faint)', marginTop: '.35rem', textTransform: 'uppercase' }}>
                {s.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
