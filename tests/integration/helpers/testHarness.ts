// ============================================================
// tests/integration/helpers/testHarness.ts
//
// Shared helpers for integration tests that hit the local
// Supabase container. Each test gets a fresh service-role
// client via `adminClient()`; schools/students can be seeded
// and torn down with the helpers below.
//
// Everything here assumes the production guard in
// vitest.integration.setup.ts has already run — so URLs / keys
// pointing at prod would have killed the process already.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

let cached: SupabaseClient | null = null

export function adminClient(): SupabaseClient {
  if (cached) return cached
  const url = required('NEXT_PUBLIC_SUPABASE_URL')
  const key = required('SUPABASE_SERVICE_ROLE_KEY')
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export interface SeededSchool {
  id: string
  clerkOrgId: string
  name: string
  slug: string
}

export async function seedSchool(name = `Test School ${shortId()}`): Promise<SeededSchool> {
  const id = randomUUID()
  const clerkOrgId = `org_test_${shortId()}`
  const slug = `test-${shortId()}`
  const { error } = await adminClient()
    .from('schools')
    .insert({
      id,
      clerk_org_id: clerkOrgId,
      name,
      slug,
      pedagogical_schools: [],
    })
  if (error) throw new Error(`seedSchool failed: ${error.message}`)
  return { id, clerkOrgId, name, slug }
}

export async function deleteSchool(schoolId: string): Promise<void> {
  // on delete restrict means child rows must go first. The smoke test
  // doesn't create any, but leave a hook for future tests to extend.
  const { error } = await adminClient().from('schools').delete().eq('id', schoolId)
  if (error) throw new Error(`deleteSchool failed: ${error.message}`)
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8)
}
