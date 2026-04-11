// ============================================================
// app/api/dashboard/students/route.test.ts
//
// Tests for GET /api/dashboard/students (list) and
// POST /api/dashboard/students (create).
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

const STUDENT_ROW = {
  id: STUDENT_ID, first_name: 'Ada', last_name: 'Lovelace',
  grade_level: '3', academic_year: '2025-2026', school_id: SCHOOL_ID,
  is_demo: false, parent_user_ids: [], enrollment_status: 'active',
}

// ── Helpers ───────────────────────────────────────────────────

/** Universal fluent chain — thenable for direct await AND .single() for chained calls. */
function makeChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.insert  = vi.fn(() => chain)
  chain.eq      = vi.fn(() => chain)
  chain.is      = vi.fn(() => chain)
  chain.order   = vi.fn(() => chain)
  chain.single  = vi.fn(() => Promise.resolve(result))
  chain.then    = p.then.bind(p)
  chain.catch   = p.catch.bind(p)
  chain.finally = p.finally.bind(p)
  return chain
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

const fakeReq = {} as NextRequest

function makeJsonReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest
}
function makeBadJsonReq(): NextRequest {
  return { json: () => Promise.reject(new SyntaxError('bad json')) } as unknown as NextRequest
}

// ── GET tests ─────────────────────────────────────────────────

describe('GET /api/dashboard/students', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 200 with mapped student list', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: [STUDENT_ROW], error: null }))
    const res = await GET(fakeReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].firstName).toBe('Ada')
  })

  it('returns 200 with empty array when no students', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: [], error: null }))
    const res = await GET(fakeReq)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await GET(fakeReq)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 401 when getAuthContext throws AUTH_UNAUTHENTICATED', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await GET(fakeReq)
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('UNAUTHORIZED')
  })

  it('returns 500 on DB error', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'db down' } }))
    const res = await GET(fakeReq)
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})

// ── POST tests ────────────────────────────────────────────────

describe('POST /api/dashboard/students', () => {
  const validBody = {
    firstName: 'Ada', lastName: 'Lovelace',
    gradeLevel: '3', academicYear: '2025-2026',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 201 with mapped student on success', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: STUDENT_ROW, error: null }))
    const res = await POST(makeJsonReq(validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.firstName).toBe('Ada')
    expect(body.lastName).toBe('Lovelace')
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await POST(makeBadJsonReq())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeJsonReq({ firstName: 'Ada' }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await POST(makeJsonReq(validBody))
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_NO_ORG'))
    const res = await POST(makeJsonReq(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 500 on DB insert error', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'constraint violation' } }))
    const res = await POST(makeJsonReq(validBody))
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
