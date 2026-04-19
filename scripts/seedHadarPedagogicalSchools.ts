import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const HADAR_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

const PEDAGOGICAL_SCHOOLS = [
  {
    id: 'lower',
    label: 'Lower School',
    grades: ['k', '1', '2', '3', '4', '5'],
    order: 0,
  },
]

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('schools')
    .select('id, name, pedagogical_schools')
    .eq('id', HADAR_ID)
    .single()

  console.log('BEFORE:')
  console.log(JSON.stringify(before, null, 2))
  if (beforeErr) {
    console.error('Read failed:', beforeErr)
    process.exit(1)
  }

  const { error: updateErr } = await supabaseAdmin
    .from('schools')
    .update({ pedagogical_schools: PEDAGOGICAL_SCHOOLS })
    .eq('id', HADAR_ID)

  if (updateErr) {
    console.error('Update failed:', updateErr)
    process.exit(1)
  }

  const { data: after, error: afterErr } = await supabaseAdmin
    .from('schools')
    .select('id, name, pedagogical_schools')
    .eq('id', HADAR_ID)
    .single()

  console.log('\nAFTER:')
  console.log(JSON.stringify(after, null, 2))
  if (afterErr) console.error('Re-read failed:', afterErr)
}

main().catch((e) => { console.error(e); process.exit(1) })
