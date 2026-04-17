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
    .select('id, assessment_type, term, academic_year, score, notes, created_at')
    .eq('student_id', ATHENA)
    .like('assessment_type', 'avant%')
    .order('academic_year')
    .order('term')
    .order('assessment_type')
  if (error) console.error(error)
  console.log('row count:', data?.length ?? 0)
  for (const r of data ?? []) console.log(JSON.stringify(r))
}

main().catch((e) => { console.error(e); process.exit(1) })
