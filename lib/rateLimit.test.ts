// ============================================================
// lib/rateLimit.test.ts
// ============================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { rateLimit } from './rateLimit'

// The module uses a module-level Map for state. Re-importing between
// tests won't reset it, so we use fake timers to advance past window
// boundaries instead of trying to reset the Map directly.

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request and returns correct remaining count', () => {
    const result = rateLimit('test-user:unique-key-1', 5)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows requests up to but not exceeding the limit', () => {
    const key = 'test-user:unique-key-2'
    const max = 3

    const r1 = rateLimit(key, max)
    const r2 = rateLimit(key, max)
    const r3 = rateLimit(key, max)

    expect(r1.ok).toBe(true)
    expect(r1.remaining).toBe(2)
    expect(r2.ok).toBe(true)
    expect(r2.remaining).toBe(1)
    expect(r3.ok).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests once the limit is reached', () => {
    const key = 'test-user:unique-key-3'
    const max = 2

    rateLimit(key, max) // 1st
    rateLimit(key, max) // 2nd — hits limit

    const blocked = rateLimit(key, max) // 3rd — over limit
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets the counter after the window expires', () => {
    const key = 'test-user:unique-key-4'
    const max = 2

    rateLimit(key, max) // 1st
    rateLimit(key, max) // 2nd — limit reached
    expect(rateLimit(key, max).ok).toBe(false)

    // Advance past the 60-second window
    vi.advanceTimersByTime(61_000)

    // Should be allowed again with a fresh counter
    const afterReset = rateLimit(key, max)
    expect(afterReset.ok).toBe(true)
    expect(afterReset.remaining).toBe(1)
  })

  it('tracks different keys independently', () => {
    const max = 1

    const r1 = rateLimit('user-a:endpoint', max)
    const r2 = rateLimit('user-b:endpoint', max)

    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)

    // Both keys are now at limit
    expect(rateLimit('user-a:endpoint', max).ok).toBe(false)
    expect(rateLimit('user-b:endpoint', max).ok).toBe(false)
  })
})
