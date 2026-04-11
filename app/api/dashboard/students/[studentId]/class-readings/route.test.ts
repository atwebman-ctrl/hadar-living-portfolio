// ============================================================
// app/api/dashboard/students/[studentId]/class-readings/route.test.ts
//
// Tests for GET /api/dashboard/students/[studentId]/class-readings
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID   = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID  = '11111111-1111-4111-8111-111111111111'
const STUDENT_ID2 = '33333333-3333-4333-8333-333333333333'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

// ── Helpers ───────────────────────────────────────────────────

function makeChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.eq      = vi.fn(() => chain)
  chain.is      = vi.fn(() => chain)
  chain.in      = vi.fn(() => chain)
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
const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

// ── Tests ─────────────────────────────────────────────────────

describe('GET /api/dashboard/students/[studentId]/class-readings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 200 with readings for the class', async () => {
    const studentRow = { grade_level: '3', academic_year: '2025-2026' }
    const classmateRows = [
      { id: STUDENT_ID,  first_name: 'Ada' },
      { id: STUDENT_ID2, first_name: 'Grace' },
    ]
    const readingRows = [
      { id: 'r1', student_id: STUDENT_ID, title: 'Charlotte\'s Web', author: 'E.B. White', completed: true, student_rating: 5, academic_year: '2025-2026' },
      { id: 'r2', student_id: STUDENT_ID2, title: 'The Giver', author: 'Lois Lowry', completed: false, student_rating: null, academic_year: '2025-2026' },
    ]
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: studentRow, error: null }))       // student lookup
      .mockReturnValueOnce(makeChain({ data: classmateRows, error: null }))    // classmates
      .mockReturnValueOnce(makeChain({ data: readingRows, error: null }))      // readings
    const res = await GET(fakeReq, routeCtx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.gradeLevel).toBe('3')
    expect(body.academicYear).toBe('2025-2026')
    expect(body.studentCount).toBe(2)
    expect(body.readings).toHaveLength(2)
    expect(body.readings[0].studentFirstName).toBe('Ada')
  })

  it('returns 200 with empty readings when no classmates found', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { grade_level: '3', academic_year: '2025-2026' }, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null })) // no classmates
    const res = await GET(fakeReq, routeCtx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.readings).toEqual([])
    expect(body.studentCount).toBe(0)
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await GET(fakeReq, routeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 404 when student not found', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await GET(fakeReq, routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 when readings query fails', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { grade_level: '3', academic_year: '2025-2026' }, error: null }))
      .mockReturnValueOnce(makeChain({ data: [{ id: STUDENT_ID, first_name: 'Ada' }], error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'db error' } }))
    const res = await GET(fakeReq, routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
