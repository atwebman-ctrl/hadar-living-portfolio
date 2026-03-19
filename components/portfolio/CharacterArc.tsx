const badges = [
  {
    icon: '🦁',
    iconBg: 'rgba(27,58,107,.08)',
    heb: 'עֹמֶץ',
    transliteration: 'Ometz',
    english: 'Courage',
    date: 'Dec 19, 2025',
    placeholder: false,
  },
  {
    icon: '🕊️',
    iconBg: 'rgba(184,150,62,.1)',
    heb: 'חֵרוּת',
    transliteration: 'Herut',
    english: 'Freedom',
    date: 'Apr 4, 2025',
    placeholder: false,
  },
  {
    icon: '⚖️',
    iconBg: 'rgba(46,125,94,.1)',
    heb: 'אַחְרָיוּת',
    transliteration: 'Achrayut',
    english: 'Responsibility',
    date: 'Feb 21, 2025',
    placeholder: false,
  },
]

export default function CharacterArc() {
  return (
    <section id="character">
      <div className="section-header reveal">
        <span className="section-num">06</span>
        <h2 className="section-title">The Character Arc</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        Torah Im Derech Eretz — Athena was recognized as Student Exemplar of the Week on three
        separate occasions for embodying core character virtues.
      </p>

      <div className="badges-row reveal">
        {badges.map((b) => (
          <div key={b.heb} className="badge-card">
            <div className="badge-icon" style={{ background: b.iconBg }}>{b.icon}</div>
            <div className="badge-heb">{b.heb}</div>
            <div className="badge-en">{b.transliteration}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
              {b.english}
            </div>
            <div className="badge-date">{b.date}</div>
          </div>
        ))}

        {/* Placeholder — next virtue */}
        <div className="badge-card" style={{ opacity: .4, borderStyle: 'dashed' }}>
          <div className="badge-icon" style={{ background: 'var(--cream-dark)', fontSize: 22 }}>+</div>
          <div className="badge-heb" style={{ color: 'var(--ink-faint)' }}>???</div>
          <div className="badge-en">Next Virtue</div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
            To be earned
          </div>
          <div className="badge-date" style={{ color: 'transparent' }}>—</div>
        </div>
      </div>
    </section>
  )
}
