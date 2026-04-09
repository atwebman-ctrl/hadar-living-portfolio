'use client'

// ============================================================
// components/portfolio/YearSelector.tsx
//
// Year-filter pill bar. Renders "All Years" + one pill per
// distinct academic year that has data for this student.
// Hides itself when there are no years to show.
// ============================================================

interface Props {
  years:    string[]           // sorted newest-first
  selectedYear: string         // 'all' or a year string
  onChange: (y: string) => void
}

const PILL_BASE: React.CSSProperties = {
  fontFamily:  "'Cormorant Garamond', Georgia, serif",
  fontSize:    '0.875rem',
  padding:     '0.18rem 0.7rem',
  border:      '1px solid rgba(184,160,80,0.45)',
  background:  'transparent',
  color:       'var(--ink-mid)',
  cursor:      'pointer',
  transition:  'background 0.15s ease, color 0.15s ease',
}

const PILL_ACTIVE: React.CSSProperties = {
  ...PILL_BASE,
  background: '#B8A050',
  color:      '#F7F4EE',
  border:     '1px solid #9a8540',
}

export default function YearSelector({ years, selectedYear, onChange }: Props) {
  if (years.length === 0) return null

  return (
    <div style={{
      padding:      '0.5rem 2rem',
      borderBottom: '1px solid var(--rule)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.58rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         'var(--ink-faint)',
          marginRight:   '0.3rem',
        }}>
          Year
        </span>
        {['all', ...years].map((year) => (
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
