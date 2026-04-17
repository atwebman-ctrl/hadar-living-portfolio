// scripts/diffAthenaAgainstPdf.ts — Compare Athena's existing seeded
// data against the verified Hadar Learning Profile PDF values.
// READ-ONLY. No mutations.

import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const ATHENA = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'

type MapExpected = { type: 'maps_math' | 'maps_english'; term: string; year: string; rit: number; pct: number }
type AvantExpected = { type: 'avant_speaking' | 'avant_reading' | 'avant_listening' | 'avant_writing'; term: string; year: string; score: number }
type ReadingExpected = { title: string; author?: string; completed: boolean }
type AwardExpected = { translit: string; date: string }

// ── Expected values from the PDF ────────────────────────────
const MAP_EXPECTED: MapExpected[] = [
  { type: 'maps_math',    term: 'Feb 2024', year: '2023-2024', rit: 179, pct: 76 },
  { type: 'maps_english', term: 'Feb 2024', year: '2023-2024', rit: 183, pct: 90 },
  { type: 'maps_math',    term: 'May 2024', year: '2023-2024', rit: 194, pct: 91 },
  { type: 'maps_english', term: 'May 2024', year: '2023-2024', rit: 193, pct: 94 },
  { type: 'maps_math',    term: 'Aug 2024', year: '2024-2025', rit: 188, pct: 84 },
  { type: 'maps_english', term: 'Aug 2024', year: '2024-2025', rit: 216, pct: 99 },
  { type: 'maps_math',    term: 'Jan 2025', year: '2024-2025', rit: 199, pct: 87 },
  { type: 'maps_english', term: 'Jan 2025', year: '2024-2025', rit: 212, pct: 98 },
  { type: 'maps_math',    term: 'May 2025', year: '2024-2025', rit: 211, pct: 94 },
  { type: 'maps_english', term: 'May 2025', year: '2024-2025', rit: 221, pct: 99 },
  { type: 'maps_math',    term: 'Aug 2025', year: '2025-2026', rit: 214, pct: 97 },
  { type: 'maps_english', term: 'Aug 2025', year: '2025-2026', rit: 216, pct: 96 },
  { type: 'maps_math',    term: 'Jan 2026', year: '2025-2026', rit: 219, pct: 95 },
  { type: 'maps_english', term: 'Jan 2026', year: '2025-2026', rit: 229, pct: 98 },
]

const LEXILE_EXPECTED = {
  value: '1150L-1300L', term: 'Jan 2026', year: '2025-2026',
}

const AVANT_EXPECTED: AvantExpected[] = [
  { type: 'avant_listening', term: 'Nov 2024', year: '2024-2025', score: 4 },
  { type: 'avant_reading',   term: 'Nov 2024', year: '2024-2025', score: 3 },
  { type: 'avant_speaking',  term: 'Nov 2024', year: '2024-2025', score: 2 },
  { type: 'avant_listening', term: 'May 2025', year: '2024-2025', score: 6 },
  { type: 'avant_reading',   term: 'May 2025', year: '2024-2025', score: 5 },
  { type: 'avant_speaking',  term: 'May 2025', year: '2024-2025', score: 3 },
  { type: 'avant_listening', term: 'Aug 2025', year: '2025-2026', score: 7 },
  { type: 'avant_reading',   term: 'Aug 2025', year: '2025-2026', score: 4 },
  { type: 'avant_speaking',  term: 'Aug 2025', year: '2025-2026', score: 2 },
  { type: 'avant_writing',   term: 'Aug 2025', year: '2025-2026', score: 2 },
  { type: 'avant_listening', term: 'Jan 2026', year: '2025-2026', score: 7 },
  { type: 'avant_reading',   term: 'Jan 2026', year: '2025-2026', score: 6 },
  { type: 'avant_speaking',  term: 'Jan 2026', year: '2025-2026', score: 3 },
  { type: 'avant_writing',   term: 'Jan 2026', year: '2025-2026', score: 3 },
]

const READINGS_EXPECTED: ReadingExpected[] = [
  { title: 'Alice in Wonderland',                              completed: true },
  { title: "Grimm's Fairy Tales",                              completed: true },
  { title: 'Black Beauty',                                     completed: true },
  { title: 'The Snow Queen',                                   completed: true },
  { title: 'Charlie and the Chocolate Factory',                completed: true },
  { title: 'The Jungle Book',                                  completed: true },
  { title: 'Homer Price',                                      completed: true },
  { title: 'Tales from Shakespeare',                           completed: true, author: 'Charles and Mary Lamb' },
  { title: 'Aladdin & other Stories from the Arabian Nights',  completed: true },
  { title: 'Guns for General Washington',                      completed: false },
]

const AWARDS_EXPECTED: AwardExpected[] = [
  { translit: 'Ometz',     date: '2025-12-19' },
  { translit: 'Herut',     date: '2025-04-04' },
  { translit: 'Achrayut',  date: '2025-02-21' },
]

// ── Helpers ──────────────────────────────────────────────────
const norm = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

function fuzzyTitleMatch(expected: string, actual: string): boolean {
  return norm(expected) === norm(actual) ||
    norm(actual).includes(norm(expected)) ||
    norm(expected).includes(norm(actual))
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  let mapMatches = 0,    mapMismatches: string[] = [],    mapMissing: string[] = [],    mapExtra: string[] = []
  let lexileMatches = 0, lexileMismatches: string[] = []
  let avantMatches = 0,  avantMismatches: string[] = [],  avantMissing: string[] = [],  avantExtra: string[] = []
  let readMatches = 0,   readMismatches: string[] = [],   readMissing: string[] = [],   readExtra: string[] = []
  let awardMatches = 0,  awardMismatches: string[] = [],  awardMissing: string[] = [],  awardExtra: string[] = []

  // ── MAP SCORES ─────────────────────────────────────────────
  console.log('=== MAP scores ===')
  const { data: mapRows } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .in('assessment_type', ['maps_math', 'maps_english'])

  const seenMap = new Set<string>()
  for (const exp of MAP_EXPECTED) {
    const matches = (mapRows ?? []).filter(r =>
      r.assessment_type === exp.type && r.term === exp.term && r.academic_year === exp.year,
    )
    if (matches.length === 0) {
      mapMissing.push(`${exp.type} ${exp.term} ${exp.year}`)
      console.log(`  MISSING: ${exp.type} ${exp.term} ${exp.year} (expected rit=${exp.rit} pct=${exp.pct})`)
      continue
    }
    if (matches.length > 1) {
      console.log(`  ⚠ DUPLICATE in DB (${matches.length} rows): ${exp.type} ${exp.term} ${exp.year}`)
    }
    const got = matches[0]
    matches.forEach(m => seenMap.add(m.id))
    if (got.rit_score === exp.rit && got.percentile === exp.pct) {
      mapMatches++
    } else {
      mapMismatches.push(`${exp.type} ${exp.term}`)
      console.log(`  MISMATCH: ${exp.type} ${exp.term} — expected rit=${exp.rit} pct=${exp.pct}, got rit=${got.rit_score} pct=${got.percentile}`)
    }
  }
  for (const r of mapRows ?? []) {
    if (!seenMap.has(r.id)) {
      mapExtra.push(`${r.assessment_type} ${r.term} ${r.academic_year} (rit=${r.rit_score} pct=${r.percentile})`)
      console.log(`  EXTRA in DB: ${r.assessment_type} ${r.term} ${r.academic_year} (rit=${r.rit_score} pct=${r.percentile})`)
    }
  }

  // ── LEXILE ─────────────────────────────────────────────────
  console.log('\n=== Lexile ===')
  const { data: lexRows } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .eq('assessment_type', 'lexile')
  if (!lexRows || lexRows.length === 0) {
    lexileMismatches.push('MISSING')
    console.log(`  MISSING: lexile ${LEXILE_EXPECTED.term} ${LEXILE_EXPECTED.year} value=${LEXILE_EXPECTED.value}`)
  } else {
    for (const r of lexRows) {
      const valOk  = r.lexile_value === LEXILE_EXPECTED.value
      const termOk = r.term === LEXILE_EXPECTED.term
      const yrOk   = r.academic_year === LEXILE_EXPECTED.year
      if (valOk && termOk && yrOk) {
        lexileMatches++
      } else {
        lexileMismatches.push(`row id=${r.id}`)
        console.log(`  MISMATCH: lexile — expected value="${LEXILE_EXPECTED.value}" term="${LEXILE_EXPECTED.term}" year="${LEXILE_EXPECTED.year}", got value="${r.lexile_value}" term="${r.term}" year="${r.academic_year}"`)
      }
    }
    if (lexRows.length > 1) console.log(`  ⚠ ${lexRows.length} lexile rows present`)
  }

  // ── AVANT ──────────────────────────────────────────────────
  console.log('\n=== AVANT Hebrew ===')
  const { data: avRows } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .in('assessment_type', ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'])

  const seenAv = new Set<string>()
  for (const exp of AVANT_EXPECTED) {
    const matches = (avRows ?? []).filter(r =>
      r.assessment_type === exp.type && r.term === exp.term && r.academic_year === exp.year,
    )
    if (matches.length === 0) {
      avantMissing.push(`${exp.type} ${exp.term} ${exp.year}`)
      console.log(`  MISSING: ${exp.type} ${exp.term} ${exp.year} (expected score=${exp.score})`)
      continue
    }
    if (matches.length > 1) {
      console.log(`  ⚠ DUPLICATE in DB (${matches.length} rows): ${exp.type} ${exp.term} ${exp.year}`)
    }
    const got = matches[0]
    matches.forEach(m => seenAv.add(m.id))
    if (got.score === exp.score) {
      avantMatches++
    } else {
      avantMismatches.push(`${exp.type} ${exp.term}`)
      console.log(`  MISMATCH: ${exp.type} ${exp.term} — expected score=${exp.score}, got score=${got.score}`)
    }
  }
  for (const r of avRows ?? []) {
    if (!seenAv.has(r.id)) {
      avantExtra.push(`${r.assessment_type} ${r.term} ${r.academic_year} (score=${r.score})`)
      console.log(`  EXTRA in DB: ${r.assessment_type} ${r.term} ${r.academic_year} (score=${r.score})`)
    }
  }

  // ── READINGS ───────────────────────────────────────────────
  console.log('\n=== Readings ===')
  const { data: readRows } = await supabaseAdmin
    .from('readings')
    .select('*')
    .eq('student_id', ATHENA)
    .eq('academic_year', '2025-2026')

  const seenRead = new Set<string>()
  for (const exp of READINGS_EXPECTED) {
    const matches = (readRows ?? []).filter(r => fuzzyTitleMatch(exp.title, r.title))
    if (matches.length === 0) {
      readMissing.push(exp.title)
      console.log(`  MISSING: "${exp.title}" (completed=${exp.completed})`)
      continue
    }
    if (matches.length > 1) {
      console.log(`  ⚠ DUPLICATE titles in DB (${matches.length} rows) for "${exp.title}"`)
    }
    const got = matches[0]
    matches.forEach(m => seenRead.add(m.id))
    const titleExact = got.title === exp.title
    const completedOk = got.completed === exp.completed
    if (completedOk && titleExact) {
      readMatches++
    } else {
      const flags: string[] = []
      if (!titleExact)  flags.push(`TITLE VARIATION expected="${exp.title}" got="${got.title}"`)
      if (!completedOk) flags.push(`COMPLETED MISMATCH expected=${exp.completed} got=${got.completed}`)
      readMismatches.push(`"${exp.title}"`)
      console.log(`  MISMATCH: "${exp.title}" — ${flags.join(' | ')}`)
      // Note: we still tally these as not matching even though title is fuzzy-equal
    }
  }
  for (const r of readRows ?? []) {
    if (!seenRead.has(r.id)) {
      readExtra.push(`"${r.title}" (completed=${r.completed})`)
      console.log(`  EXTRA in DB: "${r.title}" (completed=${r.completed})`)
    }
  }

  // ── AWARDS ─────────────────────────────────────────────────
  console.log('\n=== Character awards ===')
  const { data: awRows } = await supabaseAdmin
    .from('character_awards')
    .select('*')
    .eq('student_id', ATHENA)

  const seenAw = new Set<string>()
  for (const exp of AWARDS_EXPECTED) {
    const matches = (awRows ?? []).filter(r =>
      norm(r.virtue_transliteration) === norm(exp.translit),
    )
    if (matches.length === 0) {
      awardMissing.push(exp.translit)
      console.log(`  MISSING: ${exp.translit} ${exp.date}`)
      continue
    }
    if (matches.length > 1) {
      console.log(`  ⚠ DUPLICATE awards in DB (${matches.length} rows) for ${exp.translit}`)
    }
    const got = matches[0]
    matches.forEach(m => seenAw.add(m.id))
    const dbDate = String(got.award_date).slice(0, 10)
    if (dbDate === exp.date) {
      awardMatches++
    } else {
      awardMismatches.push(exp.translit)
      console.log(`  MISMATCH: ${exp.translit} — expected date=${exp.date}, got date=${dbDate}`)
    }
  }
  for (const r of awRows ?? []) {
    if (!seenAw.has(r.id)) {
      awardExtra.push(`${r.virtue_transliteration} ${String(r.award_date).slice(0, 10)}`)
      console.log(`  EXTRA in DB: ${r.virtue_transliteration} ${String(r.award_date).slice(0, 10)}`)
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────
  const fmt = (matches: number, total: number, mis: string[], miss: string[], extra: string[]) => {
    const allOk = matches === total && mis.length === 0 && miss.length === 0 && extra.length === 0
    let s = `${matches}/${total} match${allOk ? ' ✓' : ''}`
    if (mis.length)   s += `   mismatched=${mis.length}`
    if (miss.length)  s += `   missing=${miss.length}`
    if (extra.length) s += `   extra=${extra.length}`
    return s
  }

  console.log('\n=== DIFF SUMMARY ===')
  console.log(`MAP scores:       ${fmt(mapMatches,    14, mapMismatches,    mapMissing,    mapExtra)}`)
  console.log(`Lexile:           ${fmt(lexileMatches,  1, lexileMismatches, [],            [])}`)
  console.log(`AVANT Hebrew:     ${fmt(avantMatches,  14, avantMismatches,  avantMissing,  avantExtra)}`)
  console.log(`Readings:         ${fmt(readMatches,   10, readMismatches,   readMissing,   readExtra)}`)
  console.log(`Character awards: ${fmt(awardMatches,   3, awardMismatches,  awardMissing,  awardExtra)}`)

  const allMatch =
    mapMatches    === 14 && mapMismatches.length    === 0 && mapMissing.length    === 0 && mapExtra.length    === 0 &&
    lexileMatches === 1  && lexileMismatches.length === 0 &&
    avantMatches  === 14 && avantMismatches.length  === 0 && avantMissing.length  === 0 && avantExtra.length  === 0 &&
    readMatches   === 10 && readMismatches.length   === 0 && readMissing.length   === 0 && readExtra.length   === 0 &&
    awardMatches  === 3  && awardMismatches.length  === 0 && awardMissing.length  === 0 && awardExtra.length  === 0

  console.log()
  console.log(allMatch
    ? 'VERDICT: existing data is correct. No seed needed.'
    : 'VERDICT: seed required. Mismatches detailed above.')
}

main().catch((e) => { console.error(e); process.exit(1) })
