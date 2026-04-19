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
  // on delete restrict means child rows must go first. Walk the content
  // tables this harness might have created and soft/hard delete as needed
  // before dropping the school row itself.
  const client = adminClient()

  // profiles cascade to profile_sections + attachments, so clearing
  // profiles is enough for the Builder tables.
  await client.from('profiles').delete().eq('school_id', schoolId)
  // academic_years is a restrict FK from profiles; clear after profiles.
  await client.from('academic_years').delete().eq('school_id', schoolId)
  // students is restrict from profiles/assessments/etc; the Builder flow
  // only creates students, so this is sufficient for the current tests.
  await client.from('students').delete().eq('school_id', schoolId)

  const { error } = await client.from('schools').delete().eq('id', schoolId)
  if (error) throw new Error(`deleteSchool failed: ${error.message}`)
}

export interface SeededStudent {
  id: string
  schoolId: string
  firstName: string
  lastName: string
  gradeLevel: string
  academicYear: string
}

export async function seedStudent(
  schoolId: string,
  opts?: { firstName?: string; lastName?: string; gradeLevel?: string; academicYear?: string },
): Promise<SeededStudent> {
  const id = randomUUID()
  const firstName    = opts?.firstName    ?? 'Test'
  const lastName     = opts?.lastName     ?? `Student-${shortId()}`
  const gradeLevel   = opts?.gradeLevel   ?? '3'
  const academicYear = opts?.academicYear ?? '2025-2026'

  const { error } = await adminClient()
    .from('students')
    .insert({
      id,
      school_id:          schoolId,
      first_name:         firstName,
      last_name:          lastName,
      grade_level:        gradeLevel,
      // Legacy column from migration 0010 — still NOT NULL on existing rows,
      // mirror the new value so inserts from fresh tests succeed.
      grade_level_legacy: gradeLevel,
      academic_year:      academicYear,
    })
  if (error) throw new Error(`seedStudent failed: ${error.message}`)

  return { id, schoolId, firstName, lastName, gradeLevel, academicYear }
}

export function makeAuthContext(opts: {
  userId?: string
  schoolId: string
  role?:    'admin' | 'teacher' | 'parent'
}): { userId: string; schoolId: string; role: 'admin' | 'teacher' | 'parent' } {
  return {
    userId:   opts.userId ?? `test-user-${shortId()}`,
    schoolId: opts.schoolId,
    role:     opts.role ?? 'teacher',
  }
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8)
}
