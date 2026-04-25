// ============================================================
// lib/useOptimisticList.ts
//
// Generic hook for "add and immediately reflect" UX on lists
// that are otherwise read from server-fetched props.
//
// Pattern: post-server-confirmed (NOT React's useOptimistic).
// The caller POSTs to the server, waits for the full row in the
// 201 response, then calls add(row). The hook keeps that row in
// local pending state and merges it with serverItems by id. When
// the server eventually re-renders with the new row in
// serverItems, dedupe-by-id naturally drops the pending copy on
// the next render — no flicker, no temp ids, no race.
//
// Why not useOptimistic: useOptimistic is designed for
// transition-scoped predictions that are reverted if the action
// throws. We're already past the server confirmation when add()
// is called, so the row is real. We just want to bridge the gap
// between "POST returned 201" and "Next.js cache propagated the
// new row back into the page's serverItems prop."
//
// Usage:
//   const { items, add } = useOptimisticList(readings)
//   <List items={items} />
//   <Form onSuccess={(row) => add(row)} />
// ============================================================

import { useState, useMemo, useCallback } from 'react'

export function useOptimisticList<T extends { id: string }>(
  serverItems: T[]
): { items: T[]; add: (item: T) => void } {
  const [pendingItems, setPendingItems] = useState<T[]>([])

  const items = useMemo(() => {
    const serverIds = new Set(serverItems.map((s) => s.id))
    return [...serverItems, ...pendingItems.filter((p) => !serverIds.has(p.id))]
  }, [serverItems, pendingItems])

  const add = useCallback((item: T) => {
    setPendingItems((prev) => [...prev, item])
  }, [])

  return { items, add }
}
