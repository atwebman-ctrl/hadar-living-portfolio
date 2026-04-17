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
    .select('id, name, slug, clerk_org_id')

  console.log('All schools:')
  console.log(JSON.stringify(data, null, 2))
  console.log('error:', error)
}

main().catch((e) => { console.error(e); process.exit(1) })
