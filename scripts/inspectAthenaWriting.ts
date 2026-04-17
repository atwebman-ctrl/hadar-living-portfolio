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

  console.log('=== profile_section_attachments (any rows?) ===')
  const att = await supabaseAdmin.from('profile_section_attachments').select('*').limit(5)
  console.log('rows:', att.data?.length ?? 0)
  for (const r of att.data ?? []) console.log(JSON.stringify(r))

  console.log('\n=== Athena writing_samples ===')
  const ws = await supabaseAdmin
    .from('writing_samples')
    .select('*')
    .eq('student_id', ATHENA)
    .is('deleted_at', null)
  console.log('rows:', ws.data?.length ?? 0)
  for (const r of ws.data ?? []) console.log(JSON.stringify(r))
}

main().catch((e) => { console.error(e); process.exit(1) })
