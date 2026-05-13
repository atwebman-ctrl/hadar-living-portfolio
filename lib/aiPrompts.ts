// ============================================================
// lib/aiPrompts.ts
//
// Pure prompt-building helpers for the Profile Builder's AI
// drafting pipeline. One builder per profile section kind.
// No I/O, no Supabase, no Anthropic SDK — server route loads
// the data, calls the builder, then ships the strings to Claude.
//
// Tone rules (apply to every section):
//   - Single paragraph, 2-4 sentences
//   - Third person, student's first name
//   - Warm, literate, celebratory — like a thoughtful letter
//     from an admired teacher to a parent
//   - Plain prose, no markdown, no headings, no bullets
//   - Never invent scores or facts not present in the data
//
// Per Tayler: do NOT name Claude in product UI copy. Prompts here
// are server-side and parents never see them, but the resulting
// narrative also must not reference "AI" or "Claude" — keep it
// in the teacher's voice.
// ============================================================

import type { MAPSAssessment } from './mapsHelpers'
import type { AVANTAssessment } from './avantHelpers'
import type { LanguageSkillAverages } from './avantNorms'
import type { Reading, CharacterAward } from './types'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'

const BASE_RULES = `Write a single paragraph of 2-4 sentences for a student's living portfolio.\
The audience is the student's parents. Voice: warm, literate, celebratory, like a thoughtful\
letter from an admired teacher. Third person, plain prose only, no markdown, no headings,\
no bullets, no lists. Use commas, colons, or periods instead of em dashes or en dashes.\
Never invent scores, percentiles, or specific facts not present in the data provided.\
Do not mention AI, models, or that this draft was generated.`

function nameClause(firstName: string | null): string {
  return firstName
    ? `The student's first name is ${firstName}. Refer to them by this name.`
    : `Use the student's first name where it appears in the data.`
}

export interface PromptPair {
  system: string
  user:   string
}

// ── MAPS (NWEA Math + English) ───────────────────────────────

export interface MapsPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  assessments:      MAPSAssessment[]
}

export function buildMapsPrompt(input: MapsPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing covers NWEA\
MAP Growth assessment results for math and reading. Speak to growth across administrations\
when the data shows it; speak to current standing relative to grade-level norms when the\
percentiles support it. Avoid jargon like "RIT" or "percentile rank"; translate into plain\
language a parent can read.`

  const rows = input.assessments.map((a) => ({
    term:           a.term,
    academicYear:   a.academicYear,
    gradeAtTime:    a.grade,
    mathRIT:        a.mathRIT,
    mathPercentile: a.mathPercentile,
    englishRIT:     a.engRIT,
    englishPercentile: a.engPercentile,
  }))

  const user = `Section: NWEA MAP Growth (Math and English)
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Assessment history (earliest first):
${JSON.stringify(rows, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Lexile (reading level) ───────────────────────────────────

export interface LexilePromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  band: {
    label:     string
    rangeMinL: number
    rangeMaxL: number
    termLabel: string
    notes:     string | null
  } | null
}

export function buildLexilePrompt(input: LexilePromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing reports the\
student's Lexile reading level. Describe what the band suggests about the texts the student\
can read with comprehension. If the score sits above the typical grade-level band, name that\
plainly. If there is no Lexile data, write a brief paragraph noting that a reading level has\
not yet been measured this term, framed positively and without speculation.`

  const user = `Section: Lexile reading level
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Lexile data:
${JSON.stringify(input.band, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Canon reading list ───────────────────────────────────────

export interface CanonPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  readings:         Reading[]
}

export function buildCanonPrompt(input: CanonPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing reflects on\
the books the student has read this term as part of the English literary canon. Note the\
arc or themes across the readings rather than listing every title. If teacher notes,\
student ratings, or key quotes are present, draw on them to illustrate the student's\
engagement. If the list is empty, write a brief sentence noting that the term's reading\
record is still being assembled.`

  const rows = input.readings.map((r) => ({
    title:                r.title,
    author:               r.author,
    completed:            r.completed,
    studentRating:        r.studentRating,
    teacherNotes:         r.teacherNotes,
    keyQuote:             r.keyQuote,
    curriculumConnection: r.curriculumConnection,
    readingDifficulty:    r.readingDifficulty,
  }))

  const user = `Section: English canon reading list
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Books read or in progress:
${JSON.stringify(rows, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Composition (English or third language) ──────────────────
//
// Shared by English composition and the school's third-language
// composition section. The `languageLabel` reads "English" or
// "Hebrew" (or whatever the school configured). The `language`
// field on each sample row is the lowercase code.

export interface CompositionPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  languageLabel:    string
  samples:          CompositionSample[]
}

export function buildCompositionPrompt(input: CompositionPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing reflects on\
the student's ${input.languageLabel} written composition this term. Speak to voice, structure,\
or growth in craft when the samples reveal it. You may quote a short phrase from a sample if\
it illustrates the student's voice; never quote more than one short fragment. If no samples\
are available, write a brief sentence noting that the term's written work is still being\
gathered.`

  // Trim sample bodies so the prompt stays bounded.
  const rows = input.samples.map((s) => ({
    title:        s.title,
    gradeLevel:   s.gradeLevel,
    academicYear: s.academicYear,
    body:         s.body ? s.body.slice(0, 1200) : null,
    ocrText:      s.ocrText ? s.ocrText.slice(0, 1200) : null,
  }))

  const user = `Section: ${input.languageLabel} composition
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Writing samples this term:
${JSON.stringify(rows, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── AVANT (third-language proficiency) ───────────────────────

export interface AvantPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  languageLabel:    string
  assessments:      AVANTAssessment[]
}

export function buildAvantPrompt(input: AvantPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing reports the\
student's ${input.languageLabel} language proficiency as measured by the AVANT STAMP\
assessment, which scores listening, reading, speaking, and writing on a band scale where\
higher numbers represent more advanced proficiency. Speak to growth across administrations\
when the data shows it, and speak to the balance of receptive (listening, reading) and\
productive (speaking, writing) skills. Translate band numbers into plain language a parent\
can read.`

  const rows = input.assessments.map((a) => ({
    term:         a.term,
    academicYear: a.academicYear,
    gradeAtTime:  a.grade,
    listening:    a.listening,
    reading:      a.reading,
    speaking:     a.speaking,
    writing:      a.writing,
  }))

  const user = `Section: ${input.languageLabel} proficiency (AVANT STAMP)
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Assessment history (earliest first):
${JSON.stringify(rows, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Hebrew · National comparison ─────────────────────────────

export interface HebrewComparisonPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  languageLabel:    string
  athenaScores:     LanguageSkillAverages
  nationalAverage:  LanguageSkillAverages | null
}

export function buildHebrewComparisonPrompt(input: HebrewComparisonPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing compares the\
student's most recent ${input.languageLabel} proficiency scores to published national\
grade-level averages for the same assessment. Speak to which skills the student is meeting\
or exceeding the grade norm in, and which are still developing. Avoid clinical comparison\
language; the goal is encouragement grounded in evidence.`

  const user = `Section: ${input.languageLabel} national comparison
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Student's latest scores (by skill):
${JSON.stringify(input.athenaScores, null, 2)}

Published grade-level averages (or null if none available for this grade):
${JSON.stringify(input.nationalAverage, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Character Development · Middot ───────────────────────────

export interface CharacterPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  awards:           CharacterAward[]
}

export function buildCharacterPrompt(input: CharacterPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing celebrates\
the virtues (middot) the student has been recognized for this term. Each award names a\
virtue in Hebrew and English and includes a short teacher description of the moment that\
prompted it. Weave the virtues and moments together into one warm paragraph; preserve the\
Hebrew transliteration on first mention of each virtue. If no awards are present, write a\
brief sentence noting that character growth has been observed in less formal moments this\
term, without speculation.`

  const rows = input.awards.map((a) => ({
    virtueHebrew:          a.virtueHebrew,
    virtueTransliteration: a.virtueTransliteration,
    virtueEnglish:         a.virtueEnglish,
    awardDate:             a.awardDate,
    description:           a.description,
  }))

  const user = `Section: Character Development (Middot)
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Awards this term (most recent first):
${JSON.stringify(rows, null, 2)}

Write the portfolio paragraph.`

  return { system, user }
}

// ── Rhetoric · Poetry Recitation ─────────────────────────────

export interface PoetryPromptInput {
  studentFirstName: string | null
  gradeLabel:       string
  termLabel:        string
  videoTitle:       string | null
  hasVideo:         boolean
}

export function buildPoetryPrompt(input: PoetryPromptInput): PromptPair {
  const system = `You are a writing assistant for teachers at a small classical academy.\
${BASE_RULES} ${nameClause(input.studentFirstName)} The section you are writing accompanies\
a recorded poetry recitation, which is part of the school's rhetoric tradition: every\
student memorizes and performs a poem each term. The audience will watch the recording\
themselves, so do not describe what they will see in detail. Instead, name the poem if it\
is provided, and reflect briefly on the formative value of memorizing and performing verse.\
If no recording is yet on file, write a short sentence noting that this term's recitation\
is forthcoming.`

  const user = `Section: Rhetoric · Poetry recitation
Current grade: ${input.gradeLabel}
Reporting term: ${input.termLabel}

Recording on file: ${input.hasVideo ? 'yes' : 'no'}
Poem title (if provided): ${input.videoTitle ?? 'not provided'}

Write the portfolio paragraph.`

  return { system, user }
}
