// ============================================================
// tests/integration/smoke.test.ts
//
// Integration smoke: confirms we can reach the local Supabase
// container, insert a school via the service-role key, read it
// back, and clean it up. If this passes, the full integration
// harness is wired up correctly.
// ============================================================

import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, seedSchool, deleteSchool } from './helpers/testHarness'

describe('integration smoke', () => {
  const toCleanup: string[] = []

  afterAll(async () => {
    for (const id of toCleanup) await deleteSchool(id).catch(() => {})
  })

  it('connects to local Supabase', async () => {
    const { data, error } = await adminClient().from('schools').select('id').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('seeds and reads back a school', async () => {
    const school = await seedSchool('Smoke Test School')
    toCleanup.push(school.id)

    const { data, error } = await adminClient()
      .from('schools')
      .select('id, name, clerk_org_id, pedagogical_schools')
      .eq('id', school.id)
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBe(school.id)
    expect(data?.name).toBe('Smoke Test School')
    expect(data?.pedagogical_schools).toEqual([])
  })
})
