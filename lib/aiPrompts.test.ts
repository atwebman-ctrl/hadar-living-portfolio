import { describe, it, expect } from 'vitest'
import { buildMapsPrompt } from './aiPrompts'
import type { MAPSAssessment } from './mapsHelpers'

const A: MAPSAssessment = {
  id: 'a-1',
  term: 'Sep 2025',
  academicYear: '2025-2026',
  grade: 3,
  mathRIT: 210,
  mathPercentile: 88,
  engRIT: 205,
  engPercentile: 92,
}

describe('buildMapsPrompt', () => {
  it('embeds the student first name in the system prompt', () => {
    const { system } = buildMapsPrompt({
      studentFirstName: 'Athena',
      gradeLabel:       '3',
      termLabel:        'Spring',
      assessments:      [A],
    })
    expect(system).toContain('Athena')
  })

  it('falls back gracefully when first name is null', () => {
    const { system } = buildMapsPrompt({
      studentFirstName: null,
      gradeLabel:       '3',
      termLabel:        'Spring',
      assessments:      [A],
    })
    expect(system).toContain("first name where it appears")
  })

  it('serialises every assessment row into the user prompt', () => {
    const { user } = buildMapsPrompt({
      studentFirstName: 'Athena',
      gradeLabel:       '3',
      termLabel:        'Spring',
      assessments:      [A, { ...A, id: 'a-2', term: 'Jan 2026', mathRIT: 215 }],
    })
    expect(user).toContain('Sep 2025')
    expect(user).toContain('Jan 2026')
    expect(user).toContain('215')
  })

  it('forbids markdown / bullets / headings in system rules', () => {
    const { system } = buildMapsPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring', assessments: [],
    })
    expect(system).toMatch(/no markdown/i)
    expect(system).toMatch(/no bullets/i)
  })

  it('handles an empty assessments array without throwing', () => {
    const { user } = buildMapsPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring', assessments: [],
    })
    expect(user).toContain('[]')
  })
})
