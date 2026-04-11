// ============================================================
// app/api/dashboard/students/[studentId]/assessments/route.test.ts
//
// Tests for POST /api/dashboard/students/[studentId]/assessments
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID    = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID   = '11111111-1111-4111-8111-111111111111'
const ASSESSMENT_ID = '22222222-2222-4222-8222-222222222222'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

const ASSESSMENT_ROW = {
  id: ASSESSMENT_ID, student_id: STUDENT_ID, school_id: SCHOOL_ID,
  assessment_type: 'maps_math', score: null, percentile: 85,
  rit_score: 220, lexile_value: null, term: 'Fall 2025',
  academic_year: '2025-2026', notes: null, created_at: new Date().toISOString(),
}

// ── Helpers ───────────────────────────────────────────────────

function makeChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.insert  = vi.fn(() => chain)
  chain.eq      = vi.fn(() => chain)
  chain.is      = vi.fn(() => chain)
  chain.single  = vi.fn(() => Promise.resolve(result))
  chain.then    = p.then.bind(p)
  chain.catch   = p.catch.bind(p)
  chain.finally = p.finally.bind(p)
  return chain
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

function makeJsonReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest
}
function makeBadJsonReq(): NextRequest {
  return { json: () => Promise.reject(new SyntaxError('bad json')) } as unknown as NextRequest
}

const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

// ── Tests ─────────────────────────────────────────────────────

describe('POST /api/dashboard/students/[studentId]/assessments', () => {
  const validBody = {
    assessmentType: 'maps_math',
    percentile: 85,
    ritScore: 220,
    term: 'Fall 2025',
    academicYear: '2025-2026',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 201 with mapped assessment on success', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID }, error: null })) // student check
      .mockReturnValueOnce(makeChain({ data: ASSESSMENT_ROW, error: null }))     // insert
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.assessmentType).toBe('maps_math')
    expect(body.percentile).toBe(85)
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await POST(makeBadJsonReq(), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeJsonReq({ assessmentType: 'maps_math' }), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 404 when student does not belong to school', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 on DB insert error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'constraint fail' } }))
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
