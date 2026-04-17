import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const athenaId = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'
const hadarSchoolId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // 1. academic_years row for 2025-2026
  const { data: ay } = await supabaseAdmin
    .from('academic_years')
    .select('*')
    .eq('school_id', hadarSchoolId)
    .eq('label', '2025-2026')

  console.log('academic_years:', JSON.stringify(ay, null, 2))

  // 2. Profile row for Athena, spring
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('student_id', athenaId)
    .eq('season', 'spring')

  console.log('\nprofiles:', JSON.stringify(profiles, null, 2))

  // 3. Profile sections for that profile
  if (profiles && profiles.length > 0) {
    const { data: sections } = await supabaseAdmin
      .from('profile_sections')
      .select('section_kind, section_order, is_required, status')
      .eq('profile_id', profiles[0].id)
      .order('section_order')

    console.log('\nprofile_sections count:', sections?.length)
    console.log('profile_sections:', JSON.stringify(sections, null, 2))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
