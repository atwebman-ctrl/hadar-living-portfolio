// @vitest-environment jsdom
// ============================================================
// Tests for LanguageSection's AVANT visibility toggle.
//
// The third-language refactor made AVANT proficiency reporting
// opt-in per language: a school configures a language with
// `hasAvantNorms: true` only when there are real benchmark
// numbers (Hadar/Hebrew). Other third languages render the
// composition + video sub-tabs without the AVANT block.
//
// We assert two things:
//   * with hasAvantNorms=true the AVANT chart heading is present
//   * with hasAvantNorms=false it is not
//
// Sub-components are mocked because they pull in chart libraries
// and other heavy deps that aren't relevant to the visibility
// branch under test.
// ============================================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ThirdLanguage } from '@/lib/types'

vi.mock('@/components/charts/AvantChart',                   () => ({ default: () => <div data-testid="avant-chart" /> }))
vi.mock('@/components/portfolio/AiNarrativePanel',          () => ({ default: () => null }))
vi.mock('@/components/portfolio/InlineAvantForm',           () => ({ default: () => null }))
vi.mock('@/components/shared/InlineSectionComment',         () => ({ default: () => null }))
vi.mock('@/components/portfolio/LanguageVideoTab',          () => ({ default: () => null }))
vi.mock('@/components/portfolio/CompositionView',           () => ({ default: () => null }))

// CSS modules are no-ops in jsdom; Vitest handles this automatically,
// but the explicit mock keeps the test free of "Unknown file extension"
// noise on machines without the css plugin.
vi.mock('@/components/portfolio/GroupDetail.module.css', () => ({ default: {} }))
vi.mock('./sections.module.css',                          () => ({ default: {} }))

import LanguageSection from './LanguageSection'

const HEBREW_WITH_AVANT: ThirdLanguage = {
  code: 'hebrew', label: 'Hebrew', hasAvantNorms: true,
}
const SPANISH_NO_AVANT: ThirdLanguage = {
  code: 'spanish', label: 'Spanish', hasAvantNorms: false,
}

describe('LanguageSection — AVANT visibility', () => {
  it('renders the AVANT four-skills chart block when hasAvantNorms is true', () => {
    render(<LanguageSection language={HEBREW_WITH_AVANT} />)
    expect(screen.queryByText(/AVANT Hebrew — Four Skills Over Time/)).not.toBeNull()
  })

  it('hides the AVANT block entirely when hasAvantNorms is false', () => {
    render(<LanguageSection language={SPANISH_NO_AVANT} />)
    expect(screen.queryByText(/Four Skills Over Time/)).toBeNull()
    // The chart itself shouldn't be rendered either
    expect(screen.queryByTestId('avant-chart')).toBeNull()
  })

  it('still renders the section header (label) regardless of AVANT flag', () => {
    const { rerender } = render(<LanguageSection language={SPANISH_NO_AVANT} />)
    expect(screen.queryByText('Spanish')).not.toBeNull()

    rerender(<LanguageSection language={HEBREW_WITH_AVANT} />)
    expect(screen.queryByText('Hebrew')).not.toBeNull()
  })
})
