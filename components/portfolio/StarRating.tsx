'use client'

// ============================================================
// components/portfolio/StarRating.tsx
//
// 5-star click-to-rate input. Gold filled vs outline.
// value=0 means no rating selected (renders all outline).
// ============================================================

interface Props {
  value:    number          // 0 = unset, 1–5 = rating
  onChange: (n: number) => void
  label?:   string
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         'var(--ink-light)',
  display:       'block',
  marginBottom:  '0.3rem',
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div>
      {label && <span style={LABEL_STYLE}>{label}</span>}
      <div style={{ display: 'flex', gap: '0.2rem' }} role="group" aria-label={label ?? 'Rating'}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            aria-pressed={value >= n}
            style={{
              background:  'none',
              border:      'none',
              padding:     '0 1px',
              cursor:      'pointer',
              fontSize:    '1.25rem',
              color:       value >= n ? '#B8A050' : 'rgba(139,115,85,0.25)',
              lineHeight:  1,
              transition:  'color 0.1s ease',
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
