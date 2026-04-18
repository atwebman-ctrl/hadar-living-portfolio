import type { CSSProperties } from 'react'

export const SECTION: CSSProperties = {
  padding: '32px 0', borderBottom: '1px solid var(--rule)',
  pageBreakInside: 'avoid', breakInside: 'avoid',
}
export const HEADER: CSSProperties = { marginBottom: 20 }
export const TITLE: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-heading)', fontSize: 24,
  fontWeight: 600, color: 'var(--navy)', lineHeight: 1.2,
}
export const DESCRIPTOR: CSSProperties = {
  marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
export const NARRATIVE: CSSProperties = {
  margin: '0 0 24px', padding: '0 0 0 20px',
  borderLeft: '2px solid var(--gold)',
}
export const NARRATIVE_PARA: CSSProperties = {
  margin: '0 0 12px', fontFamily: 'var(--font-body)', fontSize: 16,
  lineHeight: 1.6, color: 'var(--ink)',
}
export const NO_NARRATIVE: CSSProperties = {
  margin: '0 0 24px', fontFamily: 'var(--font-body)', fontSize: 13,
  fontStyle: 'italic', color: 'var(--ink-faint)',
}
export const DATA_BLOCK: CSSProperties = { marginTop: 8 }
export const EMPTY: CSSProperties = {
  padding: '12px 0', fontFamily: 'var(--font-body)', fontSize: 13,
  fontStyle: 'italic', color: 'var(--ink-faint)',
}
export const TABLE: CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  background: 'var(--cream)', border: '1px solid var(--rule)',
  fontFamily: 'var(--font-body)', fontSize: 13,
}
export const TH: CSSProperties = {
  padding: '8px 12px', textAlign: 'left',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--rule)',
}
export const TD: CSSProperties = {
  padding: '10px 12px', color: 'var(--ink)',
  borderBottom: '1px solid var(--rule)',
}
export const DEFLIST: CSSProperties = {
  display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px',
  margin: 0, padding: '12px 16px',
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 4,
}
export const DT: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
export const DD: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)',
}
export const READING_LIST: CSSProperties = {
  margin: 0, padding: '0 0 0 24px',
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7,
  color: 'var(--ink)',
}
export const READING_ROW: CSSProperties = { listStyle: 'none', display: 'block', marginBottom: 4 }
export const READING_NUM: CSSProperties = {
  display: 'inline-block', width: 32, marginLeft: -32,
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
}
export const READING_TITLE: CSSProperties = { fontWeight: 500, color: 'var(--navy)' }
export const READING_AUTHOR: CSSProperties = { fontStyle: 'italic', color: 'var(--ink-mid)' }
export const READING_TAG: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
export const CARD_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }
export const SAMPLE_CARD: CSSProperties = {
  border: '1px solid var(--rule)', background: 'var(--cream)',
  borderRadius: 4, padding: 20,
}
export const SAMPLE_HEAD: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  gap: 12, marginBottom: 8,
}
export const SAMPLE_TITLE: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-heading)', fontSize: 16,
  fontWeight: 600, color: 'var(--navy)',
}
export const SAMPLE_META: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
export const SAMPLE_IMG: CSSProperties = {
  display: 'block', maxWidth: '100%', marginTop: 12, borderRadius: 4,
}
export const SAMPLE_BODY: CSSProperties = {
  margin: '12px 0 0', fontFamily: 'var(--font-body)', fontSize: 14,
  lineHeight: 1.6, color: 'var(--ink-mid)', fontStyle: 'italic',
}
export const AWARD_TOP: CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
}
export const AWARD_HEBREW: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 22, color: 'var(--navy)',
}
export const AWARD_TRANSLIT: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 18, fontStyle: 'italic',
  color: 'var(--ink-mid)',
}
export const AWARD_ENGLISH: CSSProperties = {
  marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-mid)',
}
export const AWARD_DATE: CSSProperties = {
  marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)',
}
export const AWARD_CITATION: CSSProperties = {
  margin: '12px 0 0', padding: '0 0 0 14px',
  borderLeft: '2px solid var(--rule)',
  fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6,
  color: 'var(--ink-mid)', fontStyle: 'italic',
}
export const POETRY_TITLE: CSSProperties = {
  marginBottom: 8, fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--navy)',
}
export const POETRY_LINK: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--gold)', textDecoration: 'none',
  borderBottom: '1px solid var(--gold)', paddingBottom: 2,
}
