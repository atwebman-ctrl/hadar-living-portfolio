'use client'

// ============================================================
// components/portfolio/YearSelector.tsx
//
// Sticky year-filter bar. Renders "All Years" + one pill per
// distinct academic year that has data for this student.
// Hides itself when there are no years to show.
// ============================================================

interface Props {
  years:        string[]           // sorted newest-first, e.g. ['2025-2026','2024-2025']
  selectedYear: string             // 'all' or a year string
  onChange:     (y: string) => void
}

const PILL_BASE: React.CSSProperties = {
  fontFamily:    "'Cormorant Garamond', Georgia, serif",
  fontSize:      '0.875rem',
  padding:       '0.2rem 0.75rem',
  border:        '1px solid rgba(184,160,80,0.55)',
  background:    'rgba(255,252,245,0.8)',
  color:         'var(--ink-mid)',
  cursor:        'pointer',
  transition:    'background 0.15s ease, color 0.15s ease',
}

const PILL_ACTIVE: React.CSSProperties = {
  ...PILL_BASE,
  background:    '#B8A050',
  color:         '#F7F4EE',
  border:        '1px solid #9a8540',
}

export default function YearSelector({ years, selectedYear, onChange }: Props) {
  if (years.length === 0) return null

  const allOptions = ['all', ...years]

  return (
    <div
      style={{
        position:     'sticky',
        top:          0,
        zIndex:       8,
        background:   'var(--cream)',
        borderBottom: '1px solid var(--rule)',
        padding:      '0.6rem 2rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        <span
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.58rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'var(--ink-faint)',
            marginRight:   '0.4rem',
          }}
        >
          Academic Year
        </span>
        {allOptions.map((year) => (
          <button
            key={year}
            onClick={() => onChange(year)}
            style={year === selectedYear ? PILL_ACTIVE : PILL_BASE}
          >
            {year === 'all' ? 'All Years' : year}
          </button>
        ))}
      </div>
    </div>
  )
}
