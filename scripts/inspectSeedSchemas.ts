import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // 1. AVANT convention — distinct assessment_type values
  console.log('=== assessment_type values matching %avant% or %hebrew% ===')
  const { data: avantRows, error: avantErr } = await supabaseAdmin
    .from('assessments')
    .select('assessment_type')
    .or('assessment_type.ilike.%avant%,assessment_type.ilike.%hebrew%')
    .limit(50)
  if (avantErr) console.error(avantErr)
  const distinct = Array.from(new Set((avantRows ?? []).map(r => r.assessment_type)))
  console.log('distinct:', distinct)
  console.log('total matching rows:', avantRows?.length ?? 0)

  // For full context — show ALL distinct assessment_type values in the table
  console.log('\n=== ALL distinct assessment_type values (first 200 rows scanned) ===')
  const { data: allTypes } = await supabaseAdmin
    .from('assessments')
    .select('assessment_type')
    .limit(200)
  console.log(Array.from(new Set((allTypes ?? []).map(r => r.assessment_type))))

  // 2. Readings schema
  console.log('\n=== readings table — first 3 rows (full columns) ===')
  const { data: readings, error: readingsErr } = await supabaseAdmin
    .from('readings')
    .select('*')
    .limit(3)
  if (readingsErr) console.error(readingsErr)
  console.log('row count:', readings?.length ?? 0)
  if (readings && readings.length > 0) {
    console.log('columns:', Object.keys(readings[0]))
    console.log('sample row:', JSON.stringify(readings[0], null, 2))
  } else {
    console.log('(table is empty — probing column list via failing select)')
    // Force the column list to surface by selecting a known-bad column
    const { error: probeErr } = await supabaseAdmin.from('readings').select('__columns_probe__').limit(1)
    console.log('probe error (ignore):', probeErr?.message)
  }

  // 3. character_awards schema
  console.log('\n=== character_awards table — first 3 rows (full columns) ===')
  const { data: awards, error: awardsErr } = await supabaseAdmin
    .from('character_awards')
    .select('*')
    .limit(3)
  if (awardsErr) console.error(awardsErr)
  console.log('row count:', awards?.length ?? 0)
  if (awards && awards.length > 0) {
    console.log('columns:', Object.keys(awards[0]))
    console.log('sample row:', JSON.stringify(awards[0], null, 2))
  } else {
    console.log('(table is empty)')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
