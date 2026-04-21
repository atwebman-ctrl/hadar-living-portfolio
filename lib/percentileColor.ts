// ============================================================
// lib/percentileColor.ts
//
// Single source of truth for percentile text coloring. Used by
// MAPS displays (published profile, dashboard cards, score rows)
// so a 95th-percentile reads the same everywhere.
// ============================================================

export function percentileColor(pct: number | null | undefined): string {
  if (pct == null) return 'var(--ink-mid)'
  if (pct >= 95) return 'var(--ink)'
  if (pct >= 50) return 'var(--gold)'
  return 'var(--crimson)'
}
