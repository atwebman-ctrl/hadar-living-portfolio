// ============================================================
// app/api/dashboard/students/[studentId]/uploads/finalize/route.test.ts
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(), storage: { from: vi.fn() } },
}))
vi.mock('@/lib/revalidate', () => ({ revalidatePortfolio: vi.fn() }))

import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'
const ADMIN_CTX  = { userId: 'clerk-admin',  schoolId: SCHOOL_ID, role: 'admin'  as const }

const PHOTO_PATH = `${SCHOOL_ID}/${STUDENT_ID}/photo/123_x.jpg`
const HW_PATH    = `${SCHOOL_ID}/${STUDENT_ID}/handwriting/456_y.jpg`
const PU_PATH    = `${SCHOOL_ID}/${STUDENT_ID}/parent_upload/789_z.pdf`

interface QueryChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq:     ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function makeChain(result: { data: unknown; error: unknown }): QueryChain {
  const chain: QueryChain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    eq:     vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function makeStorageBucket(opts: {
  list?:   { data: unknown; error: unknown }
} = {}) {
  return {
    list: vi.fn().mockResolvedValue(opts.list ?? { data: [], error: null }),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom    = () => vi.mocked(supabaseAdmin.from) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStorage = () => vi.mocked(supabaseAdmin.storage.from) as any

const routeCtx = (id = STUDENT_ID) => ({ params: Promise.resolve({ studentId: id }) })

function makeJsonReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest
}

const PHOTO_BODY = {
  uploadType: 'photo' as const,
  path:       PHOTO_PATH,
  academicYear: '2025-2026',
  gradeLevel:   'Grade 1',
  metadata: { caption: 'Field trip', term: 'Spring 2025-2026', category: 'field_trip' },
}

describe('POST /api/dashboard/students/[studentId]/uploads/finalize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid JSON', async () => {
    const req = { json: () => Promise.reject(new SyntaxError('bad')) } as unknown as NextRequest
    const res = await POST(req, routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_BODY')
  })

  it('returns 400 on path mismatch (different student)', async () => {
    const res = await POST(
      makeJsonReq({ ...PHOTO_BODY, path: `${SCHOOL_ID}/22222222-2222-4222-8222-222222222222/photo/foo.jpg` }),
      routeCtx(),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('PATH_MISMATCH')
  })

  it('returns 400 on path mismatch (different uploadType)', async () => {
    const res = await POST(
      makeJsonReq({ ...PHOTO_BODY, path: HW_PATH }), // path under handwriting/, but uploadType=photo
      routeCtx(),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('PATH_MISMATCH')
  })

  it('returns 403 when parent uploads photo', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(403)
  })

  it('returns 404 when student not in school', async () => {
    mockFrom().mockReturnValueOnce(makeChain({ data: null, error: { message: 'nope' } }))
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(404)
  })

  it('returns 404 when uploaded file not in bucket', async () => {
    mockFrom().mockReturnValueOnce(
      makeChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null }),
    )
    mockStorage().mockReturnValueOnce(makeStorageBucket({ list: { data: [], error: null } }))
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('OBJECT_NOT_FOUND')
  })

  it('returns 201 with row on photo finalize success', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null })) // student lookup
      .mockReturnValueOnce(makeChain({ data: { id: 'photo-1' }, error: null }))                       // insert
    mockStorage().mockReturnValueOnce(makeStorageBucket({
      list: { data: [{ name: '123_x.jpg' }], error: null },
    }))
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.storagePath).toBe(PHOTO_PATH)
    expect(body.record).toEqual({ id: 'photo-1' })
  })

  it('returns 400 when handwriting finalize is missing term', async () => {
    mockFrom().mockReturnValueOnce(
      makeChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null }),
    )
    mockStorage().mockReturnValueOnce(makeStorageBucket({
      list: { data: [{ name: '456_y.jpg' }], error: null },
    }))
    const res = await POST(makeJsonReq({
      uploadType: 'handwriting', path: HW_PATH,
      academicYear: '2025-2026', gradeLevel: 'Grade 1', metadata: {},
    }), routeCtx())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('MISSING_TERM')
  })

  it('returns 201 on parent_upload finalize success', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ ...ADMIN_CTX, role: 'parent' })
    mockFrom()
      .mockReturnValueOnce(
        makeChain({ data: { id: STUDENT_ID, parent_user_ids: [ADMIN_CTX.userId] }, error: null }),
      )
      .mockReturnValueOnce(makeChain({ data: { id: 'pu-1' }, error: null }))
    mockStorage().mockReturnValueOnce(makeStorageBucket({
      list: { data: [{ name: '789_z.pdf' }], error: null },
    }))
    const res = await POST(makeJsonReq({
      uploadType: 'parent_upload', path: PU_PATH,
      academicYear: '2025-2026', gradeLevel: 'Grade 1',
      metadata: { title: 'Lost Compass', parent_upload_type: 'home_project' },
    }), routeCtx())
    expect(res.status).toBe(201)
    expect((await res.json()).record).toEqual({ id: 'pu-1' })
  })

  it('returns 500 on DB insert error', async () => {
    mockFrom()
      .mockReturnValueOnce(makeChain({ data: { id: STUDENT_ID, parent_user_ids: [] }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'boom' } }))
    mockStorage().mockReturnValueOnce(makeStorageBucket({
      list: { data: [{ name: '123_x.jpg' }], error: null },
    }))
    const res = await POST(makeJsonReq(PHOTO_BODY), routeCtx())
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })
})
