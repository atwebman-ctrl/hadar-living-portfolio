import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  const uuid = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name, school_id, deleted_at')
    .eq('id', uuid)
    .maybeSingle()

  console.log('UUID:', uuid)
  console.log('data:', data)
  console.log('error:', error)
}

main().catch((e) => { console.error(e); process.exit(1) })
