// ============================================================
// Tests for PATCH /api/dashboard/profiles/[profileId]/sections/[sectionId]
//
// Auth: admin or teacher. The critical safety check is the LOCKED
// guard: while a profile is `in_review`, no section may be edited.
// To make changes the admin must return it to draft.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from './route'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const PROFILE_ID = '55555555-5555-4555-8555-555555555555'
const SECTION_ID = '66666666-6666-4666-8666-666666666666'

const TEACHER_CTX = { userId: 'clerk-teacher', schoolId: SCHOOL_ID, role: 'teacher' as const }
const ADMIN_CTX   = { userId: 'clerk-admin',   schoolId: SCHOOL_ID, role: 'admin'   as const }
const PARENT_CTX  = { userId: 'clerk-parent',  schoolId: SCHOOL_ID, role: 'parent'  as const }

const PARAMS = { params: Promise.resolve({ profileId: PROFILE_ID, sectionId: SECTION_ID }) }

function makeReq(body: unknown) {
  return new Request(`http://localhost/api/dashboard/profiles/${PROFILE_ID}/sections/${SECTION_ID}`, {
    method:  'PATCH',
    headers: { 'content-type': 'application/json' },
    body:    typeof body === 'string' ? body : JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
}

function joinedSectionRow(profileStatus: string) {
  return {
    id: SECTION_ID,
    profile_id: PROFILE_ID,
    school_id: SCHOOL_ID,
    section_kind: 'maps_scores',
    status: 'in_progress',
    narrative_text: null,
    narrative_draft: null,
    is_required: true,
    section_order: 0,
    profiles: {
      student_id: 'st-id',
      season: 'spring',
      status: profileStatus,
      school_id: SCHOOL_ID,
      deleted_at: null,
    },
  }
}

function chainResolving(result: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {}
  c.select = vi.fn(() => c)
  c.update = vi.fn(() => c)
  c.eq     = vi.fn(() => c)
  c.is     = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  return c
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

describe('PATCH /api/dashboard/profiles/[profileId]/sections/[sectionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(TEACHER_CTX)
  })

  it('updates section narrative when profile is draft (teacher)', async () => {
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: joinedSectionRow('draft'), error: null })) // resolveAndAuthorize
      .mockReturnValueOnce(chainResolving({                                                   // update
        data: { ...joinedSectionRow('draft'), narrative_text: 'New text', status: 'complete' },
        error: null,
      }))

    const res = await PATCH(makeReq({ narrativeText: 'New text', status: 'complete' }), PARAMS)
    expect(res.status).toBe(200)
  })

  it('admin can also update', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: joinedSectionRow('draft'), error: null }))
      .mockReturnValueOnce(chainResolving({
        data: { ...joinedSectionRow('draft'), narrative_text: 'x' },
        error: null,
      }))

    const res = await PATCH(makeReq({ narrativeText: 'x' }), PARAMS)
    expect(res.status).toBe(200)
  })

  it('returns 403 LOCKED when profile is in_review', async () => {
    mockFrom().mockReturnValueOnce(
      chainResolving({ data: joinedSectionRow('in_review'), error: null }),
    )

    const res = await PATCH(makeReq({ narrativeText: 'sneaky edit' }), PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('LOCKED')
  })

  it('returns 403 FORBIDDEN for parent role', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const res = await PATCH(makeReq({ narrativeText: 'x' }), PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 404 when section is not found (or wrong school)', async () => {
    mockFrom().mockReturnValueOnce(chainResolving({ data: null, error: null }))
    const res = await PATCH(makeReq({ narrativeText: 'x' }), PARAMS)
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 400 VALIDATION_ERROR when body has no updatable fields', async () => {
    const res = await PATCH(makeReq({}), PARAMS)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 INVALID_BODY for malformed JSON', async () => {
    const res = await PATCH(makeReq('not json{'), PARAMS)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await PATCH(makeReq({ narrativeText: 'x' }), PARAMS)
    expect(res.status).toBe(401)
  })
})
