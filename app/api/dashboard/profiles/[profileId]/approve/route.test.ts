// ============================================================
// Tests for POST /api/dashboard/profiles/[profileId]/approve
//
// Admin-only. Only `in_review` may transition to `published`.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const PROFILE_ID = '33333333-3333-4333-8333-333333333333'

const ADMIN_CTX   = { userId: 'clerk-admin',   schoolId: SCHOOL_ID, role: 'admin'   as const }
const TEACHER_CTX = { userId: 'clerk-teacher', schoolId: SCHOOL_ID, role: 'teacher' as const }

const fakeReq = {} as NextRequest
const PARAMS  = { params: Promise.resolve({ profileId: PROFILE_ID }) }

const IN_REVIEW = {
  id: PROFILE_ID, status: 'in_review', student_id: 'st-id',
  school_id: SCHOOL_ID, season: 'spring', academic_year_id: 'ay-id',
  term: 'Spring 2025', review_feedback: null, deleted_at: null,
}

function chainResolving(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const c: Record<string, unknown> = {}
  c.select      = vi.fn(() => c)
  c.update      = vi.fn(() => c)
  c.eq          = vi.fn(() => c)
  c.is          = vi.fn(() => c)
  c.maybeSingle = vi.fn(() => Promise.resolve(result))
  c.single      = vi.fn(() => Promise.resolve(result))
  c.then        = p.then.bind(p)
  return c
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

describe('POST /api/dashboard/profiles/[profileId]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('transitions in_review → published as admin', async () => {
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: IN_REVIEW, error: null }))
      .mockReturnValueOnce(chainResolving({ data: { ...IN_REVIEW, status: 'published' }, error: null }))

    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(200)
    expect((await res.json()).profile.status).toBe('published')
  })

  it('returns 403 for non-admin', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(TEACHER_CTX)
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 409 INVALID_STATE when profile is draft', async () => {
    mockFrom().mockReturnValueOnce(
      chainResolving({ data: { ...IN_REVIEW, status: 'draft' }, error: null }),
    )
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('INVALID_STATE')
  })

  it('returns 404 when profile not found', async () => {
    mockFrom().mockReturnValueOnce(chainResolving({ data: null, error: null }))
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(fakeReq, PARAMS)
    expect(res.status).toBe(401)
  })
})
