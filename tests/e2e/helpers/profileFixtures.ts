// ============================================================
// tests/e2e/helpers/profileFixtures.ts
//
// Service-role helpers that seed and tear down the rows the
// Profile Builder happy-path E2E spec needs:
//
//   academic_years  ← upserted (re-uses an existing matching row)
//   students        ← unique per run (fresh suffix)
//   parent_students ← pre-linked to the parent test user so the
//                     dashboard's email-match step is skipped
//   profiles        ← created in `in_review` status, ready for
//                     the admin to approve via UI
//   profile_sections← all 9 required kinds inserted with
//                     status='complete' and a placeholder narrative
//
// Cleanup deletes everything except the academic_year (which may
// be shared with other fixtures or runs).
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

// Mirror of REQUIRED_SECTION_KINDS in lib/types/profileBuilder.ts.
// Kept in sync manually so this file has no `lib/` import (E2E
// helpers run outside the Next build and shouldn't pull app code).
const REQUIRED_SECTION_KINDS = [
  'character_middot',
  'canon_reading',
  'english_composition',
  'avant_hebrew',
  'hebrew_comparison',
  'hebrew_composition',
  'poetry_recitation',
  'lexile',
  'maps_scores',
] as const

export interface ProfileFixture {
  studentId:       string
  studentLastName: string
  profileId:       string
  academicYearId:  string
  parentLinkId:    string
}

export interface SeedReadyProfileOpts {
  schoolId:          string
  parentClerkUserId: string
  parentEmail:       string
}

export async function seedReadyProfile(opts: SeedReadyProfileOpts): Promise<ProfileFixture> {
  const c = client()
  const label = '2025-2026'

  // 1. Academic year — upsert by (school_id, label).
  let academicYearId: string
  const { data: existingYear, error: yearLookupErr } = await c
    .from('academic_years')
    .select('id')
    .eq('school_id', opts.schoolId)
    .eq('label', label)
    .maybeSingle()
  if (yearLookupErr) throw new Error(`academic_year lookup: ${yearLookupErr.message}`)
  if (existingYear?.id) {
    academicYearId = existingYear.id as string
  } else {
    const { data: created, error: yearInsertErr } = await c
      .from('academic_years')
      .insert({
        school_id:  opts.schoolId,
        label,
        start_date: '2025-08-01',
        end_date:   '2026-06-30',
        is_current: true,
      })
      .select('id')
      .single()
    if (yearInsertErr || !created) throw new Error(`academic_year insert: ${yearInsertErr?.message}`)
    academicYearId = created.id as string
  }

  // 2. Student — fresh per run (suffix in last_name keeps it unique).
  const suffix = Date.now().toString(36)
  const studentId = randomUUID()
  const studentLastName = `E2E-${suffix}`
  const { error: stuErr } = await c
    .from('students')
    .insert({
      id:                studentId,
      school_id:         opts.schoolId,
      first_name:        'Athena',
      last_name:         studentLastName,
      grade_level:       '3',
      enrollment_status: 'active',
      academic_year:     label,
    })
  if (stuErr) throw new Error(`student insert: ${stuErr.message}`)

  // 3. Parent link — pre-set parent_clerk_user_id and active status so
  // the dashboard's email-match-and-flip step is unnecessary.
  const { data: parentLink, error: linkErr } = await c
    .from('parent_students')
    .insert({
      school_id:            opts.schoolId,
      student_id:           studentId,
      parent_clerk_user_id: opts.parentClerkUserId,
      invited_email:        opts.parentEmail.toLowerCase(),
      status:               'active',
    })
    .select('id')
    .single()
  if (linkErr || !parentLink) throw new Error(`parent_students insert: ${linkErr?.message}`)

  // 4. Profile — `in_review` so the admin sees it in the queue immediately.
  const profileId = randomUUID()
  const { error: profErr } = await c
    .from('profiles')
    .insert({
      id:               profileId,
      school_id:        opts.schoolId,
      student_id:       studentId,
      academic_year_id: academicYearId,
      term:             'Spring',
      season:           'spring',
      status:           'in_review',
      drafted_by:       'e2e-fixture',
    })
  if (profErr) throw new Error(`profile insert: ${profErr.message}`)

  // 5. Sections — all 9 required kinds, each marked complete with a stub
  // narrative so the admin's preview render has something to display.
  const sectionRows = REQUIRED_SECTION_KINDS.map((kind, idx) => ({
    profile_id:     profileId,
    school_id:      opts.schoolId,
    section_kind:   kind,
    section_order:  idx,
    is_required:    true,
    status:         'complete',
    narrative_text: `E2E narrative placeholder for ${kind}.`,
  }))
  const { error: secErr } = await c.from('profile_sections').insert(sectionRows)
  if (secErr) throw new Error(`profile_sections insert: ${secErr.message}`)

  return { studentId, studentLastName, profileId, academicYearId, parentLinkId: parentLink.id as string }
}

export async function cleanupProfileFixture(fx: ProfileFixture): Promise<void> {
  const c = client()
  // profile cascades to profile_sections + attachments (on delete cascade),
  // so deleting the profile is enough for the Builder rows.
  await c.from('profiles').delete().eq('id', fx.profileId)
  await c.from('parent_students').delete().eq('id', fx.parentLinkId)
  await c.from('students').delete().eq('id', fx.studentId)
  // academic_years is intentionally left in place — shared across runs.
}

function client() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}
