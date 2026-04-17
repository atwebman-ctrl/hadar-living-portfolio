// scripts/inspectProfileState.ts — read profiles / academic_years /
// profile_sections state for a given student. Usage:
//   npx tsx scripts/inspectProfileState.ts <studentId>

import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const HADAR_SCHOOL_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

async function main() {
  const studentId = process.argv[2]
  if (!studentId) {
    console.error('Usage: npx tsx scripts/inspectProfileState.ts <studentId>')
    process.exit(1)
  }

  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  console.log(`\n=== profiles for student ${studentId} ===`)
  const profiles = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('student_id', studentId)
  console.log(JSON.stringify(profiles.data, null, 2))
  if (profiles.error) console.error(profiles.error)

  console.log(`\n=== academic_years for school ${HADAR_SCHOOL_ID} ===`)
  const years = await supabaseAdmin
    .from('academic_years')
    .select('*')
    .eq('school_id', HADAR_SCHOOL_ID)
  console.log(JSON.stringify(years.data, null, 2))
  if (years.error) console.error(years.error)

  console.log(`\n=== profile_sections (first 20 for this student's profiles) ===`)
  const profileIds = (profiles.data ?? []).map((p) => p.id as string)
  if (profileIds.length === 0) {
    console.log('No profiles → no sections to fetch. Showing first 5 sections globally instead:')
    const sections = await supabaseAdmin
      .from('profile_sections')
      .select('*')
      .limit(5)
    console.log(JSON.stringify(sections.data, null, 2))
    if (sections.error) console.error(sections.error)
  } else {
    const sections = await supabaseAdmin
      .from('profile_sections')
      .select('*')
      .in('profile_id', profileIds)
      .order('section_order', { ascending: true })
    console.log(`(${sections.data?.length ?? 0} rows)`)
    console.log(JSON.stringify(sections.data, null, 2))
    if (sections.error) console.error(sections.error)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
