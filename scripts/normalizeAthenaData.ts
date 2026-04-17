import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const ATHENA_ID = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'
const UPDATED_BY = 'normalize-script'

const TERM_MAP: Record<string, string> = {
  "Feb '24": 'Feb 2024',
  "May '24": 'May 2024',
  "Aug '24": 'Aug 2024',
  "Nov '24": 'Nov 2024',
  "Jan '25": 'Jan 2025',
  "May '25": 'May 2025',
  "Aug '25": 'Aug 2025',
  "Jan '26": 'Jan 2026',
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // ============================================================
  // FIX 1: Term string normalization across all assessments
  // ============================================================
  console.log('=== FIX 1: Term string normalization ===\n')

  const { data: termRows, error: termSelErr } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term')
    .eq('student_id', ATHENA_ID)
    .in('term', Object.keys(TERM_MAP))
  if (termSelErr) throw termSelErr

  console.log(`rows to normalize: ${termRows?.length ?? 0}\n`)

  for (const row of termRows ?? []) {
    const r = row as { id: string; assessment_type: string; term: string }
    const newTerm = TERM_MAP[r.term]
    if (!newTerm) {
      console.log(`SKIP id=${r.id} term="${r.term}" (no mapping)`)
      continue
    }
    console.log(`assessments id=${r.id} type=${r.assessment_type} term: "${r.term}" → "${newTerm}"`)
    const { error: updErr } = await supabaseAdmin
      .from('assessments')
      .update({ term: newTerm, updated_at: new Date().toISOString(), updated_by: UPDATED_BY })
      .eq('id', r.id)
    if (updErr) {
      console.error(`  ERROR updating id=${r.id}:`, updErr)
      throw updErr
    }
  }

  // Verify no short-form terms remain (term contains a single-quote char)
  const { data: stragglers, error: strErr } = await supabaseAdmin
    .from('assessments')
    .select('id, term')
    .eq('student_id', ATHENA_ID)
    .like('term', "%'%")
  if (strErr) throw strErr
  console.log(`\nverification: rows still containing apostrophe in term: ${stragglers?.length ?? 0}`)
  for (const s of stragglers ?? []) {
    console.log(`  STRAGGLER: ${JSON.stringify(s)}`)
  }

  // ============================================================
  // FIX 2: Lexile value format
  // ============================================================
  // LEXILE NOTE:
  // Updating lexile_value from point ("1225L") to range ("1150L-1300L")
  // to match Athena's PDF and the mockup's rendering of the Lexile section.
  // Going forward, store Lexile as a range-string.
  //
  // Caveat from Tayler (Apr 16 2026): Lexile may be de-emphasized or
  // moved to optional in the final product. She's flagged that the
  // score matters less than she initially thought. Don't over-invest
  // in Lexile-specific UI polish until this settles.
  console.log('\n=== FIX 2: Lexile value format ===\n')

  const { data: lexBefore, error: lexBeforeErr } = await supabaseAdmin
    .from('assessments')
    .select('id, term, lexile_value, notes')
    .eq('student_id', ATHENA_ID)
    .eq('assessment_type', 'lexile')
  if (lexBeforeErr) throw lexBeforeErr

  console.log('before:')
  for (const r of lexBefore ?? []) console.log(`  ${JSON.stringify(r)}`)

  for (const r of lexBefore ?? []) {
    const row = r as { id: string; lexile_value: string | null }
    if (row.lexile_value === '1150L-1300L') {
      console.log(`  (id=${row.id} already normalized — skipping)`)
      continue
    }
    const { error: updErr } = await supabaseAdmin
      .from('assessments')
      .update({ lexile_value: '1150L-1300L', updated_at: new Date().toISOString(), updated_by: UPDATED_BY })
      .eq('id', row.id)
    if (updErr) throw updErr
  }

  const { data: lexAfter, error: lexAfterErr } = await supabaseAdmin
    .from('assessments')
    .select('id, term, lexile_value, notes')
    .eq('student_id', ATHENA_ID)
    .eq('assessment_type', 'lexile')
  if (lexAfterErr) throw lexAfterErr

  console.log('after:')
  for (const r of lexAfter ?? []) console.log(`  ${JSON.stringify(r)}`)

  // ============================================================
  // FIX 3: Reading title
  // ============================================================
  console.log('\n=== FIX 3: Reading title (Aladdin) ===\n')

  const { data: readBefore, error: readBeforeErr } = await supabaseAdmin
    .from('readings')
    .select('id, title, completed')
    .eq('student_id', ATHENA_ID)
    .like('title', 'Aladdin%')
  if (readBeforeErr) throw readBeforeErr

  console.log('before:')
  for (const r of readBefore ?? []) console.log(`  ${JSON.stringify(r)}`)

  const targetTitle = 'Aladdin & other Stories from the Arabian Nights'
  for (const r of readBefore ?? []) {
    const row = r as { id: string; title: string }
    if (row.title === targetTitle) {
      console.log(`  (id=${row.id} already normalized — skipping)`)
      continue
    }
    const { error: updErr } = await supabaseAdmin
      .from('readings')
      .update({ title: targetTitle, updated_at: new Date().toISOString(), updated_by: UPDATED_BY })
      .eq('id', row.id)
    if (updErr) throw updErr
  }

  const { data: readAfter, error: readAfterErr } = await supabaseAdmin
    .from('readings')
    .select('id, title, completed')
    .eq('student_id', ATHENA_ID)
    .like('title', 'Aladdin%')
  if (readAfterErr) throw readAfterErr

  console.log('after:')
  for (const r of readAfter ?? []) console.log(`  ${JSON.stringify(r)}`)

  console.log('\n=== DONE ===')
}

main().catch((e) => { console.error(e); process.exit(1) })
