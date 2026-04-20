// ===================================================================
// tests/integration/reviewFlow.test.ts
//
// Dr. Worth review queue — two critical paths:
//
//   1. submit (teacher) → approve (admin) → parent sees published
//   2. submit (teacher) → request-changes (admin) with feedback
//      → draft + review_feedback set → re-submit clears feedback
//
// Same harness pattern as profileFlow.test.ts: mocks @/lib/auth,
// lets supabaseAdmin hit the real local Supabase, invokes route
// handlers directly.
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

const mockGetAuthContext = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthContext: () => mockGetAuthContext(),
}))

// Import AFTER the mock is declared.
import { POST as createProfilePOST } from '@/app/api/dashboard/profiles/route'
import { POST as submitPOST }       from '@/app/api/dashboard/profiles/[profileId]/submit/route'
import { POST as approvePOST }      from '@/app/api/dashboard/profiles/[profileId]/approve/route'
import { POST as requestChangesPOST } from '@/app/api/dashboard/profiles/[profileId]/request-changes/route'

async function markAllSectionsComplete(profileId: string): Promise<void> {
  const { error } = await adminClient()
    .from('profile_sections')
    .update({
      status:         'complete',
      narrative_text: 'Filled for integration test.',
      updated_at:     new Date().toISOString(),
    })
    .eq('profile_id', profileId)
    .eq('is_required', true)
  if (error) throw new Error(`markAllSectionsComplete: ${error.message}`)
}

async function createDraftProfile(studentId: string, teacherCtx: ReturnType<typeof makeAuthContext>): Promise<string> {
  mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
  const req = new NextRequest('http://localhost/api/dashboard/profiles', {
    method: 'POST',
    body:   JSON.stringify({ studentId, season: 'spring', academicYearLabel: '2025-2026' }),
    headers: { 'content-type': 'application/json' },
  })
  const res = await createProfilePOST(req)
  expect(res.status).toBe(201)
  const { profile } = await res.json()
  return profile.id as string
}

describe('Review queue flow', () => {
  let schoolId: string
  let teacherCtx: ReturnType<typeof makeAuthContext>
  let adminCtx:   ReturnType<typeof makeAuthContext>

  beforeAll(async () => {
    const school = await seedSchool('Review Flow Test School')
    schoolId  = school.id
    teacherCtx = makeAuthContext({ schoolId, role: 'teacher' })
    adminCtx   = makeAuthContext({ schoolId, role: 'admin' })
  })

  afterAll(async () => {
    if (schoolId) await deleteSchool(schoolId)
  })

  it('submit → approve: parent sees a published profile', async () => {
    const student   = await seedStudent(schoolId, { firstName: 'Approve', gradeLevel: '3' })
    const profileId = await createDraftProfile(student.id, teacherCtx)
    await markAllSectionsComplete(profileId)

    // Submit — teacher
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
    const submitRes = await submitPOST(
      new NextRequest(`http://localhost/api/dashboard/profiles/${profileId}/submit`, { method: 'POST' }),
      { params: Promise.resolve({ profileId }) },
    )
    expect(submitRes.status).toBe(200)
    const submitted = (await submitRes.json()).profile
    expect(submitted.status).toBe('in_review')
    expect(submitted.reviewFeedback).toBeNull()

    // Approve — admin
    mockGetAuthContext.mockResolvedValueOnce(adminCtx)
    const approveRes = await approvePOST(
      new NextRequest(`http://localhost/api/dashboard/profiles/${profileId}/approve`, { method: 'POST' }),
      { params: Promise.resolve({ profileId }) },
    )
    expect(approveRes.status).toBe(200)
    const approved = (await approveRes.json()).profile
    expect(approved.status).toBe('published')
    expect(approved.publishedAt).toBeTruthy()
    expect(approved.reviewedBy).toBe(adminCtx.userId)

    // Parent-view query shape — mirrors app/portfolio/[studentId]/full/[profileId]/page.tsx
    const { data: parentProfile } = await adminClient()
      .from('profiles')
      .select('id, status, published_at')
      .eq('id', profileId)
      .eq('student_id', student.id)
      .eq('school_id', schoolId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle()
    expect(parentProfile).toBeTruthy()
    expect(parentProfile?.status).toBe('published')
  })

  it('submit → request-changes: feedback persists on draft, clears on re-submit', async () => {
    const student   = await seedStudent(schoolId, { firstName: 'Revise', gradeLevel: '4' })
    const profileId = await createDraftProfile(student.id, teacherCtx)
    await markAllSectionsComplete(profileId)

    // Submit — teacher
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
    const submitRes = await submitPOST(
      new NextRequest(`http://localhost/api/dashboard/profiles/${profileId}/submit`, { method: 'POST' }),
      { params: Promise.resolve({ profileId }) },
    )
    expect(submitRes.status).toBe(200)

    // Request changes — admin
    const feedback = 'Character section needs a concrete example from Tefillah observations.'
    mockGetAuthContext.mockResolvedValueOnce(adminCtx)
    const rcRes = await requestChangesPOST(
      new NextRequest(`http://localhost/api/dashboard/profiles/${profileId}/request-changes`, {
        method: 'POST',
        body:   JSON.stringify({ feedback }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ profileId }) },
    )
    expect(rcRes.status).toBe(200)
    const returned = (await rcRes.json()).profile
    expect(returned.status).toBe('draft')
    expect(returned.reviewFeedback).toBe(feedback)
    expect(returned.reviewedBy).toBe(adminCtx.userId)
    expect(returned.reviewedAt).toBeTruthy()

    // Re-submit — feedback clears
    mockGetAuthContext.mockResolvedValueOnce(teacherCtx)
    const resubmitRes = await submitPOST(
      new NextRequest(`http://localhost/api/dashboard/profiles/${profileId}/submit`, { method: 'POST' }),
      { params: Promise.resolve({ profileId }) },
    )
    expect(resubmitRes.status).toBe(200)
    const resubmitted = (await resubmitRes.json()).profile
    expect(resubmitted.status).toBe('in_review')
    expect(resubmitted.reviewFeedback).toBeNull()
  })
})
