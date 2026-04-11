// ============================================================
// app/api/dashboard/students/[studentId]/parent-uploads/[uploadId]/route.test.ts
//
// Tests for PATCH and DELETE
// /api/dashboard/students/[studentId]/parent-uploads/[uploadId]
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
const UPLOAD_ID  = '55555555-5555-4555-8555-555555555555'

const ADMIN_CTX = { userId: 'clerk-admin', schoolId: SCHOOL_ID, role: 'admin' as const }

const UPLOAD_ROW = {
  id: UPLOAD_ID, student_id: STUDENT_ID, school_id: SCHOOL_ID,
  upload_type: 'art', category: 'art', title: 'My Drawing',
  storage_path: 'school/student/parent_upload/file.jpg',
  description: null, date: null, grade_level: '3',
  academic_year: '2025-2026', uploaded_by: 'parent-user', deleted_at: null,
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
const routeCtx = (studentId = STUDENT_ID, uploadId = UPLOAD_ID) =>
  ({ params: Promise.resolve({ studentId, uploadId }) })

// ── PATCH tests ───────────────────────────────────────────────

describe('PATCH /parent-uploads/[uploadId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 200 with updated upload on success', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: UPLOAD_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { ...UPLOAD_ROW, title: 'New Title' }, error: null }))
    const res = await PATCH(makeJsonReq({ title: 'New Title' }), routeCtx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('New Title')
  })

  it('returns 400 for invalid JSON', async () => {
    const res = await PATCH(makeBadJsonReq(), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await PATCH(makeJsonReq({ title: 'x' }), routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 404 when upload not found', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await PATCH(makeJsonReq({ title: 'x' }), routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 on DB update error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: UPLOAD_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'db error' } }))
    const res = await PATCH(makeJsonReq({ title: 'x' }), routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})

// ── DELETE tests ──────────────────────────────────────────────

describe('DELETE /parent-uploads/[uploadId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 204 on successful soft-delete', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: UPLOAD_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(204)
  })

  it('returns 403 when role is parent', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(403)
  })

  it('returns 404 when upload not found', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 500 on DB update error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: UPLOAD_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'db error' } }))
    const res = await DELETE(fakeReq, routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
