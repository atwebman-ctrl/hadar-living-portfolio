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

  console.log('=== STAMP / hebrew_comparison probe ===')
  const stamp = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .or('assessment_type.eq.avant_stamp,assessment_type.eq.hebrew_comparison')
  console.log('rows:', stamp.data?.length ?? 0)
  for (const r of stamp.data ?? []) console.log(JSON.stringify(r))

  console.log('\n=== Notes containing STAMP ===')
  const stampNotes = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, notes')
    .eq('student_id', ATHENA)
    .ilike('notes', '%STAMP%')
  console.log('rows:', stampNotes.data?.length ?? 0)
  for (const r of stampNotes.data ?? []) console.log(JSON.stringify(r))

  console.log('\n=== All distinct assessment_types for Athena ===')
  const all = await supabaseAdmin
    .from('assessments')
    .select('assessment_type')
    .eq('student_id', ATHENA)
  const types = new Set((all.data ?? []).map((r) => r.assessment_type))
  console.log([...types].sort())

  console.log('\n=== Readings for Athena ===')
  const readings = await supabaseAdmin
    .from('readings')
    .select('*')
    .eq('student_id', ATHENA)
    .is('deleted_at', null)
  console.log('rows:', readings.data?.length ?? 0)
  for (const r of readings.data ?? []) console.log(JSON.stringify(r))
}

main().catch((e) => { console.error(e); process.exit(1) })
