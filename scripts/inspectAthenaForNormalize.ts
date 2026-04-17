import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const ATHENA = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // 1a. AVANT rows
  console.log('=== 1a. AVANT rows for Athena ===')
  const { data: avantRows, error: avantErr } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term, academic_year, score, rit_score, percentile, created_at')
    .eq('student_id', ATHENA)
    .like('assessment_type', 'avant%')
    .order('academic_year')
    .order('term')
    .order('assessment_type')
  if (avantErr) console.error('avant error:', avantErr)
  console.log('row count:', avantRows?.length ?? 0)
  for (const r of avantRows ?? []) {
    console.log(JSON.stringify(r))
  }

  // 1b. column types via information_schema
  console.log('\n=== 1b. assessments column types (lexile_value, score, rit_score, percentile) ===')
  const { data: cols, error: colsErr } = await supabaseAdmin
    .rpc('exec_sql', {
      sql: `select column_name, data_type, is_nullable, character_maximum_length
            from information_schema.columns
            where table_name = 'assessments'
              and column_name in ('lexile_value', 'score', 'rit_score', 'percentile')`,
    })
    .then(
      (r) => r,
      (e) => ({ data: null, error: e }),
    )
  if (colsErr || !cols) {
    console.log('(rpc exec_sql unavailable — falling back to probe)')
    // Probe via a sample row's column presence and JS typeof
    const { data: sample } = await supabaseAdmin
      .from('assessments')
      .select('lexile_value, score, rit_score, percentile')
      .limit(1)
    console.log('sample row keys:', sample && sample[0] ? Object.keys(sample[0]) : '(no rows)')
    if (sample && sample[0]) {
      const row = sample[0] as Record<string, unknown>
      for (const k of ['lexile_value', 'score', 'rit_score', 'percentile']) {
        console.log(`  ${k}: value=${JSON.stringify(row[k])}, typeof=${typeof row[k]}`)
      }
    }
  } else {
    console.log(JSON.stringify(cols, null, 2))
  }

  // 1c. Lexile row
  console.log('\n=== 1c. Lexile row(s) for Athena ===')
  const { data: lexRows, error: lexErr } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term, academic_year, lexile_value, score, notes')
    .eq('student_id', ATHENA)
    .eq('assessment_type', 'lexile')
  if (lexErr) console.error('lexile error:', lexErr)
  console.log('row count:', lexRows?.length ?? 0)
  for (const r of lexRows ?? []) {
    console.log(JSON.stringify(r, null, 2))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
