// ============================================================
// supabase/seed.ts
//
// Inserts Athena Lonsdale's full demo dataset into all tables.
// Safe to re-run — deletes the demo student by fixed UUID first
// (ON DELETE CASCADE wipes all content rows), then re-inserts.
//
// Prerequisites:
//   npm install -D tsx
//
// Usage:
//   npx tsx supabase/seed.ts
//
// Env vars are read from .env.local automatically if present;
// override by setting them in the shell before running.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

// ── Load .env.local without a dotenv dependency ───────────────────────────────
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

// ── Fixed UUIDs ───────────────────────────────────────────────────────────────
const SCHOOL_ID  = 'a1000000-0000-0000-0000-000000000001' // Hadar (in migration 0002)
const STUDENT_ID = 'b1000000-0000-0000-0000-000000000001' // Athena Lonsdale

// ── Supabase admin client ─────────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// ── Helper — throws on Supabase error ────────────────────────────────────────
async function insert<T extends object>(table: string, rows: T | T[]): Promise<void> {
  const { error } = await db.from(table).insert(rows as never)
  if (error) throw new Error(`[${table}] ${error.message}`)
  const count = Array.isArray(rows) ? rows.length : 1
  console.log(`  ✓ ${table}: ${count} row${count !== 1 ? 's' : ''}`)
}

// ── MAPS assessment data ──────────────────────────────────────────────────────
// Columns: [term, academicYear, engRit, engPct, mathRit, mathPct]
const MAPS_ROWS = [
  ["Feb '24", '2023-2024', 183, 90, 179, 76],
  ["May '24", '2023-2024', 193, 94, 194, 91],
  ["Aug '24", '2024-2025', 216, 99, 188, 84],
  ["Jan '25", '2024-2025', 212, 98, 199, 87],
  ["May '25", '2024-2025', 221, 99, 211, 94],
  ["Aug '25", '2025-2026', 216, 96, 214, 97],
  ["Jan '26", '2025-2026', 229, 98, 219, 95],
] as const

// ── AVANT Hebrew assessment data ──────────────────────────────────────────────
// Columns: [term, academicYear, speaking, reading, listening, writing]
// null = skill not yet tested in that sitting
const AVANT_ROWS = [
  ["Nov '24", '2024-2025', 2,    3,    4,    null],
  ["May '25", '2024-2025', 3,    5,    6,    null],
  ["Aug '25", '2025-2026', 2,    4,    7,    2   ],
  ["Jan '26", '2025-2026', 3,    6,    7,    3   ],
] as const

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding Athena Lonsdale demo data…\n')

  // 1. Remove previous demo student (cascade deletes all content rows)
  const { error: delErr } = await db.from('students').delete().eq('id', STUDENT_ID)
  if (delErr) throw new Error(`[students delete] ${delErr.message}`)
  console.log('  ✓ cleared previous demo student\n')

  // 2. Student ─────────────────────────────────────────────────────────────────
  await insert('students', {
    id:               STUDENT_ID,
    school_id:        SCHOOL_ID,
    first_name:       'Athena',
    last_name:        'Lonsdale',
    grade_level:      'Grade 3',
    academic_year:    '2025-2026',
    parent_user_ids:  [],
    profile_photo_path: null,
    summary:          'Athena is a classical learner whose growth across every domain — ' +
                      'mathematical reasoning, Hebrew immersion, rhetoric, and character — ' +
                      'exemplifies what a Hadar education is designed to cultivate.',
    is_demo:          true,
  })

  // 3. MAPS assessments (14 rows — English + Math per sitting) ─────────────────
  const mapsAssessments = MAPS_ROWS.flatMap(([term, year, engRit, engPct, mathRit, mathPct]) => [
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      assessment_type: 'maps_english',
      score: null, rit_score: engRit, percentile: engPct, lexile_value: null,
      term, academic_year: year, notes: null,
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      assessment_type: 'maps_math',
      score: null, rit_score: mathRit, percentile: mathPct, lexile_value: null,
      term, academic_year: year, notes: null,
    },
  ])
  await insert('assessments', mapsAssessments)

  // 4. AVANT assessments (14 rows — up to 4 skills per sitting) ────────────────
  const avantSkills = ['avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing'] as const
  const avantAssessments = AVANT_ROWS.flatMap(([term, year, speaking, reading, listening, writing]) =>
    ([speaking, reading, listening, writing] as (number | null)[])
      .map((score, i) => ({ score, type: avantSkills[i] }))
      .filter(({ score }) => score !== null)
      .map(({ score, type }) => ({
        school_id: SCHOOL_ID, student_id: STUDENT_ID,
        assessment_type: type,
        score, rit_score: null, percentile: null, lexile_value: null,
        term, academic_year: year, notes: null,
      }))
  )
  await insert('assessments', avantAssessments)

  // 5. Lexile assessment ────────────────────────────────────────────────────────
  await insert('assessments', {
    school_id: SCHOOL_ID, student_id: STUDENT_ID,
    assessment_type: 'lexile',
    score: null, rit_score: null, percentile: null, lexile_value: '1225L',
    term: "Jan '26", academic_year: '2025-2026',
    notes: 'Upper HS / College Entry range (1150–1300L)',
  })

  // 6. Readings (Grade 3 canon, sort_order matches shelf order) ─────────────────
  await insert('readings', [
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 1,  completed: true,  academic_year: '2025-2026', title: 'Alice in Wonderland',         author: 'Lewis Carroll',         page_count: 96,  why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 2,  completed: true,  academic_year: '2025-2026', title: "Grimm's Fairy Tales",         author: 'Brothers Grimm',        page_count: 320, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 3,  completed: true,  academic_year: '2025-2026', title: 'Black Beauty',                 author: 'Anna Sewell',           page_count: 255, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 4,  completed: true,  academic_year: '2025-2026', title: 'The Snow Queen',               author: 'Hans Christian Andersen', page_count: 48, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 5,  completed: true,  academic_year: '2025-2026', title: 'Charlie and the Chocolate Factory', author: 'Roald Dahl',       page_count: 176, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 6,  completed: true,  academic_year: '2025-2026', title: 'The Jungle Book',              author: 'Rudyard Kipling',       page_count: 212, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 7,  completed: true,  academic_year: '2025-2026', title: 'Homer Price',                  author: 'Robert McCloskey',      page_count: 160, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 8,  completed: true,  academic_year: '2025-2026', title: 'Tales from Shakespeare',       author: 'Charles and Mary Lamb', page_count: 320, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 9,  completed: true,  academic_year: '2025-2026', title: 'Aladdin and the Arabian Nights', author: null,                  page_count: 192, why_chosen: null, values_skills: null },
    { school_id: SCHOOL_ID, student_id: STUDENT_ID, sort_order: 10, completed: false, academic_year: '2025-2026', title: 'Guns for General Washington',   author: 'Seymour Reit',          page_count: 144, why_chosen: null, values_skills: null },
  ])

  // 7. Writing samples ──────────────────────────────────────────────────────────
  await insert('writing_samples', [
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      language: 'english', grade_level: 'Grade 1', academic_year: '2023-2024',
      title: 'Animal Research',
      body:
        'fox. There are foxis at my School too babys and a moms. whet will hapin too them ' +
        'the babys plad neer the chikin Koop so that is hoo has bin diping the holin the ' +
        'prawnd but the foxis wor so cute Gabex Kold Artameood and Oameeams. thaeechast ' +
        'the mommy fox in srcols arawnd the Scool',
      ocr_text:
        'Age 6 · Phonetic spelling, strong phonemic awareness, beginning sentence structure, ' +
        'genuine curiosity and narrative intent. MAPS English: 90th–94th percentile.',
      image_path: null, storage_path: null,
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      language: 'english', grade_level: 'Grade 2', academic_year: '2024-2025',
      title: 'Personal Narrative — Animal Care Center',
      body:
        'One day I went to the animal care center with my Aunty Rutty. We met a small cat ' +
        'named Buddy, he was very playful. He was light orange with dark orange stripes and ' +
        'he had white and green eyes and a pink nose. He jumped into my lap, we played for a ' +
        'long time. Then we had to go have dinner at Aunty Rutty\'s house. We watched a movie ' +
        'and did a sleepover. I\'m looking forward to it. I\'m also looking forward to going to ' +
        'Cape Cod — I\'ve told myself I\'ll catch a fiddler crab.',
      ocr_text:
        'Age 7 · Controlled narrative structure, specific sensory detail, temporal transitions, ' +
        'forward-looking conclusion. Grade 2 English MAPS: 98th–99th percentile.',
      image_path: null, storage_path: null,
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      language: 'english', grade_level: 'Grade 3', academic_year: '2025-2026',
      title: 'Literary Retelling — "A Good Idea"',
      body:
        'In the Hundred Acre Woods it rained miserably for many days, so there was a flood. ' +
        'Piglet was in his tree. He was miserable because he was lonely. He sent a bottle ' +
        'message: \'Help! Piglet needs help on one side and Piglet needs help fast on the ' +
        'other side.\' Pooh was still in his house when he woke up. He found out that his ' +
        'house was flooded. So he took his ten honey pots one at a time and sat on a tree ' +
        'branch above the water. Just then he saw Piglet\'s bottle — and thought it was a ' +
        'jar of honey.',
      ocr_text:
        'Age 8 · Complex sentence variety, embedded dialogue, cause-and-effect reasoning, ' +
        'ironic ending preserved. Grade 3 English MAPS: 95th–98th percentile.',
      image_path: null, storage_path: null,
    },
  ])

  // 8. Character awards ─────────────────────────────────────────────────────────
  await insert('character_awards', [
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      virtue_hebrew: 'עֹמֶץ', virtue_transliteration: 'Ometz', virtue_english: 'Courage',
      award_date: '2025-12-19',
      description: 'Recognized for speaking up during a difficult class discussion and defending a classmate with honesty and care.',
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      virtue_hebrew: 'חֵרוּת', virtue_transliteration: 'Herut', virtue_english: 'Freedom',
      award_date: '2025-04-04',
      description: 'Demonstrated intellectual independence in Socratic seminar — questioned assumptions without teacher prompting.',
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      virtue_hebrew: 'אַחְרָיוּת', virtue_transliteration: 'Achrayut', virtue_english: 'Responsibility',
      award_date: '2025-02-21',
      description: 'Took ownership of a group project, ensuring every member understood their role and the work was submitted on time.',
    },
  ])

  // 9. Videos (placeholder records — storage_path satisfies the XOR constraint) ─
  await insert('videos', [
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      video_type: 'hebrew_speech',
      title: 'First-Grade Hebrew Classroom Introduction',
      description: 'AVANT Speaking: Level 2. Athena introduces herself in Hebrew to the class.',
      storage_path: `videos/${SCHOOL_ID}/${STUDENT_ID}/gr1-hebrew-intro.mp4`,
      external_url: null,
      thumbnail_path: null,
      recorded_at: '2023-10-15',
      academic_year: '2023-2024',
    },
    {
      school_id: SCHOOL_ID, student_id: STUDENT_ID,
      video_type: 'rhetoric',
      title: 'Bronze Level Poetry Recitation — School Stage',
      description: '10 poems memorized and recited. Awarded Bronze Poetry Recitation Shield by Dr. Liliana Worth.',
      storage_path: `videos/${SCHOOL_ID}/${STUDENT_ID}/gr3-poetry-recitation.mp4`,
      external_url: null,
      thumbnail_path: null,
      recorded_at: '2026-01-10',
      academic_year: '2025-2026',
    },
  ])

  console.log('\nSeed complete.')
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
