// ============================================================
// lib/avantNorms.ts
//
// Reference benchmarks for AVANT STAMP grade-level averages
// (mirrors the lib/nweaNorms.ts pattern).
//
// Source: AVANT STAMP 2022-2023 annual averages, as documented
// in Hadar's Learning Profile PDF.
//
// These norms are language-agnostic: AVANT publishes the same
// 4-skill (reading / writing / listening / speaking) framework
// across languages. The numbers below are what Hadar (Hebrew
// immersion) currently uses; for non-Hadar tenants with different
// AVANT cohort data, swap or extend this map -- but only schools
// whose third_languages[i].hasAvantNorms === true should reference it.
// ============================================================

export interface LanguageSkillAverages {
  reading:   number
  writing:   number
  listening: number
  speaking:  number
  composite: number
}

export const AVANT_GRADE_AVERAGES: Record<3 | 4 | 5 | 6, LanguageSkillAverages> = {
  3: { reading: 2.49, writing: 1.91, listening: 3.09, speaking: 1.89, composite: 2.37 },
  4: { reading: 3.44, writing: 2.21, listening: 3.65, speaking: 2.19, composite: 2.91 },
  5: { reading: 3.86, writing: 2.91, listening: 4.18, speaking: 2.93, composite: 3.49 },
  6: { reading: 4.75, writing: 3.39, listening: 4.75, speaking: 3.17, composite: 4.02 },
}

export const AVANT_SKILLS = ['reading', 'writing', 'listening', 'speaking', 'composite'] as const
export type AvantSkill = typeof AVANT_SKILLS[number]
