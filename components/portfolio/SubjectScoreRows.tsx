// ============================================================
// components/portfolio/SubjectScoreRows.tsx
//
// Compact score history table used inside IntellectualArc for
// Mathematics and English Language Arts sub-sections.
// Accepts a ScoreDisplayRow[] so both real Assessment data and
// demo fallback constants can be passed in.
// ============================================================

export interface ScoreDisplayRow {
  id?: string
  term: string
  academicYear: string
  ritScore: number | null
  score: number | null
  percentile: number | null
}

const monoSm: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
}

export default function SubjectScoreRows({ rows }: { rows: ScoreDisplayRow[] }) {
  if (rows.length === 0) {
    return (
      <p style={{ ...monoSm, color: 'var(--ink-faint)', margin: '0.5rem 0 1rem' }}>
        No scores recorded yet.
      </p>
    )
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 2rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--rule)', marginBottom: '0.25rem' }}>
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Term</span>
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RIT</span>
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pct</span>
      </div>
      {rows.map((r, i) => {
        const ritDisplay = r.ritScore ?? r.score
        return (
          <div
            key={r.id ?? i}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 2rem', padding: '0.35rem 0', borderBottom: '1px solid var(--rule)' }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)' }}>
              {r.term} <span style={{ ...monoSm, color: 'var(--ink-light)' }}>{r.academicYear}</span>
            </span>
            <span style={{ ...monoSm, color: 'var(--navy)', fontWeight: 500 }}>
              {ritDisplay ?? '—'}
            </span>
            <span style={{ ...monoSm, color: 'var(--ink-mid)' }}>
              {r.percentile != null ? `${r.percentile}th` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
