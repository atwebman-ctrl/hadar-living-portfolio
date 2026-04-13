// ============================================================
// app/api/dashboard/settings/logo/route.test.ts
//
// Tests for POST /api/dashboard/settings/logo
// Covers: admin happy path, auth rejection, non-admin role,
// non-image file type, and file-too-large.
// Storage + DB + revalidate calls are mocked.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/revalidate', () => ({ revalidateSchool: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from:    vi.fn(),
    storage: { from: vi.fn() },
  },
}))

import { getAuthContext } from '@/lib/auth'
import { revalidateSchool } from '@/lib/revalidate'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Constants ─────────────────────────────────────────────────

const SCHOOL_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const ADMIN_CTX   = { userId: 'clerk-admin',   schoolId: SCHOOL_ID, role: 'admin'   as const }
const TEACHER_CTX = { userId: 'clerk-teacher', schoolId: SCHOOL_ID, role: 'teacher' as const }

// ── Helpers ───────────────────────────────────────────────────

function makeSchoolsUpdateChain(error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.update = vi.fn(() => chain)
  chain.eq     = vi.fn(() => Promise.resolve({ error }))
  return chain
}

function makeStorageBucket(opts: { uploadError?: string | null } = {}) {
  return {
    list:         vi.fn().mockResolvedValue({ data: [], error: null }),
    remove:       vi.fn().mockResolvedValue({ data: [], error: null }),
    upload:       vi.fn().mockResolvedValue({ error: opts.uploadError ? { message: opts.uploadError } : null }),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: `https://cdn.test/${SCHOOL_ID}/logo.png` } })),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom    = () => vi.mocked(supabaseAdmin.from)         as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStorage = () => vi.mocked(supabaseAdmin.storage.from) as any

function makeImageFile(size = 1024, type = 'image/png', name = 'logo.png'): File {
  return new File([new Uint8Array(size)], name, { type })
}

function makeFormReq(fields: Record<string, string | File>): NextRequest {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return { formData: () => Promise.resolve(fd) } as unknown as NextRequest
}

// ── Tests ─────────────────────────────────────────────────────

describe('POST /api/dashboard/settings/logo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthContext).mockResolvedValue(ADMIN_CTX)
  })

  it('returns 401 when getAuthContext throws', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const req = makeFormReq({ file: makeImageFile() })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when the caller is a teacher', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(TEACHER_CTX)
    const req = makeFormReq({ file: makeImageFile() })
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 400 when no file is provided', async () => {
    const req = makeFormReq({})
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('MISSING_FILE')
  })

  it('returns 400 when the uploaded file is not an image', async () => {
    const pdf = new File([new Uint8Array(1024)], 'logo.pdf', { type: 'application/pdf' })
    const req = makeFormReq({ file: pdf })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_TYPE')
  })

  it('returns 413 when the file exceeds 2 MB', async () => {
    const big = makeImageFile(2 * 1024 * 1024 + 1)
    const req = makeFormReq({ file: big })
    const res = await POST(req)
    expect(res.status).toBe(413)
    expect((await res.json()).code).toBe('FILE_TOO_LARGE')
  })

  it('returns 502 on storage upload error', async () => {
    mockStorage().mockReturnValue(makeStorageBucket({ uploadError: 'boom' }))
    const req = makeFormReq({ file: makeImageFile() })
    const res = await POST(req)
    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('STORAGE_ERROR')
  })

  it('returns 200 with logoUrl on a successful admin upload', async () => {
    mockStorage().mockReturnValue(makeStorageBucket())
    mockFrom().mockReturnValueOnce(makeSchoolsUpdateChain(null))
    const req = makeFormReq({ file: makeImageFile() })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.logoUrl).toMatch(/^https:\/\/cdn\.test\/.*logo\.png\?v=\d+$/)
    expect(revalidateSchool).toHaveBeenCalledWith(SCHOOL_ID)
  })
})
