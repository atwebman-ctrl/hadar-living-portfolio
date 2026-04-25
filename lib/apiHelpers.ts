// ============================================================
// lib/apiHelpers.ts — Shared utilities for API route handlers.
//
// Server-only. Never import in client components or pages.
//
// Centralises error response shapes so AUTH_* codes and HTTP
// statuses can't drift between the growing number of routes.
// ============================================================

import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'
export { rateLimit } from './rateLimit'

/**
 * Maps errors thrown by lib/auth.ts to the correct HTTP status and
 * a safe, user-facing message. Call this in the catch block of every
 * getAuthContext() / requireRole() call.
 *
 *   AUTH_FORBIDDEN | AUTH_INVALID_ROLE  → 403
 *   AUTH_UNAUTHENTICATED | AUTH_NO_ORG | AUTH_NO_SCHOOL → 401
 */
export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
    { status: 429 },
  )
}

export function authErrorResponse(err: Error): NextResponse {
  const msg = err.message
  if (msg.startsWith('AUTH_FORBIDDEN') || msg.startsWith('AUTH_INVALID_ROLE')) {
    return NextResponse.json(
      { error: 'You do not have permission to perform this action.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  return NextResponse.json(
    { error: 'Authentication required.', code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}

// ── Database error helpers ────────────────────────────────────
//
// One structured log line + one short traceId per DB failure. The
// traceId goes into both the log and the client response so a user
// reporting an error can be matched to the exact server-side line.
// err.message / err.details / err.hint are NEVER returned to the
// client — they can carry constraint names, table names, and row
// fragments that we don't want to leak to authenticated-but-untrusted
// callers (parents, etc.).

const PG_CODE_MAP: Record<string, { status: number; code: string }> = {
  '23505': { status: 409, code: 'ALREADY_EXISTS' },
  '23503': { status: 409, code: 'FK_CONSTRAINT' },
  '23514': { status: 400, code: 'CHECK_VIOLATION' },
}

export interface DbErrorContext {
  /** Route prefix for log correlation, e.g. 'POST /api/dashboard/students'. */
  route: string
  /** The DB operation that failed, e.g. 'insert student' or 'update assessment'. */
  op: string
}

export interface DbErrorTrace {
  traceId: string
  code: string
  status: number
}

/**
 * Logs one structured line for a Supabase DB failure and returns the
 * trace metadata. Use this directly when you need to inline the trace
 * into a richer response shape (e.g. bulk endpoints with per-row
 * errors). For ordinary single-row routes, prefer dbErrorResponse().
 */
export function logDbError(
  err: PostgrestError | null,
  context: DbErrorContext,
): DbErrorTrace {
  const traceId = crypto.randomUUID().slice(0, 8)
  const mapping = (err?.code && PG_CODE_MAP[err.code]) || { status: 500, code: 'DB_ERROR' }

  console.error('[dbError]', {
    traceId,
    route:     context.route,
    op:        context.op,
    pgCode:    err?.code    ?? null,
    pgMessage: err?.message ?? null,
    pgDetails: err?.details ?? null,
    pgHint:    err?.hint    ?? null,
  })

  return { traceId, code: mapping.code, status: mapping.status }
}

/**
 * Returns a NextResponse for a Supabase DB failure. Logs one structured
 * line with a traceId; the client receives only { error, code, traceId }
 * — never err.message / err.details / err.hint.
 *
 * Postgres code mapping:
 *   23505 → 409 ALREADY_EXISTS
 *   23503 → 409 FK_CONSTRAINT
 *   23514 → 400 CHECK_VIOLATION
 *   anything else (or null err) → 500 DB_ERROR
 */
export function dbErrorResponse(
  err: PostgrestError | null,
  context: DbErrorContext,
): NextResponse {
  const { traceId, code, status } = logDbError(err, context)
  return NextResponse.json(
    { error: 'Database operation failed.', code, traceId },
    { status },
  )
}
