// ============================================================
// components/portfolio/ScriptureEmpty.tsx
//
// Placeholder empty state for the Scripture tab. The tab is in
// the portfolio taxonomy but has no data model or AI prompt
// builder yet — this surface tells parents/teachers that
// Scripture content will appear here once the section ships.
//
// Themed to match the rest of the portfolio (cream background,
// gold rule, serif heading) so it doesn't read as a placeholder
// to a visitor seeing the product for the first time.
// ============================================================

import s from './sections.module.css'

interface Props {
  /** 1-based position in the current tab/scroll list. Defaults to 5. */
  sectionIndex?: number
}

export default function ScriptureEmpty({ sectionIndex }: Props = {}) {
  const numLabel = String(sectionIndex ?? 5).padStart(2, '0')
  return (
    <section id="scripture">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>{numLabel}</span>
        <h2 className={s.sectionTitle}>Scripture</h2>
        <div className={s.sectionRule} />
      </div>

      <p
        className="reveal"
        style={{
          fontSize:     '.9rem',
          color:        'var(--ink-light)',
          marginBottom: '1.75rem',
          maxWidth:     560,
        }}
      >
        Memory work, recitations, and devotional reflections will live here. As teachers
        record passages and observations through the year, this section will fill with the
        student&rsquo;s journey through Scripture.
      </p>

      <div
        className="reveal"
        style={{
          border:       '1px solid var(--rule)',
          borderRadius: 4,
          padding:      '3rem 1.5rem',
          textAlign:    'center',
          color:        'var(--ink-light)',
          fontFamily:   'var(--font-mono)',
          fontSize:     '0.7rem',
          letterSpacing:'0.12em',
          textTransform:'uppercase',
          background:   'rgba(255,255,255,0.4)',
        }}
      >
        Coming soon
      </div>
    </section>
  )
}
