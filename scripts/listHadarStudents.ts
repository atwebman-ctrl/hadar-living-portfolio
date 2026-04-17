import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  const hadarSchoolId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

  // Note: deleted_at column missing from students in production (ghost migration 0012)
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name, grade_level')
    .eq('school_id', hadarSchoolId)
    .order('last_name')

  console.log('Hadar students:')
  console.log(JSON.stringify(data, null, 2))
  console.log('error:', error)
}

main().catch((e) => { console.error(e); process.exit(1) })
