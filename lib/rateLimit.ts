// ============================================================
// lib/rateLimit.ts
//
// Simple in-memory sliding window rate limiter.
// Not shared across Vercel serverless instances, but sufficient
// to prevent single-origin abuse. Upgrade to Upstash Redis
// when scaling past ~10 concurrent serverless instances.
// ============================================================

const windowMs = 60_000 // 1 minute window
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  maxPerMinute: number,
): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxPerMinute - 1 }
  }

  if (entry.count >= maxPerMinute) {
    return { ok: false, remaining: 0 }
  }

  entry.count++
  return { ok: true, remaining: maxPerMinute - entry.count }
}

// Periodic cleanup to prevent memory leaks in long-lived instances
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key)
  }
}, 60_000)
