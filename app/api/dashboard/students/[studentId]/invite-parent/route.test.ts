// ============================================================
// app/api/dashboard/students/[studentId]/invite-parent/route.test.ts
//
// Tests for POST /api/dashboard/students/[studentId]/invite-parent
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@clerk/nextjs/server', () => ({
  auth:        vi.fn(),
  clerkClient: vi.fn(),
}))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth, clerkClient } from '@clerk/nextjs/server'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

// ── Helpers ───────────────────────────────────────────────────

function makeChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.insert  = vi.fn(() => chain)
  chain.eq      = vi.fn(() => chain)
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

function mockClerkSuccess() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(auth).mockResolvedValue({ orgId: 'org_test123' } as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(clerkClient).mockResolvedValue({
    organizations: { createOrganizationInvitation: vi.fn().mockResolvedValue({}) },
  } as any)
}

// ── Tests ─────────────────────────────────────────────────────

describe('POST /api/dashboard/students/[studentId]/invite-parent', () => {
  const validBody = { email: 'parent@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
    mockClerkSuccess()
  })

  it('returns 201 with status invited on success', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID }, error: null })) // student check
      .mockReturnValueOnce(makeChain({ data: null, error: null }))               // insert parent_students
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('invited')
    expect(body.email).toBe('parent@example.com')
  })

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(makeBadJsonReq(), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeJsonReq({ email: 'not-an-email' }), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 403 when no active org', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ orgId: null } as any)
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('NO_ORG')
  })

  it('returns 404 when student does not belong to school', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 409 when email already invited for this student', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { code: '23505', message: 'unique violation' } }))
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('ALREADY_INVITED')
  })

  it('returns 502 when Clerk invitation call fails', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(clerkClient).mockResolvedValue({
      organizations: { createOrganizationInvitation: vi.fn().mockRejectedValue(new Error('clerk down')) },
    } as any)
    const res = await POST(makeJsonReq(validBody), routeCtx())
    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('CLERK_ERROR')
  })
})
