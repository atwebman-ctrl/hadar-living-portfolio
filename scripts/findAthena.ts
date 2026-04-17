// scripts/findAthena.ts — one-off lookup for Athena's UUID.
// Usage: npx tsx scripts/findAthena.ts

import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const HADAR_SCHOOL_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name')
    .eq('school_id', HADAR_SCHOOL_ID)
    .eq('first_name', 'Athena')
    .maybeSingle()

  if (error) {
    console.error('Query error:', error)
    process.exit(1)
  }
  if (!data) {
    console.log('No student named Athena found at Hadar.')
    // Show what students do exist so we can pick one to test with
    const { data: all } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('school_id', HADAR_SCHOOL_ID)
      .limit(20)
    console.log('Available students at Hadar:', all)
    process.exit(0)
  }

  console.log('Athena found:')
  console.log(JSON.stringify(data, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
