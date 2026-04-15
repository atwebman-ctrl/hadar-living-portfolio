// ============================================================
// components/portfolio/SubjectScoreRows.tsx
//
// Compact score history table used inside IntellectualArc for
// Mathematics and English Language Arts sub-sections.
// Accepts a ScoreDisplayRow[] so both real Assessment data and
// demo fallback constants can be passed in. Rows are sorted
// internally newest-first (academic year desc, then term).
// ============================================================

export interface ScoreDisplayRow {
  id?: string
  term: string
  academicYear: string
  ritScore: number | null
  score: number | null
  percentile: number | null
  /** Short grade tag derived from student grade + year offset, e.g. "Gr 3" or "K". */
  gradeLevel?: string
}

// Terms within a year run Fall → Winter → Spring; lexicographic sort breaks this.
const TERM_ORDER: Record<string, number> = { Fall: 0, Winter: 1, Spring: 2 }

function termOrdinal(term: string | null | undefined): number {
  if (!term) return 0
  const [season, yearStr] = term.split(' ')
  const year = parseInt(yearStr ?? '0', 10)
  return year * 10 + (TERM_ORDER[season] ?? 0)
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

  const sorted = [...rows].sort((a, b) => {
    const yearCmp = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
    if (yearCmp !== 0) return yearCmp
    return termOrdinal(b.term) - termOrdinal(a.term)
  })

  const showGrade = sorted.some((r) => !!r.gradeLevel)
  const gridCols  = showGrade ? '50px 1fr auto auto' : '1fr auto auto'

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0 1.5rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--rule)', marginBottom: '0.25rem' }}>
        {showGrade && <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grade</span>}
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Term</span>
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RIT</span>
        <span style={{ ...monoSm, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pct</span>
      </div>
      {sorted.map((r, i) => {
        const ritDisplay = r.ritScore ?? r.score
        return (
          <div
            key={r.id ?? i}
            style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0 1.5rem', padding: '0.35rem 0', borderBottom: '1px solid var(--rule)' }}
          >
            {showGrade && (
              <span style={{ ...monoSm, color: 'var(--ink-light)' }}>
                {r.gradeLevel ?? '—'}
              </span>
            )}
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
