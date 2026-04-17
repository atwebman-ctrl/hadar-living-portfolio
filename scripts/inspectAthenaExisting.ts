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

  for (const table of ['assessments', 'readings', 'character_awards'] as const) {
    const { data, count } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact' })
      .eq('student_id', ATHENA)
    console.log(`\n=== ${table} for Athena: ${count ?? 0} rows ===`)
    const distinctCreators = Array.from(new Set((data ?? []).map(r => (r as { created_by: string | null }).created_by)))
    console.log('distinct created_by values:', distinctCreators)
    if (table === 'assessments') {
      const distinctTypes = Array.from(new Set((data ?? []).map(r => (r as { assessment_type: string }).assessment_type)))
      console.log('distinct assessment_types:', distinctTypes)
    }
    if (table === 'readings') {
      console.log('titles:', (data ?? []).map(r => (r as { title: string }).title))
    }
    if (table === 'character_awards') {
      console.log('awards:', (data ?? []).map(r => `${(r as { virtue_transliteration: string }).virtue_transliteration} (${(r as { award_date: string }).award_date})`))
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
