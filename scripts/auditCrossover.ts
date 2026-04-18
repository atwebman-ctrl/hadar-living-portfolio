import { existsSync, readFileSync } from 'node:fs'
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/)
    if (m) process.env[m[1]] ??= m[2]
  }
}

const ATHENA = 'b1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'
const HADAR  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

function header(s: string) {
  console.log('\n=== ' + s + ' ===')
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin')

  // 1. readings
  header('1. readings')
  {
    const { data, error } = await supabaseAdmin
      .from('readings')
      .select('id, title, author, completed, date_started, date_finished')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
      .order('date_finished', { ascending: false, nullsFirst: false })
    if (error) console.log('ERROR:', error.message)
    console.log('count:', data?.length ?? 0)
    for (const r of (data ?? []).slice(0, 5)) {
      console.log(`  - "${r.title}" by ${r.author ?? '?'} | completed=${r.completed} | finished=${r.date_finished}`)
    }
  }

  // 2. assessments by type
  header('2. assessments')
  for (const t of ['maps_math', 'maps_english', 'lexile',
                   'avant_speaking', 'avant_reading', 'avant_listening', 'avant_writing']) {
    const { data, error } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('student_id', ATHENA)
      .eq('assessment_type', t)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) { console.log(`  ${t}: ERROR ${error.message}`); continue }
    const latest = data?.[0]
    let line = `  ${t}: count=${data?.length ?? 0}`
    if (latest) {
      if (t.startsWith('maps_')) {
        line += ` | latest rit=${latest.rit_score} pct=${latest.percentile} term=${latest.term} ay=${latest.academic_year}`
      } else if (t === 'lexile') {
        line += ` | lexile_value=${latest.lexile_value} term=${latest.term}`
      } else {
        line += ` | latest score=${latest.score} term=${latest.term}`
      }
    }
    console.log(line)
  }
  // also: any avant-typed rows that don't fit the four explicit names?
  {
    const { data } = await supabaseAdmin
      .from('assessments')
      .select('assessment_type')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
      .like('assessment_type', '%avant%')
    const types = new Set((data ?? []).map(r => r.assessment_type))
    console.log('  distinct avant-like assessment_type values seen:', [...types])
  }

  // 3. writing_samples by language
  header('3. writing_samples')
  for (const lang of ['english', 'hebrew']) {
    const { data, error } = await supabaseAdmin
      .from('writing_samples')
      .select('id, title, language, term, academic_year')
      .eq('student_id', ATHENA)
      .eq('language', lang)
      .is('deleted_at', null)
    if (error) { console.log(`  ${lang}: ERROR ${error.message}`); continue }
    console.log(`  ${lang}: count=${data?.length ?? 0}`)
    for (const w of data ?? []) console.log(`    - "${w.title ?? '(untitled)'}" term=${w.term} ay=${w.academic_year}`)
  }
  // null language?
  {
    const { data } = await supabaseAdmin
      .from('writing_samples')
      .select('id, title, language')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
      .is('language', null)
    console.log(`  language IS NULL: count=${data?.length ?? 0}`)
  }

  // 4. character_awards
  header('4. character_awards')
  {
    const { data, error } = await supabaseAdmin
      .from('character_awards')
      .select('*')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    if (error) console.log('ERROR:', error.message)
    console.log('count:', data?.length ?? 0)
    for (const a of data ?? []) {
      console.log(`  - ${a.virtue_transliteration ?? a.virtue_english ?? '(unnamed)'} | award_date=${a.award_date}`)
    }
  }

  // 5. teacher_notes
  header('5. teacher_notes')
  {
    const { data, error } = await supabaseAdmin
      .from('teacher_notes')
      .select('*')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    if (error) console.log('ERROR:', error.message)
    console.log('total count:', data?.length ?? 0)
    const byAuthor: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    for (const n of data ?? []) {
      const author = (n.author_name ?? n.author_clerk_user_id ?? 'unknown') as string
      byAuthor[author] = (byAuthor[author] ?? 0) + 1
      const cat = (n.section_category ?? 'NULL') as string
      byCategory[cat] = (byCategory[cat] ?? 0) + 1
    }
    console.log('by author:', byAuthor)
    console.log('by section_category:', byCategory)
  }

  // 6. student_videos
  header('6. student_videos')
  {
    const { data, error } = await supabaseAdmin
      .from('student_videos')
      .select('*')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    if (error) console.log('ERROR:', error.message)
    console.log('count:', data?.length ?? 0)
    const byCat: Record<string, number> = {}
    for (const v of data ?? []) {
      const c = (v.category ?? 'NULL') as string
      byCat[c] = (byCat[c] ?? 0) + 1
    }
    console.log('by category:', byCat)
  }

  // 7-10. simple counts
  for (const t of ['parent_uploads', 'handwriting_samples', 'photos', 'report_cards']) {
    const { data, error } = await supabaseAdmin
      .from(t)
      .select('id', { count: 'exact' })
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    header(`${t}`)
    if (error) console.log('ERROR:', error.message); else console.log('count:', data?.length ?? 0)
  }

  // 11. profiles
  header('11. profiles (Profile Builder)')
  {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    if (error) console.log('ERROR:', error.message)
    console.log('count:', data?.length ?? 0)
    const byStatus: Record<string, number> = {}
    for (const p of data ?? []) {
      const s = (p.status ?? 'NULL') as string
      byStatus[s] = (byStatus[s] ?? 0) + 1
      console.log(`  - id=${p.id} season=${p.season} status=${p.status} term=${p.term}`)
    }
    console.log('by status:', byStatus)
  }

  // 12. profile_sections (need profile ids first)
  header('12. profile_sections')
  {
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id, season')
      .eq('student_id', ATHENA)
      .is('deleted_at', null)
    const profIds = (profs ?? []).map(p => p.id)
    if (profIds.length === 0) {
      console.log('no profiles for Athena → no sections to fetch')
    } else {
      const { data, error } = await supabaseAdmin
        .from('profile_sections')
        .select('*')
        .in('profile_id', profIds)
        .is('deleted_at', null)
      if (error) console.log('ERROR:', error.message)
      console.log('count:', data?.length ?? 0)
      const byKind: Record<string, number> = {}
      const byStatus: Record<string, number> = {}
      for (const s of data ?? []) {
        const k = s.section_kind as string
        byKind[k] = (byKind[k] ?? 0) + 1
        const st = (s.status ?? 'NULL') as string
        byStatus[st] = (byStatus[st] ?? 0) + 1
      }
      console.log('by section_kind:', byKind)
      console.log('by status:', byStatus)
    }
  }

  // 13. ai_drafts
  header('13. ai_drafts')
  {
    const { data, error } = await supabaseAdmin
      .from('ai_drafts')
      .select('id, section_type, status')
      .eq('student_id', ATHENA)
    if (error) console.log('ERROR:', error.message)
    console.log('count:', data?.length ?? 0)
    const byStatus: Record<string, number> = {}
    for (const d of data ?? []) {
      const s = (d.status ?? 'NULL') as string
      byStatus[s] = (byStatus[s] ?? 0) + 1
    }
    console.log('by status:', byStatus)
  }

  // 14. scope_and_sequence
  header('14. scope_and_sequence')
  {
    const { data, error } = await supabaseAdmin
      .from('scope_and_sequence')
      .select('id')
      .eq('school_id', HADAR)
    if (error) console.log('ERROR:', error.message)
    console.log('school-wide count:', data?.length ?? 0)
  }

  // legacy `videos` table (queried by getStudentPortfolio.ts:129)
  header('LEGACY: videos table')
  {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('id')
      .eq('student_id', ATHENA)
    if (error) console.log('ERROR (table likely gone):', error.message)
    else console.log('count:', data?.length ?? 0)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
