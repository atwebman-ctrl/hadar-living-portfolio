// ============================================================
// components/dashboard/SettingsView.tsx
//
// Admin-only placeholder — organization settings overview.
// ============================================================

const INK   = '#2c1f0e'
const SEPIA = '#5a4a3a'
const FAINT = '#8a7558'

interface Props { role: string }

export default function SettingsView({ role }: Props) {
  if (role !== 'admin') {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1.15rem', color: FAINT }}>
          Settings are available to administrators only.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b5228', background: 'rgba(184,160,80,0.12)', border: '1px solid rgba(184,160,80,0.45)', padding: '0.2rem 0.65rem', display: 'inline-flex', marginBottom: '0.6rem' }}>
          ⊙ Admin Only
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '2rem', color: INK, margin: '0 0 0.4rem', lineHeight: 1.15 }}>
          Archival Settings
        </h2>
        <div style={{ height: 1, background: 'rgba(184,160,80,0.45)', marginBottom: '0.65rem', maxWidth: 520 }} />
        <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '0.95rem', color: SEPIA, margin: '0 0 2rem', maxWidth: 500, lineHeight: 1.55 }}>
          Organization settings, teacher management, and parent invitations.
        </p>
      </div>

      <div style={{ border: '1px solid rgba(160,130,80,0.3)', background: 'rgba(255,252,245,0.5)', padding: '3rem 2rem', textAlign: 'center', maxWidth: 520 }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1.15rem', color: SEPIA, margin: '0 0 0.5rem' }}>
          Settings coming soon.
        </p>
        <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '0.9rem', color: FAINT, margin: 0 }}>
          Full settings management will be available in Sprint 5.
        </p>
      </div>
    </>
  )
}
