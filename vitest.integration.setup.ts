// ============================================================
// Integration test global setup.
//
// PRODUCTION GUARD: refuses to run if NEXT_PUBLIC_SUPABASE_URL
// points anywhere other than 127.0.0.1 / localhost. This is the
// last line of defense against a stray .env.local leaking into
// a test run and pointing the suite at the production database.
//
// Also mocks next/cache (same as the unit suite).
// ============================================================

import { vi } from 'vitest'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const isLocal =
  url.startsWith('http://127.0.0.1:') ||
  url.startsWith('http://localhost:')

if (!isLocal) {
  throw new Error(
    `Integration tests refused to start.\n` +
      `NEXT_PUBLIC_SUPABASE_URL must point at the local Supabase container ` +
      `(127.0.0.1 or localhost). Got: ${url || '(unset)'}\n` +
      `Check that .env.test is loaded and that SUPABASE env vars from .env.local ` +
      `are not leaking into the test environment.`,
  )
}

// Service role key must also be the local demo JWT — the local key is issued
// by supabase-demo and is recognizable by its "supabase-demo" issuer claim.
// We do a cheap sanity check on the payload substring rather than decoding the JWT.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (serviceKey && !serviceKey.includes('supabase-demo')) {
  // Decode-free heuristic: the local demo JWT's payload base64-encodes the
  // issuer 'supabase-demo'. Real prod keys will not contain this string.
  // If this ever false-positives we can switch to proper JWT decoding.
  const decoded = tryDecodeJwtPayload(serviceKey)
  if (decoded && decoded.iss !== 'supabase-demo') {
    throw new Error(
      `Integration tests refused to start.\n` +
        `SUPABASE_SERVICE_ROLE_KEY is not the local Supabase demo key ` +
        `(iss="${decoded.iss}"). Aborting to protect production data.`,
    )
  }
}

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
  revalidatePath: vi.fn(),
}))

function tryDecodeJwtPayload(jwt: string): { iss?: string } | null {
  try {
    const [, payload] = jwt.split('.')
    if (!payload) return null
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    return JSON.parse(json) as { iss?: string }
  } catch {
    return null
  }
}
