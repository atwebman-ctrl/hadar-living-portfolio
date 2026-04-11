// ============================================================
// lib/apiHelpers.ts — Shared utilities for API route handlers.
//
// Server-only. Never import in client components or pages.
//
// Centralises error response shapes so AUTH_* codes and HTTP
// statuses can't drift between the growing number of routes.
// ============================================================

import { NextResponse } from 'next/server'
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
