import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const HADAR = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // 1. class_assignments — schema via probe + sample
  console.log('=== 1. class_assignments table ===')
  const { data: ca, error: caErr } = await supabaseAdmin
    .from('class_assignments').select('*').limit(10)
  if (caErr) console.error(caErr)
  console.log('row count:', ca?.length ?? 0)
  if (ca && ca[0]) {
    console.log('columns:', Object.keys(ca[0]))
    console.log('sample:', JSON.stringify(ca[0], null, 2))
  } else {
    console.log('(empty — probing column list)')
    const { data: ca2 } = await supabaseAdmin.from('class_assignments').select('*').limit(0)
    console.log('select returned:', JSON.stringify(ca2))
  }

  console.log('\n=== 2. class_assignments rows (limit 10) ===')
  console.log(JSON.stringify(ca ?? [], null, 2))

  console.log('\n=== 3a. school_members — schema probe ===')
  const { data: sm0 } = await supabaseAdmin.from('school_members').select('*').limit(1)
  console.log('columns:', sm0 && sm0[0] ? Object.keys(sm0[0]) : '(no rows yet — fetching Hadar to learn)')

  console.log('\n=== 3b. school_members for Hadar ===')
  const { data: sm, error: smErr } = await supabaseAdmin
    .from('school_members')
    .select('*')
    .eq('school_id', HADAR)
  if (smErr) console.error(smErr)
  console.log('row count:', sm?.length ?? 0)
  if (sm && sm[0]) console.log('columns:', Object.keys(sm[0]))
  for (const r of sm ?? []) console.log(JSON.stringify(r))
}

main().catch((e) => { console.error(e); process.exit(1) })
