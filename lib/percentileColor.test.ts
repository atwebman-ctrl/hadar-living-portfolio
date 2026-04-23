import { describe, it, expect } from 'vitest'
import { percentileColor } from './percentileColor'

describe('percentileColor', () => {
  it('returns ink-mid for null', () => {
    expect(percentileColor(null)).toBe('var(--ink-mid)')
  })

  it('returns ink-mid for undefined', () => {
    expect(percentileColor(undefined)).toBe('var(--ink-mid)')
  })

  it('returns gold for 95', () => {
    expect(percentileColor(95)).toBe('var(--gold)')
  })

  it('returns gold for 99', () => {
    expect(percentileColor(99)).toBe('var(--gold)')
  })

  it('returns gold for 100', () => {
    expect(percentileColor(100)).toBe('var(--gold)')
  })

  it('returns ink for 94 (just below celebration threshold)', () => {
    expect(percentileColor(94)).toBe('var(--ink)')
  })

  it('returns ink for 50', () => {
    expect(percentileColor(50)).toBe('var(--ink)')
  })

  it('returns ink for 10 (previously crimson tier)', () => {
    expect(percentileColor(10)).toBe('var(--ink)')
  })

  it('returns ink for 0', () => {
    expect(percentileColor(0)).toBe('var(--ink)')
  })
})
