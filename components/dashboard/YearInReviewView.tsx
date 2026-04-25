// ============================================================
// components/dashboard/YearInReviewView.tsx
//
// Placeholder view — will hold school-year milestones.
// ============================================================

const INK   = '#2c1f0e'
const SEPIA = '#5a4a3a'

export default function YearInReviewView() {
  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b5228', background: 'rgba(184,160,80,0.12)', border: '1px solid rgba(184,160,80,0.45)', padding: '0.2rem 0.65rem', display: 'inline-flex', marginBottom: '0.6rem' }}>
          ⊙ Official Record
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '2rem', color: INK, margin: '0 0 0.4rem', lineHeight: 1.15 }}>
          Year in Review — 2025–2026
        </h2>
        <div style={{ height: 1, background: 'rgba(184,160,80,0.45)', marginBottom: '0.65rem', maxWidth: 520 }} />
        <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '0.95rem', color: SEPIA, margin: '0 0 2rem', maxWidth: 500, lineHeight: 1.55 }}>
          A chronicle of milestones, achievements, and notable moments across the academy.
        </p>
      </div>

      <div style={{ border: '1px solid rgba(160,130,80,0.3)', background: 'rgba(255,252,245,0.5)', padding: '3rem 2rem', textAlign: 'center', maxWidth: 520 }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1.15rem', color: SEPIA, margin: 0 }}>
          No entries yet.
        </p>
      </div>
    </>
  )
}
