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
  const { data, error } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .in('assessment_type', ['maps_math', 'maps_english'])
    .order('academic_year')
    .order('term')
  if (error) console.error(error)
  console.log('row count:', data?.length ?? 0)
  for (const r of data ?? []) console.log(JSON.stringify(r, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
