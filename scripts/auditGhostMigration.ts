import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const tables = ['students', 'character_awards', 'readings', 'writing_samples', 'teacher_notes', 'student_videos']
const columns = ['deleted_at', 'created_by', 'updated_by', 'updated_at']

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  console.log('Auditing which tables have which 0012 columns...\n')

  for (const table of tables) {
    console.log(`--- ${table} ---`)
    for (const column of columns) {
      const { error } = await supabaseAdmin
        .from(table)
        .select(column)
        .limit(1)
      if (error && error.code === '42703') {
        console.log(`  ✗ ${column} — MISSING`)
      } else if (error) {
        console.log(`  ? ${column} — error: ${error.code} ${error.message}`)
      } else {
        console.log(`  ✓ ${column} — exists`)
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
