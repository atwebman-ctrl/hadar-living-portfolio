// ============================================================
// lib/portfolioTabs.ts
//
// Pure helpers for building the portfolio tab list and the set
// of valid section slugs. Tab order and slug validity depend on
// the school's per-tenant `third_languages` config — Hadar gets
// Hebrew, another tenant could get Spanish + Mandarin, a tenant
// with no third language gets none.
//
// Kept in lib/ (no React) so the GroupDetailClient component and
// the app/portfolio/...section/[slug] page can both import the
// same source of truth and so the helpers are unit-testable.
// ============================================================

import type { ThirdLanguage } from '@/lib/types'

export interface PortfolioTabDef {
  slug:  string
  label: string
}

// Sections every school always has, in display order. The
// third-language slot sits between English and Scripture; Scripture
// sits between the third-language slot and Soulcraft.
export const FIXED_SECTION_SLUGS = ['the-canon', 'math', 'english', 'scripture', 'soulcraft'] as const

export function buildPortfolioTabs(thirdLanguages: ThirdLanguage[]): PortfolioTabDef[] {
  return [
    { slug: 'the-canon', label: 'The Canon' },
    { slug: 'math',      label: 'Math'      },
    { slug: 'english',   label: 'English'   },
    ...thirdLanguages.map((l) => ({ slug: l.code, label: l.label })),
    { slug: 'scripture', label: 'Scripture' },
    { slug: 'soulcraft', label: 'Soulcraft' },
  ]
}

// All slugs the section route should accept, including per-school
// language codes. Used by the [slug] route's notFound() guard.
export function buildValidSectionSlugs(thirdLanguages: ThirdLanguage[]): string[] {
  return [...FIXED_SECTION_SLUGS, ...thirdLanguages.map((l) => l.code)]
}
