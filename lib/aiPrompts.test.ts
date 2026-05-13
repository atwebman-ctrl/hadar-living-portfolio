import { describe, it, expect } from 'vitest'
import {
  buildMapsPrompt,
  buildLexilePrompt,
  buildCanonPrompt,
  buildCompositionPrompt,
  buildAvantPrompt,
  buildHebrewComparisonPrompt,
  buildCharacterPrompt,
  buildPoetryPrompt,
} from './aiPrompts'
import type { MAPSAssessment } from './mapsHelpers'
import type { AVANTAssessment } from './avantHelpers'
import type { Reading, CharacterAward } from './types'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'

const MAPS_A: MAPSAssessment = {
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
      assessments:      [MAPS_A],
    })
    expect(system).toContain('Athena')
  })

  it('falls back gracefully when first name is null', () => {
    const { system } = buildMapsPrompt({
      studentFirstName: null,
      gradeLabel:       '3',
      termLabel:        'Spring',
      assessments:      [MAPS_A],
    })
    expect(system).toContain("first name where it appears")
  })

  it('serialises every assessment row into the user prompt', () => {
    const { user } = buildMapsPrompt({
      studentFirstName: 'Athena',
      gradeLabel:       '3',
      termLabel:        'Spring',
      assessments:      [MAPS_A, { ...MAPS_A, id: 'a-2', term: 'Jan 2026', mathRIT: 215 }],
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

  it('bans em dashes and en dashes in the system rules (and in its own copy)', () => {
    const { system } = buildMapsPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring', assessments: [],
    })
    expect(system).toMatch(/em dash/i)
    // The rule string itself must not contain the punctuation it forbids.
    expect(system).not.toMatch(/[–—]/)
  })

  it('handles an empty assessments array without throwing', () => {
    const { user } = buildMapsPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring', assessments: [],
    })
    expect(user).toContain('[]')
  })
})

// Every builder shares the BASE_RULES surface; spot-check the cross-cutting
// invariants on each so a regression in one builder is caught locally.
describe('every section prompt enforces the shared tone rules', () => {
  const cases: Array<[string, () => { system: string; user: string }]> = [
    ['lexile', () => buildLexilePrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      band: null,
    })],
    ['canon', () => buildCanonPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      readings: [],
    })],
    ['composition', () => buildCompositionPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'English', samples: [],
    })],
    ['avant', () => buildAvantPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew', assessments: [],
    })],
    ['hebrewComparison', () => buildHebrewComparisonPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew',
      athenaScores: { reading: 0, writing: 0, listening: 0, speaking: 0, composite: 0 },
      nationalAverage: null,
    })],
    ['character', () => buildCharacterPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      awards: [],
    })],
    ['poetry', () => buildPoetryPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      videoTitle: null, hasVideo: false,
    })],
  ]

  it.each(cases)('%s: contains the student first name', (_, build) => {
    expect(build().system).toContain('Athena')
  })

  it.each(cases)('%s: bans em dashes and en dashes', (_, build) => {
    const { system } = build()
    expect(system).toMatch(/em dash/i)
    expect(system).not.toMatch(/[–—]/)
  })

  it.each(cases)('%s: forbids markdown and bullets', (_, build) => {
    const { system } = build()
    expect(system).toMatch(/no markdown/i)
    expect(system).toMatch(/no bullets/i)
  })

  it.each(cases)('%s: refuses to mention AI or that this was generated', (_, build) => {
    const { system } = build()
    expect(system).toMatch(/Do not mention AI/i)
  })
})

describe('buildLexilePrompt', () => {
  it('serialises the band into the user prompt', () => {
    const { user } = buildLexilePrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      band: { label: '1100L-1250L', rangeMinL: 1100, rangeMaxL: 1250, termLabel: 'Spring', notes: null },
    })
    expect(user).toContain('1100')
    expect(user).toContain('1250')
  })

  it('passes null band through cleanly', () => {
    const { user } = buildLexilePrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring', band: null,
    })
    expect(user).toContain('null')
  })
})

describe('buildCanonPrompt', () => {
  it('serialises titles and authors into the user prompt', () => {
    const r: Reading = {
      id: 'r-1', schoolId: 's', studentId: 'st',
      title: 'The Wind in the Willows', author: 'Kenneth Grahame',
      academicYear: '2025-2026', completed: true, sortOrder: 0,
      whyChosen: null, valuesSkills: null, pageCount: null,
      teacherNotes: 'Engaged deeply with Mole.',
      readingDifficulty: 'on_level', studentRating: 5,
      dateStarted: null, dateFinished: null, keyQuote: null,
      curriculumConnection: 'literature', createdAt: '2025-09-01',
    }
    const { user } = buildCanonPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring', readings: [r],
    })
    expect(user).toContain('Wind in the Willows')
    expect(user).toContain('Kenneth Grahame')
    expect(user).toContain('Engaged deeply')
  })
})

describe('buildCompositionPrompt', () => {
  it('names the language label in the system prompt', () => {
    const { system } = buildCompositionPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'English', samples: [],
    })
    expect(system).toContain('English written composition')
  })

  it('truncates long sample bodies to keep the prompt bounded', () => {
    const longBody = 'x'.repeat(5000)
    const s: CompositionSample = {
      id: 's-1', language: 'english', gradeLevel: '3', academicYear: '2025-2026',
      title: 'My Essay', body: longBody, ocrText: null, imagePublicUrl: null,
    }
    const { user } = buildCompositionPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'English', samples: [s],
    })
    // bodies are clipped to 1200 chars
    expect(user).not.toContain('x'.repeat(2000))
  })
})

describe('buildAvantPrompt', () => {
  it('serialises avant rows into the user prompt', () => {
    const a: AVANTAssessment = {
      id: 'av-1', term: 'Aug 2025', academicYear: '2025-2026', grade: 3,
      speaking: 2, reading: 3, listening: 4, writing: 2,
    }
    const { user } = buildAvantPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew', assessments: [a],
    })
    expect(user).toContain('Aug 2025')
    expect(user).toContain('"speaking": 2')
  })

  it('names the language label in the system prompt', () => {
    const { system } = buildAvantPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew', assessments: [],
    })
    expect(system).toContain('Hebrew language proficiency')
  })
})

describe('buildHebrewComparisonPrompt', () => {
  it('serialises both score sets into the user prompt', () => {
    const { user } = buildHebrewComparisonPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew',
      athenaScores:    { reading: 3, writing: 2, listening: 4, speaking: 2, composite: 2.75 },
      nationalAverage: { reading: 2.49, writing: 1.91, listening: 3.09, speaking: 1.89, composite: 2.37 },
    })
    expect(user).toContain('"reading": 3')
    expect(user).toContain('2.49')
  })

  it('passes null nationalAverage through cleanly', () => {
    const { user } = buildHebrewComparisonPrompt({
      studentFirstName: 'A', gradeLabel: '3', termLabel: 'Spring',
      languageLabel: 'Hebrew',
      athenaScores:    { reading: 0, writing: 0, listening: 0, speaking: 0, composite: 0 },
      nationalAverage: null,
    })
    expect(user).toContain('null')
  })
})

describe('buildCharacterPrompt', () => {
  it('serialises virtue rows including Hebrew and transliteration', () => {
    const aw: CharacterAward = {
      id: 'c-1', schoolId: 's', studentId: 'st',
      virtueHebrew: 'חסד', virtueTransliteration: 'Chesed', virtueEnglish: 'Loving-kindness',
      awardDate: '2026-04-01',
      description: 'Helped a classmate without being asked.',
      createdAt: '2026-04-01',
    }
    const { user } = buildCharacterPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring', awards: [aw],
    })
    expect(user).toContain('Chesed')
    expect(user).toContain('Loving-kindness')
    expect(user).toContain('Helped a classmate')
  })
})

describe('buildPoetryPrompt', () => {
  it('signals when a recording is on file', () => {
    const { user } = buildPoetryPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      videoTitle: 'Stopping by Woods', hasVideo: true,
    })
    expect(user).toContain('yes')
    expect(user).toContain('Stopping by Woods')
  })

  it('signals when no recording is on file', () => {
    const { user } = buildPoetryPrompt({
      studentFirstName: 'Athena', gradeLabel: '3', termLabel: 'Spring',
      videoTitle: null, hasVideo: false,
    })
    expect(user).toContain('no')
    expect(user).toContain('not provided')
  })
})
