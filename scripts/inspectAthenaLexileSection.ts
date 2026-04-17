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

  console.log('=== 5. Athena Lexile assessment row ===')
  const { data: lex, error: lexErr } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', ATHENA)
    .eq('assessment_type', 'lexile')
  if (lexErr) console.error(lexErr)
  console.log('row count:', lex?.length ?? 0)
  for (const r of lex ?? []) console.log(JSON.stringify(r, null, 2))

  console.log('\n=== 6a. Athena spring profile id ===')
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, term, season, status, academic_year_id')
    .eq('student_id', ATHENA)
    .eq('season', 'spring')
    .maybeSingle()
  if (profileErr) console.error(profileErr)
  console.log(JSON.stringify(profile, null, 2))

  if (!profile?.id) { console.log('(no profile — cannot fetch sections)'); return }

  console.log('\n=== 6b. Athena Lexile profile_section ===')
  const { data: section, error: secErr } = await supabaseAdmin
    .from('profile_sections')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('section_kind', 'lexile')
  if (secErr) console.error(secErr)
  console.log('row count:', section?.length ?? 0)
  for (const r of section ?? []) console.log(JSON.stringify(r, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
