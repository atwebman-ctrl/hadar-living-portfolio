import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const ATHENA = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'

// Title → { dateStarted, dateFinished }. Read durations vary per book
// (longer for hefty volumes, shorter for shorter/younger reads).
const FINISHES: Record<string, { started: string; finished: string }> = {
  'Alice in Wonderland':                                { started: '2025-09-02', finished: '2025-09-15' },
  "Grimm's Fairy Tales":                                { started: '2025-09-18', finished: '2025-10-01' },
  'Black Beauty':                                       { started: '2025-10-06', finished: '2025-10-20' },
  'The Snow Queen':                                     { started: '2025-10-25', finished: '2025-11-05' },
  'Charlie and the Chocolate Factory':                  { started: '2025-11-13', finished: '2025-11-25' },
  'The Jungle Book':                                    { started: '2025-12-02', finished: '2025-12-15' },
  'Homer Price':                                        { started: '2025-12-29', finished: '2026-01-10' },
  'Tales from Shakespeare':                             { started: '2026-01-12', finished: '2026-01-25' },
  'Aladdin & other Stories from the Arabian Nights':    { started: '2026-02-02', finished: '2026-02-15' },
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  console.log('=== BEFORE ===')
  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('readings')
    .select('id, sort_order, title, completed, date_started, date_finished')
    .eq('student_id', ATHENA)
    .is('deleted_at', null)
    .order('sort_order')
  if (beforeErr) { console.error(beforeErr); process.exit(1) }
  for (const r of before ?? []) {
    console.log(`  #${r.sort_order} "${r.title}" completed=${r.completed} started=${r.date_started} finished=${r.date_finished}`)
  }

  let updated = 0
  let skippedInProgress = 0
  let skippedNoMatch = 0
  for (const r of before ?? []) {
    if (!r.completed) { skippedInProgress++; continue }
    const dates = FINISHES[r.title as string]
    if (!dates) { skippedNoMatch++; console.log(`  ⚠ no date map for "${r.title}"`); continue }
    const { error } = await supabaseAdmin
      .from('readings')
      .update({
        date_started:  dates.started,
        date_finished: dates.finished,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', r.id)
    if (error) {
      console.log(`  ✗ failed "${r.title}": ${error.message}`)
    } else {
      updated++
    }
  }

  console.log(`\nupdated=${updated} skipped_in_progress=${skippedInProgress} skipped_no_match=${skippedNoMatch}`)

  console.log('\n=== AFTER ===')
  const { data: after } = await supabaseAdmin
    .from('readings')
    .select('id, sort_order, title, completed, date_started, date_finished')
    .eq('student_id', ATHENA)
    .is('deleted_at', null)
    .order('sort_order')
  let withFinish = 0
  let withoutFinish = 0
  for (const r of after ?? []) {
    console.log(`  #${r.sort_order} "${r.title}" completed=${r.completed} started=${r.date_started} finished=${r.date_finished}`)
    if (r.date_finished) withFinish++; else withoutFinish++
  }
  console.log(`\nwith date_finished: ${withFinish}`)
  console.log(`without date_finished: ${withoutFinish}`)
  console.log(withFinish === 9 && withoutFinish === 1 ? '✓ EXPECTED STATE' : '✗ UNEXPECTED STATE')
}

main().catch((e) => { console.error(e); process.exit(1) })
