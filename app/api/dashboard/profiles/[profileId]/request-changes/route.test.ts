// ============================================================
// Tests for POST /api/dashboard/profiles/[profileId]/request-changes
//
// Admin-only. Returns an in_review profile to draft with feedback
// attached. Feedback is required (1..2000 chars).
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const PROFILE_ID = '44444444-4444-4444-8444-444444444444'

const ADMIN_CTX   = { userId: 'clerk-admin',   schoolId: SCHOOL_ID, role: 'admin'   as const }
const TEACHER_CTX = { userId: 'clerk-teacher', schoolId: SCHOOL_ID, role: 'teacher' as const }

const PARAMS = { params: Promise.resolve({ profileId: PROFILE_ID }) }

const IN_REVIEW = {
  id: PROFILE_ID, status: 'in_review', student_id: 'st-id',
  school_id: SCHOOL_ID, season: 'spring', academic_year_id: 'ay-id',
  term: 'Spring 2025', review_feedback: null, deleted_at: null,
}

function makeReq(body: unknown) {
  return new Request('http://localhost/api/dashboard/profiles/x/request-changes', {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    typeof body === 'string' ? body : JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
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

describe('POST /api/dashboard/profiles/[profileId]/request-changes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('transitions in_review → draft with feedback as admin', async () => {
    mockFrom()
      .mockReturnValueOnce(chainResolving({ data: IN_REVIEW, error: null }))
      .mockReturnValueOnce(chainResolving({
        data: { ...IN_REVIEW, status: 'draft', review_feedback: 'Please tighten section 3.' },
        error: null,
      }))

    const res = await POST(makeReq({ feedback: 'Please tighten section 3.' }), PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.status).toBe('draft')
    expect(body.profile.reviewFeedback).toBe('Please tighten section 3.')
  })

  it('returns 400 VALIDATION_ERROR when feedback is empty', async () => {
    const res = await POST(makeReq({ feedback: '' }), PARAMS)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR when feedback exceeds 2000 chars', async () => {
    const res = await POST(makeReq({ feedback: 'x'.repeat(2001) }), PARAMS)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 INVALID_BODY for malformed JSON', async () => {
    const res = await POST(makeReq('not-json{'), PARAMS)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 403 for non-admin', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(TEACHER_CTX)
    const res = await POST(makeReq({ feedback: 'ok' }), PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 409 INVALID_STATE when profile is not in review', async () => {
    mockFrom().mockReturnValueOnce(
      chainResolving({ data: { ...IN_REVIEW, status: 'published' }, error: null }),
    )
    const res = await POST(makeReq({ feedback: 'ok' }), PARAMS)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('INVALID_STATE')
  })

  it('returns 404 when profile not found', async () => {
    mockFrom().mockReturnValueOnce(chainResolving({ data: null, error: null }))
    const res = await POST(makeReq({ feedback: 'ok' }), PARAMS)
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(makeReq({ feedback: 'ok' }), PARAMS)
    expect(res.status).toBe(401)
  })
})
