// ============================================================
// lib/apiHelpers.test.ts
//
// Tests for dbErrorResponse — Postgres code mapping, traceId
// shape, info-leak guard, and structured logging.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import { dbErrorResponse } from './apiHelpers'

// Helper: build a minimal PostgrestError-shaped object. The runtime class
// is defined in @supabase/postgrest-js, but the helper only reads four
// fields (code, message, details, hint) — a structural cast is sufficient.
function pgError(over: Partial<PostgrestError> = {}): PostgrestError {
  return {
    name:    'PostgrestError',
    message: 'pg failure',
    code:    '00000',
    details: 'pg details',
    hint:    'pg hint',
    ...over,
  } as PostgrestError
}

const CTX = { route: 'POST /api/test', op: 'insert thing' }

describe('dbErrorResponse', () => {
  let errSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errSpy.mockRestore()
  })

  // ── Code mapping ────────────────────────────────────────────

  it('maps 23505 to 409 ALREADY_EXISTS', async () => {
    const res = dbErrorResponse(pgError({ code: '23505' }), CTX)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('ALREADY_EXISTS')
  })

  it('maps 23503 to 409 FK_CONSTRAINT', async () => {
    const res = dbErrorResponse(pgError({ code: '23503' }), CTX)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('FK_CONSTRAINT')
  })

  it('maps 23514 to 400 CHECK_VIOLATION', async () => {
    const res = dbErrorResponse(pgError({ code: '23514' }), CTX)
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('CHECK_VIOLATION')
  })

  it('maps unknown codes (23502, 42703) to 500 DB_ERROR', async () => {
    for (const code of ['23502', '42703']) {
      const res = dbErrorResponse(pgError({ code }), CTX)
      expect(res.status).toBe(500)
      expect((await res.json()).code).toBe('DB_ERROR')
    }
  })

  it('handles null err (DB layer returned no error object) as 500 DB_ERROR', async () => {
    const res = dbErrorResponse(null, CTX)
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('DB_ERROR')
  })

  // ── traceId shape ───────────────────────────────────────────

  it('includes a traceId in the response body', async () => {
    const res = dbErrorResponse(pgError({ code: '23505' }), CTX)
    const body = await res.json()
    expect(body.traceId).toBeTypeOf('string')
    expect(body.traceId.length).toBeGreaterThan(0)
  })

  it('traceId is exactly 8 characters', async () => {
    const res = dbErrorResponse(pgError(), CTX)
    const body = await res.json()
    expect(body.traceId).toHaveLength(8)
  })

  // ── Info-leak guard ─────────────────────────────────────────

  it('response body never contains message, details, or hint from the pg error', async () => {
    const err = pgError({
      code:    '23505',
      message: 'duplicate key value violates unique constraint "students_email_key"',
      details: 'Key (email)=(foo@bar.com) already exists.',
      hint:    'Change the email and retry.',
    })
    const res = dbErrorResponse(err, CTX)
    const body = await res.json()
    expect(body).not.toHaveProperty('message')
    expect(body).not.toHaveProperty('details')
    expect(body).not.toHaveProperty('hint')
    expect(body).not.toHaveProperty('pgMessage')
    expect(body).not.toHaveProperty('pgDetails')
    expect(body).not.toHaveProperty('pgHint')
    // And the raw strings should not appear anywhere in the serialized body
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain('students_email_key')
    expect(serialized).not.toContain('foo@bar.com')
    expect(serialized).not.toContain('Change the email')
  })

  // ── Logging contract ────────────────────────────────────────

  it('console.error is called exactly once per invocation', () => {
    dbErrorResponse(pgError({ code: '23505' }), CTX)
    expect(errSpy).toHaveBeenCalledTimes(1)
  })

  it('console.error payload includes traceId, route, op, and the four pg fields', async () => {
    const err = pgError({
      code:    '23514',
      message: 'check failed',
      details: 'value out of range',
      hint:    'use 1-12',
    })
    const res = dbErrorResponse(err, { route: 'POST /api/foo', op: 'insert foo' })
    const body = await res.json()

    // First arg is the prefix tag, second is the structured payload
    const [tag, payload] = errSpy.mock.calls[0] as [string, Record<string, unknown>]
    expect(tag).toBe('[dbError]')
    expect(payload.traceId).toBe(body.traceId)
    expect(payload.route).toBe('POST /api/foo')
    expect(payload.op).toBe('insert foo')
    expect(payload.pgCode).toBe('23514')
    expect(payload.pgMessage).toBe('check failed')
    expect(payload.pgDetails).toBe('value out of range')
    expect(payload.pgHint).toBe('use 1-12')
  })
})
