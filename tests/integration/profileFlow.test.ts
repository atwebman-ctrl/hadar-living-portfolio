// ===================================================================
// Critical path: create profile → fill sections → mark complete →
// publish → parent view renders.
//
// Uses handler-invocation pattern: imports the actual API route
// handlers, mocks @/lib/auth to return a seeded admin/teacher
// context, but lets @/lib/supabaseAdmin pass through to the real
// local Supabase. This exercises validation, role gating, and DB
// writes against a real database.
//
// Publishing currently uses a direct DB update because there is no
// publish API endpoint yet (Phase 4: Dr. Worth review queue).
// When that endpoint lands, replace the direct update with a call
// to the API and this test still holds as a full happy-path.
// ===================================================================

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  adminClient,
  seedSchool,
  seedStudent,
  deleteSchool,
  makeAuthContext,
} from './helpers/testHarness'

// Mock Clerk auth — tests set mocked return values per-test.
const mockGetAuthContext = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthContext: () => mockGetAuthContext(),
}))

// Import AFTER the mock is declared.
import { POST as createProfilePOST } from '@/app/api/dashboard/profiles/route'
import { PATCH as updateSectionPATCH } from '@/app/api/dashboard/profiles/[profileId]/sections/[sectionId]/route'

describe('Profile Builder critical path', () => {
  let schoolId: string
  let studentId: string
  let teacherCtx: ReturnType<typeof makeAuthContext>

  beforeAll(async () => {
    const school = await seedSchool('Critical Path Test School')
    schoolId = school.id
    const student = await seedStudent(schoolId, {
      firstName: 'Test',
      gradeLevel: '3',
      academicYear: '2025-2026',
    })
    studentId = student.id
    teacherCtx = makeAuthContext({ schoolId, role: 'teacher' })
  })

  afterAll(async () => {
    if (schoolId) await deleteSchool(schoolId)
  })

  it('creates a profile with 9 required sections seeded in draft status', async () => {
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)

    const req = new NextRequest('http://localhost/api/dashboard/profiles', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        season: 'spring',
        academicYearLabel: '2025-2026',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await createProfilePOST(req)
    expect(res.status).toBe(201)
    const { profile } = await res.json()
    expect(profile.status).toBe('draft')
    expect(profile.season).toBe('spring')

    // Verify 9 sections were seeded.
    const { data: sections } = await adminClient()
      .from('profile_sections')
      .select('section_kind, status, is_required')
      .eq('profile_id', profile.id)
      .order('section_order')
    expect(sections).toHaveLength(9)
    expect(sections?.every(s => s.is_required)).toBe(true)
    expect(sections?.every(s => s.status === 'not_started')).toBe(true)
  })

  it('fills two sections with narrative and marks them complete, then publishes, then parent sees the full published profile', async () => {
    // ── Arrange: fetch the profile + its sections (created in previous test) ──
    const { data: profile } = await adminClient()
      .from('profiles')
      .select('id')
      .eq('student_id', studentId)
      .eq('season', 'spring')
      .single()
    expect(profile).toBeTruthy()
    const profileId = profile!.id

    const { data: sections } = await adminClient()
      .from('profile_sections')
      .select('id, section_kind')
      .eq('profile_id', profileId)
    expect(sections).toBeTruthy()

    const mapsSection = sections!.find(s => s.section_kind === 'maps_scores')!
    const canonSection = sections!.find(s => s.section_kind === 'canon_reading')!

    // ── Act: PATCH maps_scores section — fill narrative + mark complete ──
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
    const mapsReq = new NextRequest(
      `http://localhost/api/dashboard/profiles/${profileId}/sections/${mapsSection.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          narrativeText: 'Athena has shown steady growth in math assessments.',
          status: 'complete',
        }),
        headers: { 'content-type': 'application/json' },
      }
    )
    const mapsRes = await updateSectionPATCH(mapsReq, {
      params: Promise.resolve({ profileId, sectionId: mapsSection.id }),
    })
    expect(mapsRes.status).toBe(200)

    // ── Act: PATCH canon_reading section — same pattern ──
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
    const canonReq = new NextRequest(
      `http://localhost/api/dashboard/profiles/${profileId}/sections/${canonSection.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          narrativeText: 'Athena has read 10 books this term.',
          status: 'complete',
        }),
        headers: { 'content-type': 'application/json' },
      }
    )
    const canonRes = await updateSectionPATCH(canonReq, {
      params: Promise.resolve({ profileId, sectionId: canonSection.id }),
    })
    expect(canonRes.status).toBe(200)

    // ── Assert: intermediate state — profile still draft, 2 sections complete ──
    const { data: midProfile } = await adminClient()
      .from('profiles')
      .select('status')
      .eq('id', profileId)
      .single()
    expect(midProfile?.status).toBe('draft')

    const { data: completedSections } = await adminClient()
      .from('profile_sections')
      .select('section_kind, status, narrative_text')
      .eq('profile_id', profileId)
      .eq('status', 'complete')
    expect(completedSections).toHaveLength(2)
    expect(completedSections?.find(s => s.section_kind === 'maps_scores')?.narrative_text)
      .toContain('steady growth')
    expect(completedSections?.find(s => s.section_kind === 'canon_reading')?.narrative_text)
      .toContain('read 10 books')

    // ── Act: publish via direct DB update (no API endpoint yet — Phase 4) ──
    // TODO(Phase 4): replace with POST /api/dashboard/profiles/[profileId]/publish
    const publishedAt = new Date().toISOString()
    const reviewerId = 'test-reviewer-' + Math.random().toString(36).slice(2, 8)
    const { error: publishError } = await adminClient()
      .from('profiles')
      .update({
        status: 'published',
        published_at: publishedAt,
        reviewed_by: reviewerId,
        updated_at: publishedAt,
        updated_by: reviewerId,
      })
      .eq('id', profileId)
    expect(publishError).toBeNull()

    // ── Assert: parent-view query returns the published profile with sections ──
    // Replicates the exact query shape used in
    // app/portfolio/[studentId]/full/[profileId]/page.tsx
    const { data: parentProfile } = await adminClient()
      .from('profiles')
      .select('id, status, published_at')
      .eq('id', profileId)
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle()
    expect(parentProfile).toBeTruthy()
    expect(parentProfile?.status).toBe('published')
    // Postgres normalises timestamps to +00:00 on read; compare as dates
    // rather than string-equal to dodge the trailing Z vs +00:00 mismatch.
    expect(new Date(parentProfile!.published_at as string).getTime())
      .toBe(new Date(publishedAt).getTime())

    // All 9 sections present in published read.
    const { data: publishedSections } = await adminClient()
      .from('profile_sections')
      .select('section_kind, status, narrative_text')
      .eq('profile_id', profileId)
      .is('deleted_at', null)
      .order('section_order')
    expect(publishedSections).toHaveLength(9)

    // The 2 filled sections carry their narrative into the published read.
    const publishedMaps = publishedSections?.find(s => s.section_kind === 'maps_scores')
    expect(publishedMaps?.narrative_text).toContain('steady growth')
    const publishedCanon = publishedSections?.find(s => s.section_kind === 'canon_reading')
    expect(publishedCanon?.narrative_text).toContain('read 10 books')
  })
})
