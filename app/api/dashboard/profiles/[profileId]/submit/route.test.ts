// ============================================================
// Tests for POST /api/dashboard/profiles/[profileId]/submit
//
// State machine: only `draft` profiles with all required sections
// `complete` may transition to `in_review`. Anything else 4xx.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { REQUIRED_SECTION_KINDS } from '@/lib/types/profileBuilder'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const PROFILE_ID = '22222222-2222-4222-8222-222222222222'
const USER_ID    = 'clerk-teacher'

const TEACHER_CTX = { userId: USER_ID, schoolId: SCHOOL_ID, role: 'teacher' as const }
const ADMIN_CTX   = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }
const PARENT_CTX  = { userId: 'clerk-parent', schoolId: SCHOOL_ID, role: 'parent' as const }

const fakeReq = {} as NextRequest

const PARAMS = { params: Promise.resolve({ profileId: PROFILE_ID }) }

const DRAFT_PROFILE = {
  id: PROFILE_ID, school_id: SCHOOL_ID, status: 'draft',
  student_id: 'st-id', season: 'spring', academic_year_id: 'ay-id',
  term: 'Spring 2025', review_feedback: null, deleted_at: null,
}

const IN_REVIEW_PROFILE = { ...DRAFT_PROFILE, status: 'in_review' }

function chainResolving(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const c: Record<string, unknown> = {}
  c.select    = vi.fn(() => c)
  c.update    = vi.fn(() => c)
  c.eq        = vi.fn(() => c)
  c.is        = vi.fn(() => c)
  c.maybeSingle = vi.fn(() => Promise.resolve(result))
  c.single    = vi.fn(() => Promise.resolve(result))
  c.then      = p.then.bind(p)
  return c
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

function allCompleteSections() {
  return REQUIRED_SECTION_KINDS.map((kind) => ({
    section_kind: kind, status: 'complete', is_required: true,
  }))
}

describe('POST /api/dashboard/profiles/[profileId]/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(TEACHER_CTX)
  })

  it('transitions draft → in_review when all required sections complete', async () => {
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: DRAFT_PROFILE,        error: null })) // load profile
      .mockReturnValueOnce(chainResolving({ data: allCompleteSections(), error: null })) // load sections
      .mockReturnValueOnce(chainResolving({ data: { ...DRAFT_PROFILE, status: 'in_review' }, error: null })) // update

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.status).toBe('in_review')
  })

  it('returns 409 INVALID_STATE when profile not in draft', async () => {
    mockFrom().mockReturnValueOnce(chainResolving({ data: IN_REVIEW_PROFILE, error: null }))

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('INVALID_STATE')
  })

  it('returns 409 INCOMPLETE_SECTIONS with the missing list', async () => {
    const incomplete = REQUIRED_SECTION_KINDS.map((kind, i) => ({
      section_kind: kind, status: i < 2 ? 'in_progress' : 'complete', is_required: true,
    }))
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: DRAFT_PROFILE, error: null }))
      .mockReturnValueOnce(chainResolving({ data: incomplete,    error: null }))

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('INCOMPLETE_SECTIONS')
    expect(body.incomplete).toHaveLength(2)
  })

  it('returns 404 when profile not found (or wrong school_id)', async () => {
    mockFrom().mockReturnValueOnce(chainResolving({ data: null, error: null }))

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(401)
  })

  it('admin role can also submit', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: DRAFT_PROFILE,        error: null }))
      .mockReturnValueOnce(chainResolving({ data: allCompleteSections(), error: null }))
      .mockReturnValueOnce(chainResolving({ data: { ...DRAFT_PROFILE, status: 'in_review' }, error: null }))

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(200)
  })
})
