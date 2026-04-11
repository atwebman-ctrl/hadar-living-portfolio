// ============================================================
// app/api/dashboard/students/[studentId]/uploads/route.test.ts
//
// Tests for POST /api/dashboard/students/[studentId]/uploads
// Covers auth gates, file validation, type validation, and
// student ownership check. Storage calls are mocked.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from:    vi.fn(),
    storage: { from: vi.fn() },
  },
}))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

const ADMIN_CTX  = { userId: 'clerk-admin',  schoolId: SCHOOL_ID, role: 'admin'  as const }
const PARENT_CTX = { userId: 'clerk-parent', schoolId: SCHOOL_ID, role: 'parent' as const }

// ── Helpers ───────────────────────────────────────────────────

function makeQueryChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select  = vi.fn(() => chain)
  chain.insert  = vi.fn(() => chain)
  chain.update  = vi.fn(() => chain)
  chain.eq      = vi.fn(() => chain)
  chain.is      = vi.fn(() => chain)
  chain.single  = vi.fn(() => Promise.resolve(result))
  chain.then    = p.then.bind(p)
  chain.catch   = p.catch.bind(p)
  chain.finally = p.finally.bind(p)
  return chain
}

function makeStorageBucket(uploadError: string | null = null) {
  return { upload: vi.fn().mockResolvedValue({ error: uploadError ? { message: uploadError } : null }) }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom    = () => vi.mocked(supabaseAdmin.from)    as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStorage = () => vi.mocked(supabaseAdmin.storage.from) as any

const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

function makeSmallFile(name = 'test.jpg', type = 'image/jpeg'): File {
  return new File(['hello'], name, { type })
}

function makeFormReq(fields: Record<string, string | File>): NextRequest {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return { formData: () => Promise.resolve(fd) } as unknown as NextRequest
}

function makeBadFormReq(): NextRequest {
  return { formData: () => Promise.reject(new Error('parse error')) } as unknown as NextRequest
}

// ── Tests ─────────────────────────────────────────────────────

describe('POST /api/dashboard/students/[studentId]/uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'photo' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 400 when form data cannot be parsed', async () => {
    const res = await POST(makeBadFormReq(), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 when no file is provided', async () => {
    const fd = new FormData()
    fd.append('upload_type', 'photo')
    const req = { formData: () => Promise.resolve(fd) } as unknown as NextRequest
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('MISSING_FILE')
  })

  it('returns 400 when upload_type is invalid', async () => {
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'invalid_type' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_TYPE')
  })

  it('returns 403 when parent tries to upload a photo', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'photo' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 403 when parent tries to upload handwriting', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'handwriting' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 404 when student not found', async () => {
    mockFrom().mockReturnValueOnce(makeQueryChain({ data: null, error: { message: 'not found' } }))
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'photo' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('NOT_FOUND')
  })

  it('returns 502 on storage upload error', async () => {
    mockFrom().mockReturnValueOnce(
      makeQueryChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null })
    )
    mockStorage().mockReturnValueOnce(makeStorageBucket('storage error'))
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'photo' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('STORAGE_ERROR')
  })

  it('returns 201 with storagePath on successful photo upload', async () => {
    mockFrom()
      .mockReturnValueOnce(makeQueryChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'photo-1', storage_path: 'school/student/photo/file.jpg' }, error: null }))
    mockStorage().mockReturnValueOnce(makeStorageBucket(null))
    const req = makeFormReq({ file: makeSmallFile(), upload_type: 'photo' })
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.storagePath).toBeDefined()
  })
})
