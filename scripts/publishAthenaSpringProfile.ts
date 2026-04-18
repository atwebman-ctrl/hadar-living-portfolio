import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const PROFILE_ID = '8f0977a7-9ace-46ab-928f-c5d11bc1ca66'
const REVIEWER   = 'user_3BuBjWlOI78XmV23SLXxVWJbvqE'

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  console.log('=== BEFORE ===')
  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('profiles')
    .select('id, status, season, term, published_at, drafted_by, reviewed_by')
    .eq('id', PROFILE_ID)
    .single()
  if (beforeErr) { console.error(beforeErr); process.exit(1) }
  console.log(before)

  const nowIso = new Date().toISOString()
  const { error: updErr } = await supabaseAdmin
    .from('profiles')
    .update({
      status:       'published',
      published_at: nowIso,
      reviewed_by:  REVIEWER,
      updated_at:   nowIso,
      updated_by:   REVIEWER,
    })
    .eq('id', PROFILE_ID)
  if (updErr) { console.error(updErr); process.exit(1) }

  console.log('\n=== AFTER ===')
  const { data: after } = await supabaseAdmin
    .from('profiles')
    .select('id, status, season, term, published_at, drafted_by, reviewed_by')
    .eq('id', PROFILE_ID)
    .single()
  console.log(after)
  console.log(after?.status === 'published' && after?.published_at ? '✓ PUBLISHED' : '✗ NOT PUBLISHED')
}

main().catch((e) => { console.error(e); process.exit(1) })
