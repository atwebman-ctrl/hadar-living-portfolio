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

const BASE_RULES = `Write a single paragraph of 2-4 sentences for a student's living portfolio.\
The audience is the student's parents. Voice: warm, literate, celebratory — like a thoughtful\
letter from an admired teacher. Third person, plain prose only — no markdown, no headings,\
no bullets, no lists. Never invent scores, percentiles, or specific facts not present in the\
data provided. Do not mention AI, models, or that this draft was generated.`

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
percentiles support it. Avoid jargon like "RIT" or "percentile rank" — translate into plain\
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
