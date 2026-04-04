import type { HandwritingSample } from '@/lib/types'

interface Props {
  samples?: HandwritingSample[]
}

// Demo fallback — three placeholder samples
const DEMO_SAMPLES = [
  { id: '1', term: 'Fall 2025',   gradeLabel: 'Grade 3', notes: 'Cursive introduction — consistent letter height observed.' },
  { id: '2', term: 'Winter 2026', gradeLabel: 'Grade 3', notes: 'Improved spacing and word separation.' },
  { id: '3', term: 'Spring 2026', gradeLabel: 'Grade 3', notes: null },
]

function fmtDate(iso: string): string {
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function HandwritingSamples({ samples }: Props) {
  const hasData = !!samples && samples.length > 0

  return (
    <section id="handwriting">
      <div className="section-header reveal">
        <span className="section-num">08</span>
        <h2 className="section-title">Handwriting Samples</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${samples!.length} handwriting sample${samples!.length !== 1 ? 's' : ''} — scanned originals with teacher observations.`
          : 'Three handwriting samples collected across the academic year, charting growth in cursive fluency and spatial consistency.'}
      </p>

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {hasData
          ? samples!.map((s) => (
              <SampleCard
                key={s.id}
                label={`${s.term} · ${s.academicYear}`}
                notes={s.teacherNotes}
                hasImage
              />
            ))
          : DEMO_SAMPLES.map((s) => (
              <SampleCard
                key={s.id}
                label={`${s.term} · ${s.gradeLabel}`}
                notes={s.notes}
                hasImage={false}
              />
            ))}
      </div>
    </section>
  )
}

function SampleCard({ label, notes, hasImage }: { label: string; notes: string | null; hasImage: boolean }) {
  return (
    <div style={{ border: '1px solid var(--rule)', background: 'var(--parchment)' }}>
      {/* Image area */}
      <div style={{
        height: 180,
        background: 'var(--cream-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--rule)',
      }}>
        {hasImage ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'var(--ink-faint)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Image
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'var(--ink-faint)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Placeholder
          </span>
        )}
      </div>
      {/* Metadata */}
      <div style={{ padding: '.75rem 1rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 .35rem' }}>
          {label}
        </p>
        {notes && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
            {notes}
          </p>
        )}
      </div>
    </div>
  )
}
