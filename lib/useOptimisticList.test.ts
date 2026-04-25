// @vitest-environment jsdom
// ============================================================
// lib/useOptimisticList.test.ts
//
// Tests for the post-server-confirmed optimistic list hook.
// ============================================================

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOptimisticList } from './useOptimisticList'

interface Item { id: string; name: string }

describe('useOptimisticList', () => {
  it('returns an empty list when serverItems is empty and nothing is pending', () => {
    const { result } = renderHook(() => useOptimisticList<Item>([]))
    expect(result.current.items).toEqual([])
  })

  it('returns the serverItems unchanged when nothing is pending', () => {
    const server: Item[] = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }]
    const { result } = renderHook(() => useOptimisticList<Item>(server))
    expect(result.current.items).toEqual(server)
  })

  it('add() appends a pending item and items reflects it immediately', () => {
    const server: Item[] = [{ id: '1', name: 'a' }]
    const { result } = renderHook(() => useOptimisticList<Item>(server))
    act(() => result.current.add({ id: '2', name: 'b-pending' }))
    expect(result.current.items).toEqual([
      { id: '1', name: 'a' },
      { id: '2', name: 'b-pending' },
    ])
  })

  it('drops the pending copy once the server list contains the same id', () => {
    const initial: Item[] = [{ id: '1', name: 'a' }]
    const { result, rerender } = renderHook(
      ({ server }: { server: Item[] }) => useOptimisticList<Item>(server),
      { initialProps: { server: initial } },
    )
    act(() => result.current.add({ id: '2', name: 'b-pending' }))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[1]).toEqual({ id: '2', name: 'b-pending' })

    rerender({ server: [{ id: '1', name: 'a' }, { id: '2', name: 'b-from-server' }] })
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[1]).toEqual({ id: '2', name: 'b-from-server' })
  })
})
