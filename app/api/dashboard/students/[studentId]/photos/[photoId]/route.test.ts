// ============================================================
// app/api/dashboard/students/[studentId]/photos/[photoId]/route.test.ts
//
// Tests for PATCH and DELETE /api/dashboard/students/[studentId]/photos/[photoId]
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'
const PHOTO_ID   = '44444444-4444-4444-8444-444444444444'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

const PHOTO_ROW = {
  id: PHOTO_ID, student_id: STUDENT_ID, school_id: SCHOOL_ID,
  storage_path: 'school/student/photo/file.jpg', caption: 'Field trip',
  term: 'Fall 2025', category: 'event', deleted_at: null,
}

// ── Helpers ───────────────────────────────────────────────────

function makeChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.update  = vi.fn(() => chain)
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

const fakeReq = {} as NextRequest
const routeCtx = (studentId = STUDENT_ID, photoId = PHOTO_ID) =>
  ({ params: Promise.resolve({ studentId, photoId }) })

// ── PATCH tests ───────────────────────────────────────────────

describe('PATCH /photos/[photoId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 200 with updated photo on success', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: PHOTO_ID }, error: null }))      // verify ownership
      .mockReturnValueOnce(makeChain({ data: { ...PHOTO_ROW, caption: 'Updated' }, error: null })) // update
    const res = await PATCH(makeJsonReq({ caption: 'Updated' }), routeCtx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.caption).toBe('Updated')
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await PATCH(makeBadJsonReq(), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await PATCH(makeJsonReq({ caption: 'x' }), routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 404 when photo not found or deleted', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await PATCH(makeJsonReq({ caption: 'x' }), routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 on DB update error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: PHOTO_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'db error' } }))
    const res = await PATCH(makeJsonReq({ caption: 'x' }), routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})

// ── DELETE tests ──────────────────────────────────────────────

describe('DELETE /photos/[photoId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 204 on successful soft-delete', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: PHOTO_ID }, error: null }))  // verify
      .mockReturnValueOnce(makeChain({ data: null, error: null }))               // update
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(204)
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(403)
  })

  it('returns 404 when photo not found', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 on DB update error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: PHOTO_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'db error' } }))
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
