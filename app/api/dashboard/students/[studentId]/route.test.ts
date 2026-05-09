// ============================================================
// app/api/dashboard/students/[studentId]/route.test.ts
//
// Tests for the DELETE /api/dashboard/students/[studentId] handler.
// Focuses on soft-delete logic: 204 success, demo-student guard (403),
// not-found (404), and role guard (403 for non-teacher/admin).
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  getAuthContext: vi.fn(),
}))

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

// ── Helpers ───────────────────────────────────────────────────

/**
 * Build a fluent query chain for the SELECT verification call.
 * Terminates with .single() returning a resolved Promise.
 */
function makeSelectChain(singleResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq     = vi.fn(() => chain)
  chain.is     = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(singleResult))
  return chain
}

/**
 * Build a fluent query chain for the UPDATE call.
 * The chain is thenable so `const { error } = await chain` resolves correctly.
 * capturedUpdateArg is set to the first argument passed to .update() so tests
 * can assert on it without fighting Vitest's mock.calls tuple types.
 */
function makeUpdateChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  let capturedUpdateArg: Record<string, unknown> | undefined
  const updateSpy = vi.fn((arg: Record<string, unknown>) => {
    capturedUpdateArg = arg
    return chain
  })
  chain.update  = updateSpy
  chain.eq      = vi.fn(() => chain)
  chain.then    = p.then.bind(p)
  chain.catch   = p.catch.bind(p)
  chain.finally = p.finally.bind(p)
  return { chain, updateSpy, getCapturedArg: () => capturedUpdateArg }
}

/** DELETE ignores the request body — a plain object cast is sufficient. */
const fakeReq = {} as NextRequest

/** Build the route context object expected by Next.js dynamic handlers. */
const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

// supabaseAdmin.from typed as `any` in tests to avoid fighting Supabase's
// complex generic return types when providing a plain mock chain.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

// ── Tests ─────────────────────────────────────────────────────

describe('DELETE /api/dashboard/students/[studentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue({
      userId:   'clerk-user-admin',
      schoolId: SCHOOL_ID,
      role:     'admin',
    })
  })

  it('returns 204 and calls update with a deleted_at timestamp', async () => {
    const { chain, updateSpy, getCapturedArg } = makeUpdateChain({ data: null, error: null })
    mockFrom()
      .mockReturnValueOnce(makeSelectChain({ data: { id: STUDENT_ID, is_demo: false }, error: null }))
      .mockReturnValueOnce(chain)

    const response = await DELETE(fakeReq, routeCtx())

    expect(response.status).toBe(204)
    expect(updateSpy).toHaveBeenCalledOnce()

    const updateArg = getCapturedArg()
    expect(updateArg).toHaveProperty('deleted_at')
    expect(typeof updateArg?.deleted_at).toBe('string')
    // Must be a valid ISO 8601 date string
    expect(new Date(updateArg?.deleted_at as string).toString()).not.toBe('Invalid Date')
  })

  it('returns 403 and skips the update when student is a demo', async () => {
    mockFrom().mockReturnValueOnce(
      makeSelectChain({ data: { id: STUDENT_ID, is_demo: true }, error: null })
    )

    const response = await DELETE(fakeReq, routeCtx())
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.code).toBe('FORBIDDEN')
    // from() should have been called only once (the SELECT check), never for UPDATE
    expect(vi.mocked(supabaseAdmin.from)).toHaveBeenCalledTimes(1)
  })

  it('returns 404 when the student does not exist', async () => {
    mockFrom().mockReturnValueOnce(
      makeSelectChain({ data: null, error: { message: 'no rows returned' } })
    )

    const response = await DELETE(fakeReq, routeCtx())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.code).toBe('NOT_FOUND')
  })

  it('returns 403 for a parent role without querying the DB', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      userId:   'clerk-user-parent',
      schoolId: SCHOOL_ID,
      role:     'parent',
    })

    const response = await DELETE(fakeReq, routeCtx())
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.code).toBe('FORBIDDEN')
    expect(vi.mocked(supabaseAdmin.from)).not.toHaveBeenCalled()
  })

  it('returns 204 when the caller is a teacher (teachers can archive)', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      userId:   'clerk-user-teacher',
      schoolId: SCHOOL_ID,
      role:     'teacher',
    })
    const { chain } = makeUpdateChain({ data: null, error: null })
    mockFrom()
      .mockReturnValueOnce(makeSelectChain({ data: { id: STUDENT_ID, is_demo: false }, error: null }))
      .mockReturnValueOnce(chain)

    const response = await DELETE(fakeReq, routeCtx())
    expect(response.status).toBe(204)
  })

  it('returns 500 when the UPDATE query returns a DB error', async () => {
    const { chain } = makeUpdateChain({ data: null, error: { message: 'db error' } })
    mockFrom()
      .mockReturnValueOnce(makeSelectChain({ data: { id: STUDENT_ID, is_demo: false }, error: null }))
      .mockReturnValueOnce(chain)

    const response = await DELETE(fakeReq, routeCtx())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.code).toBe('DB_ERROR')
  })
})
