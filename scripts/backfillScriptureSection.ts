// ============================================================
// scripts/backfillScriptureSection.ts
//
// One-off: insert a 'scripture' profile_sections row into every
// existing profile that doesn't already have one. Status is
// seeded 'complete' to match the new auto-seed behavior — the
// section renders a placeholder card and does not block
// submit-for-review.
//
// Idempotent: skips profiles that already have a scripture row.
//
// Run with: npx tsx scripts/backfillScriptureSection.ts
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Fetch every non-deleted profile.
  const { data: profiles, error: profileErr } = await admin
    .from('profiles')
    .select('id, school_id')
    .is('deleted_at', null)

  if (profileErr) {
    console.error('Failed to list profiles:', profileErr)
    process.exit(1)
  }
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found.')
    return
  }

  console.log(`Found ${profiles.length} profile(s). Checking for missing scripture sections...`)

  let inserted = 0
  let skipped = 0

  for (const profile of profiles) {
    // Already has one?
    const { data: existing } = await admin
      .from('profile_sections')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('section_kind', 'scripture')
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      skipped += 1
      continue
    }

    // Find max section_order so we slot scripture at the end.
    const { data: maxRow } = await admin
      .from('profile_sections')
      .select('section_order')
      .eq('profile_id', profile.id)
      .order('section_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (maxRow?.section_order ?? -1) + 1

    const { error: insertErr } = await admin
      .from('profile_sections')
      .insert({
        profile_id:    profile.id,
        school_id:     profile.school_id,
        section_kind:  'scripture',
        section_order: nextOrder,
        is_required:   true,
        status:        'complete',
        created_by:    'backfill-script',
        updated_by:    'backfill-script',
      })

    if (insertErr) {
      console.error(`Failed to insert scripture row for profile ${profile.id}:`, insertErr)
      continue
    }
    inserted += 1
    console.log(`  + ${profile.id} (order=${nextOrder})`)
  }

  console.log(`\nDone. Inserted: ${inserted}. Already had one: ${skipped}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
