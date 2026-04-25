// ============================================================
// lib/uploadInserters.test.ts
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  insertPhotoRow,
  insertHandwritingRow,
  insertParentUploadRow,
  InserterError,
} from './uploadInserters'

const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID    = 'clerk-user-123'
const PATH       = `${SCHOOL_ID}/${STUDENT_ID}/photo/123_x.jpg`

const CTX = { userId: USER_ID, schoolId: SCHOOL_ID, studentId: STUDENT_ID, storagePath: PATH }

interface MockChain {
  insert: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function makeChain(result: { data: unknown; error: unknown }): MockChain {
  const chain: MockChain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => vi.mocked(supabaseAdmin.from) as any

beforeEach(() => vi.clearAllMocks())

// ── insertPhotoRow ───────────────────────────────────────────

describe('insertPhotoRow', () => {
  it('inserts with the expected columns and returns the row', async () => {
    const chain = makeChain({ data: { id: 'photo-1' }, error: null })
    mockFrom().mockReturnValue(chain)

    const result = await insertPhotoRow(CTX, {
      caption: 'Field trip', dateTaken: '2026-04-01', term: 'Spring 2025-2026',
      category: 'field_trip', gradeLevel: 'Grade 1', academicYear: '2025-2026',
    })

    expect(result.row).toEqual({ id: 'photo-1' })
    expect(mockFrom()).toHaveBeenCalledWith('photos')
    const payload = chain.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      school_id:     SCHOOL_ID,
      student_id:    STUDENT_ID,
      storage_path:  PATH,
      caption:       'Field trip',
      date_taken:    '2026-04-01',
      term:          'Spring 2025-2026',
      category:      'field_trip',
      grade_level:   'Grade 1',
      academic_year: '2025-2026',
    })
    // Lockdown — photos table has no audit columns per CLAUDE.md task #12.
    expect(payload).not.toHaveProperty('created_by')
    expect(payload).not.toHaveProperty('updated_by')
    expect(payload).not.toHaveProperty('uploaded_by')
  })

  it('coerces missing optional fields to null', async () => {
    const chain = makeChain({ data: { id: 'photo-2' }, error: null })
    mockFrom().mockReturnValue(chain)

    await insertPhotoRow(CTX, { gradeLevel: 'K', academicYear: '2025-2026' })

    const payload = chain.insert.mock.calls[0][0]
    expect(payload.caption).toBeNull()
    expect(payload.date_taken).toBeNull()
    expect(payload.term).toBeNull()
    expect(payload.category).toBeNull()
  })

  it('throws InserterError on DB error', async () => {
    mockFrom().mockReturnValue(makeChain({ data: null, error: { message: 'boom' } }))
    await expect(insertPhotoRow(CTX, { gradeLevel: 'K', academicYear: '2025-2026' }))
      .rejects.toBeInstanceOf(InserterError)
  })
})

// ── insertHandwritingRow ─────────────────────────────────────

describe('insertHandwritingRow', () => {
  it('writes audit columns and returns the row', async () => {
    const chain = makeChain({ data: { id: 'hw-1' }, error: null })
    mockFrom().mockReturnValue(chain)

    const result = await insertHandwritingRow(CTX, {
      term: 'Fall 2025-2026', teacherNotes: 'good cursive', academicYear: '2025-2026',
    })

    expect(result.row).toEqual({ id: 'hw-1' })
    expect(mockFrom()).toHaveBeenCalledWith('handwriting_samples')
    const payload = chain.insert.mock.calls[0][0]
    expect(payload.created_by).toBe(USER_ID)
    expect(payload.updated_by).toBe(USER_ID)
    expect(payload.image_path).toBe(PATH)
    expect(payload.term).toBe('Fall 2025-2026')
    expect(payload.teacher_notes).toBe('good cursive')
    expect(payload.ocr_text).toBeNull()
  })

  it('throws InserterError on DB error', async () => {
    mockFrom().mockReturnValue(makeChain({ data: null, error: { message: 'fk' } }))
    await expect(insertHandwritingRow(CTX, { term: 'Fall 2025-2026', academicYear: '2025-2026' }))
      .rejects.toBeInstanceOf(InserterError)
  })
})

// ── insertParentUploadRow ────────────────────────────────────

describe('insertParentUploadRow', () => {
  it('writes uploaded_by + defaults category and title', async () => {
    const chain = makeChain({ data: { id: 'pu-1' }, error: null })
    mockFrom().mockReturnValue(chain)

    await insertParentUploadRow(CTX, {
      title: '', gradeLevel: 'Grade 1', academicYear: '2025-2026',
    })

    const payload = chain.insert.mock.calls[0][0]
    expect(payload.uploaded_by).toBe(USER_ID)
    expect(payload.category).toBe('other')
    expect(payload.upload_type).toBe('other')
    expect(payload.title).toBe('Untitled')
    // Lockdown — parent_uploads uses uploaded_by, not created_by/updated_by.
    expect(payload).not.toHaveProperty('created_by')
    expect(payload).not.toHaveProperty('updated_by')
  })

  it('passes through provided category and title', async () => {
    const chain = makeChain({ data: { id: 'pu-2' }, error: null })
    mockFrom().mockReturnValue(chain)

    await insertParentUploadRow(CTX, {
      title: 'Lost Compass', description: 'parent reading', date: '2026-04-20',
      category: 'art_craft', gradeLevel: 'Grade 1', academicYear: '2025-2026',
    })

    const payload = chain.insert.mock.calls[0][0]
    expect(payload.title).toBe('Lost Compass')
    expect(payload.description).toBe('parent reading')
    expect(payload.date).toBe('2026-04-20')
    expect(payload.category).toBe('art_craft')
    expect(payload.upload_type).toBe('art_craft')
  })

  it('throws InserterError on DB error', async () => {
    mockFrom().mockReturnValue(makeChain({ data: null, error: { message: 'boom' } }))
    await expect(insertParentUploadRow(CTX, {
      title: 'x', gradeLevel: 'K', academicYear: '2025-2026',
    })).rejects.toBeInstanceOf(InserterError)
  })
})
