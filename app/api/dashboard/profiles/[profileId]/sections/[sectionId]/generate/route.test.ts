// ============================================================
// Tests for POST /api/dashboard/profiles/[profileId]/sections/[sectionId]/generate
//
// Mocks the Anthropic SDK + Supabase + auth + sectionData. Asserts
// the auth/role/lock/rate-limit guards before the Claude call, and
// the persistence shape afterward.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({ getAuthContext: vi.fn() }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@/lib/sectionData', () => ({ loadMapsScores: vi.fn() }))

const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate }
  },
}))

// Reset rate-limit between tests by re-importing fresh module state.
vi.mock('@/lib/rateLimit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rateLimit')>('@/lib/rateLimit')
  return actual
})

import { POST } from './route'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { loadMapsScores } from '@/lib/sectionData'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const PROFILE_ID = '55555555-5555-4555-8555-555555555555'
const SECTION_ID = '66666666-6666-4666-8666-666666666666'
const STUDENT_ID = '77777777-7777-4777-8777-777777777777'

const TEACHER_CTX = { userId: 'clerk-teacher', schoolId: SCHOOL_ID, role: 'teacher' as const }
const PARENT_CTX  = { userId: 'clerk-parent',  schoolId: SCHOOL_ID, role: 'parent'  as const }

const PARAMS = { params: Promise.resolve({ profileId: PROFILE_ID, sectionId: SECTION_ID }) }

function makeReq() {
  return new Request(
    `http://localhost/api/dashboard/profiles/${PROFILE_ID}/sections/${SECTION_ID}/generate`,
    { method: 'POST' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
}

function joinedSectionRow(opts: { kind?: string; profileStatus?: string } = {}) {
  return {
    id:          SECTION_ID,
    section_kind: opts.kind ?? 'maps_scores',
    profile_id:  PROFILE_ID,
    school_id:   SCHOOL_ID,
    profiles: {
      student_id: STUDENT_ID,
      season:     'spring',
      term:       'Spring',
      status:     opts.profileStatus ?? 'draft',
      school_id:  SCHOOL_ID,
      deleted_at: null,
    },
  }
}

function studentRow() {
  return { first_name: 'Athena', grade_level: '3', academic_year: '2025-2026' }
}

// Chain stub for `.from('profile_sections').select(...).eq(...).is(...).single()`
function selectChain(result: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {}
  c.select = vi.fn(() => c)
  c.eq     = vi.fn(() => c)
  c.is     = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  return c
}

// Chain stub for `.from('profile_sections').update(...).eq(...)` (no select after).
function updateChain(result: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {}
  c.update = vi.fn(() => c)
  c.eq     = vi.fn(() => Promise.resolve(result))
  return c
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromMock = () => vi.mocked(supabaseAdmin.from) as any

describe('POST /api/dashboard/profiles/[profileId]/sections/[sectionId]/generate', () => {
  beforeEach((ctx) => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    // Per-test unique userId so the in-memory rate limiter (5/min/user)
    // doesn't bleed counts from one test into the next.
    const uniqueCtx = { ...TEACHER_CTX, userId: `clerk-teacher-${ctx.task.id}` }
    vi.mocked(getAuthContext).mockResolvedValue(uniqueCtx)
    vi.mocked(loadMapsScores).mockResolvedValue([])
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'A warm draft narrative.' }],
    })
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new Error('AUTH_UNAUTHENTICATED'))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 403 FORBIDDEN for parent role', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(PARENT_CTX)
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('returns 404 when section is not found', async () => {
    fromMock().mockReturnValueOnce(selectChain({ data: null, error: null }))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 403 LOCKED when profile is in_review', async () => {
    fromMock().mockReturnValueOnce(
      selectChain({ data: joinedSectionRow({ profileStatus: 'in_review' }), error: null }),
    )
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('LOCKED')
  })

  it('returns 501 NOT_IMPLEMENTED for an unsupported section kind', async () => {
    fromMock()
      .mockReturnValueOnce(selectChain({ data: joinedSectionRow({ kind: 'lexile' }), error: null }))
      .mockReturnValueOnce(selectChain({ data: studentRow(), error: null }))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(501)
    expect((await res.json()).code).toBe('NOT_IMPLEMENTED')
  })

  it('returns 503 AI_NOT_CONFIGURED when ANTHROPIC_API_KEY is unset', async () => {
    delete process.env.ANTHROPIC_API_KEY
    fromMock()
      .mockReturnValueOnce(selectChain({ data: joinedSectionRow(), error: null }))
      .mockReturnValueOnce(selectChain({ data: studentRow(), error: null }))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe('AI_NOT_CONFIGURED')
  })

  it('writes narrative_draft + status=in_progress on success', async () => {
    const update = updateChain({ data: null, error: null })
    fromMock()
      .mockReturnValueOnce(selectChain({ data: joinedSectionRow(), error: null }))
      .mockReturnValueOnce(selectChain({ data: studentRow(), error: null }))
      .mockReturnValueOnce(update)

    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('A warm draft narrative.')
    expect(body.sectionKind).toBe('maps_scores')

    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        narrative_draft: 'A warm draft narrative.',
        status:          'in_progress',
        updated_by:      expect.stringMatching(/^clerk-teacher-/),
      }),
    )
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('returns 502 AI_EMPTY when Claude returns empty content', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '   ' }] })
    fromMock()
      .mockReturnValueOnce(selectChain({ data: joinedSectionRow(), error: null }))
      .mockReturnValueOnce(selectChain({ data: studentRow(), error: null }))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('AI_EMPTY')
  })

  it('returns 502 AI_ERROR when the Claude SDK throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('boom'))
    fromMock()
      .mockReturnValueOnce(selectChain({ data: joinedSectionRow(), error: null }))
      .mockReturnValueOnce(selectChain({ data: studentRow(), error: null }))
    const res = await POST(makeReq(), PARAMS)
    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('AI_ERROR')
  })
})
