// ============================================================
// components/profiles/profileOverviewStyles.ts
//
// Shared style objects for ProfileOverview and its two state
// children. Pulled out so each component file can stay under
// the 300-line limit.
// ============================================================

import type { CSSProperties } from 'react'

export const PAGE: CSSProperties = {
  minHeight: '100vh', background: 'var(--cream)',
  padding: '48px 32px', display: 'flex', justifyContent: 'center',
}
export const SHELL: CSSProperties = { width: '100%', maxWidth: 960 }

export const EYEBROW: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 12,
}

// Empty state
export const EMPTY_CARD: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: '64px 48px',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  textAlign: 'center', gap: 20,
}
export const EMPTY_HEADING: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500,
  color: 'var(--navy)', margin: 0,
}
export const EMPTY_BODY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55,
  color: 'var(--ink-mid)', maxWidth: 480, margin: 0,
}
export const PRIMARY_BTN: CSSProperties = {
  height: 44, padding: '0 28px',
  background: 'var(--navy)', color: 'var(--white)', border: 'none',
  borderRadius: 6, cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
export const ERR_TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: '#B0413E', margin: 0,
}

// Filled state
export const HEADER: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: 20, marginBottom: 24,
}
export const AVATAR: CSSProperties = {
  width: 64, height: 64, borderRadius: '50%',
  border: '2px solid var(--gold)', background: 'var(--cream-dark)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--navy)',
  flexShrink: 0,
}
export const HEADER_NAME: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500,
  color: 'var(--navy)', margin: 0,
}
export const HEADER_META: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)',
  marginTop: 4,
}

export const STAT_GRID: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
  marginBottom: 32,
}
export const STAT_BOX: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: '18px 16px',
}
export const STAT_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}
export const STAT_VALUE: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500,
  color: 'var(--navy)',
}

export const SECTION_LIST: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, overflow: 'hidden',
}
export const SECTION_ROW: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 20px', borderBottom: '1px solid var(--rule)',
}
export const SECTION_ROW_LAST: CSSProperties = { ...SECTION_ROW, borderBottom: 'none' }
export const SECTION_TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 500,
  color: 'var(--navy)',
}
export const SECTION_STATUS: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-mid)', marginTop: 4,
}
export const OPEN_LINK: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', textDecoration: 'none',
  pointerEvents: 'none', cursor: 'not-allowed',
}

export const SEASON_LABEL = { fall: 'Fall', spring: 'Spring' } as const
