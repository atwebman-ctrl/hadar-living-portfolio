import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('*')
    .eq('id', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
    .single()

  console.log('Hadar schools row:')
  console.log(JSON.stringify(data, null, 2))
  console.log('error:', error)
  if (data) {
    console.log('\nColumns present:')
    console.log(Object.keys(data).sort().join(', '))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
