// ============================================================
// Tests for lib/portfolioTabs.ts
//
// The third-language refactor pushed the "third language slot" out
// of the codebase as a hard-coded Hebrew tab and made it driven by
// each school's `third_languages` JSONB config. These tests pin the
// behavior of both helpers across the cases that matter:
//   * Hadar's default config (Hebrew)
//   * a school with no third language at all (must not crash, must
//     not insert a phantom slot)
//   * a school configured with multiple third languages
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  buildPortfolioTabs,
  buildValidSectionSlugs,
  FIXED_SECTION_SLUGS,
} from './portfolioTabs'
import type { ThirdLanguage } from './types'

const HEBREW: ThirdLanguage = { code: 'hebrew', label: 'Hebrew', hasAvantNorms: true }
const SPANISH: ThirdLanguage = { code: 'spanish', label: 'Spanish', hasAvantNorms: false }
const MANDARIN: ThirdLanguage = { code: 'mandarin', label: 'Mandarin', hasAvantNorms: false }

describe('buildPortfolioTabs', () => {
  it('produces the Hadar tab order: Canon · Math · English · Hebrew · Soulcraft', () => {
    const tabs = buildPortfolioTabs([HEBREW])
    expect(tabs.map((t) => t.slug)).toEqual([
      'the-canon', 'math', 'english', 'hebrew', 'soulcraft',
    ])
    expect(tabs.map((t) => t.label)).toEqual([
      'The Canon', 'Math', 'English', 'Hebrew', 'Soulcraft',
    ])
  })

  it('drops the third-language slot when no languages are configured', () => {
    const tabs = buildPortfolioTabs([])
    expect(tabs.map((t) => t.slug)).toEqual([
      'the-canon', 'math', 'english', 'soulcraft',
    ])
  })

  it('inserts each configured language between English and Soulcraft, in order', () => {
    const tabs = buildPortfolioTabs([SPANISH, MANDARIN])
    expect(tabs.map((t) => t.slug)).toEqual([
      'the-canon', 'math', 'english', 'spanish', 'mandarin', 'soulcraft',
    ])
  })

  it('uses the configured label, not the code, for tab text', () => {
    const tabs = buildPortfolioTabs([{ code: 'pt', label: 'Português', hasAvantNorms: false }])
    expect(tabs.find((t) => t.slug === 'pt')?.label).toBe('Português')
  })
})

describe('buildValidSectionSlugs', () => {
  it('always accepts the four fixed section slugs', () => {
    const slugs = buildValidSectionSlugs([])
    for (const fixed of FIXED_SECTION_SLUGS) {
      expect(slugs).toContain(fixed)
    }
  })

  it('accepts each configured third-language code as a valid section slug', () => {
    const slugs = buildValidSectionSlugs([HEBREW, SPANISH])
    expect(slugs).toContain('hebrew')
    expect(slugs).toContain('spanish')
  })

  it('rejects unknown slugs (the route should 404 on these)', () => {
    const slugs = buildValidSectionSlugs([HEBREW])
    expect(slugs.includes('made-up-slug')).toBe(false)
    // Sanity: a code that isn't configured is also rejected
    expect(slugs.includes('mandarin')).toBe(false)
  })
})
