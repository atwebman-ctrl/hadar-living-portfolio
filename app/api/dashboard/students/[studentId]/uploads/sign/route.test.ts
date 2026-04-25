// ============================================================
// app/api/dashboard/students/[studentId]/uploads/sign/route.test.ts
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(), storage: { from: vi.fn() } },
}))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'
const ADMIN_CTX  = { userId: 'clerk-admin',  schoolId: SCHOOL_ID, role: 'admin'  as const }
const PARENT_CTX = { userId: 'clerk-parent', schoolId: SCHOOL_ID, role: 'parent' as const }

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq     = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  return chain
}

function makeStorageBucket(result: { data: unknown; error: unknown }) {
  return { createSignedUploadUrl: vi.fn().mockResolvedValue(result) }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStorage = () => vi.mocked(supabaseAdmin.storage.from) as any

const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

function makeJsonReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest
}

const VALID_BODY = {
  uploadType: 'photo' as const,
  filename:   'photo.jpg',
  mime:       'image/jpeg',
  size:       2 * 1024 * 1024,
}

describe('POST /api/dashboard/students/[studentId]/uploads/sign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(makeJsonReq(VALID_BODY), routeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid JSON', async () => {
    const req = { json: () => Promise.reject(new SyntaxError('bad')) } as unknown as NextRequest
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 on invalid uploadType', async () => {
    const res = await POST(makeJsonReq({ ...VALID_BODY, uploadType: 'video' }), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_TYPE')
  })

  it('returns 400 on disallowed MIME', async () => {
    const res = await POST(
      makeJsonReq({ ...VALID_BODY, mime: 'application/pdf' }),
      routeCtx(),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_MIME')
  })

  it('returns 413 when size exceeds the type cap', async () => {
    const res = await POST(
      makeJsonReq({ ...VALID_BODY, size: 30 * 1024 * 1024 }),
      routeCtx(),
    )
    expect(res.status).toBe(413)
    expect((await res.json()).code).toBe('FILE_TOO_LARGE')
  })

  it('returns 403 when parent uploads a photo', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const res = await POST(makeJsonReq(VALID_BODY), routeCtx())
    expect(res.status).toBe(403)
  })

  it('returns 403 when parent uploads parent_upload for non-owned student', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    mockFrom().mockReturnValueOnce(
      makeChain({ data: { id: STUDENT_ID, parent_user_ids: ['other-parent'] }, error: null }),
    )
    const res = await POST(
      makeJsonReq({ ...VALID_BODY, uploadType: 'parent_upload' }),
      routeCtx(),
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 when student not in school', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'nope' } }))
    const res = await POST(makeJsonReq(VALID_BODY), routeCtx())
    expect(res.status).toBe(404)
  })

  it('returns 200 with token, path, signedUrl on success', async () => {
    mockFrom().mockReturnValueOnce(
      makeChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null }),
    )
    mockStorage().mockReturnValueOnce(makeStorageBucket({
      data: {
        token:     'tok-xyz',
        path:      `${SCHOOL_ID}/${STUDENT_ID}/photo/123_photo.jpg`,
        signedUrl: 'https://example.supabase.co/.../sign/...',
      },
      error: null,
    }))
    const res = await POST(makeJsonReq(VALID_BODY), routeCtx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('tok-xyz')
    expect(body.path).toContain(`${SCHOOL_ID}/${STUDENT_ID}/photo/`)
    expect(body.signedUrl).toContain('https://')
  })
})
