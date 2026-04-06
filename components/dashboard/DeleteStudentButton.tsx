'use client'

// ============================================================
// components/dashboard/DeleteStudentButton.tsx
//
// Soft-archive button rendered on each StudentCard (admin/teacher).
// Calls DELETE /api/dashboard/students/[studentId] and refreshes
// the page on success. Demo students are guarded server-side too,
// but the button itself is hidden for them client-side.
// ============================================================

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteStudentButton({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Failed to archive student.')
        setConfirming(false)
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error.')
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  if (confirming) {
    return (
      <div
        style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}
        onClick={(e) => e.preventDefault()}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: 'var(--ink-light)',
            flex: 1,
          }}
        >
          Archive this student?
        </span>
        <button
          onClick={handleDelete}
          disabled={busy}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#b91c1c',
            background: 'none',
            border: '1px solid #b91c1c',
            padding: '0.2rem 0.5rem',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Archiving…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-light)',
            background: 'none',
            border: '1px solid var(--rule)',
            padding: '0.2rem 0.5rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--rule)' }}
      onClick={(e) => e.preventDefault()}
    >
      {error && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: '#b91c1c',
            margin: '0 0 0.4rem',
          }}
        >
          {error}
        </p>
      )}
      <button
        onClick={() => setConfirming(true)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Archive student
      </button>
    </div>
  )
}
