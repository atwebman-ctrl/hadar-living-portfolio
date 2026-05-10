// ============================================================
// tests/e2e/helpers/seedE2eSchool.ts
//
// Idempotent: ensures the E2E test school exists in local Supabase
// and is linked to the Clerk dev test organization. Called once per
// Playwright run from global.setup.ts before any spec runs.
//
// Role resolution flows entirely through Clerk's org roles
// (org:admin / org:teacher / org:parent) — no school_members rows
// are required as long as the test users were assigned roles in
// the Clerk dashboard during setup.
// ============================================================

import { createClient } from '@supabase/supabase-js'

export interface E2eSchool {
  id:           string
  clerkOrgId:   string
  alreadyExisted: boolean
}

export async function seedE2eSchool(): Promise<E2eSchool> {
  const url   = required('NEXT_PUBLIC_SUPABASE_URL')
  const key   = required('SUPABASE_SERVICE_ROLE_KEY')
  const orgId = required('E2E_CLERK_ORG_ID')
  const slug  = process.env.E2E_CLERK_ORG_SLUG ?? 'e2e-test-school'

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Lookup existing — if present, nothing to do.
  const { data: existing, error: lookupErr } = await client
    .from('schools')
    .select('id')
    .eq('clerk_org_id', orgId)
    .maybeSingle()
  if (lookupErr) throw new Error(`seedE2eSchool lookup failed: ${lookupErr.message}`)

  if (existing) {
    return { id: existing.id, clerkOrgId: orgId, alreadyExisted: true }
  }

  // Create. Reasonable defaults — the spec will create everything else
  // it needs (students, profiles) under this school_id.
  const { data: created, error: insertErr } = await client
    .from('schools')
    .insert({
      clerk_org_id:        orgId,
      name:                'E2E Test School',
      slug,
      pedagogical_schools: [],
      third_languages:     [{ code: 'hebrew', label: 'Hebrew', hasAvantNorms: true }],
    })
    .select('id')
    .single()
  if (insertErr || !created) {
    throw new Error(`seedE2eSchool insert failed: ${insertErr?.message ?? 'no row'}`)
  }

  return { id: created.id, clerkOrgId: orgId, alreadyExisted: false }
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}
