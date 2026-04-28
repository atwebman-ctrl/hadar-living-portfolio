'use client'

// ============================================================
// components/profiles/ResetForDemoButton.tsx
//
// Subtle plum button shown beside the published banner on the
// Profile Overview when the viewing admin lands on a demo
// student's published profile. Flips the profile back to
// in_review so the review queue can be re-played for a demo.
//
// Server gates: admin role + student.is_demo + status=published.
// Client gates mirror the server — the button never renders
// otherwise.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  profileId: string
}

export default function ResetForDemoButton({ profileId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const onClick = async () => {
    if (!confirm('Reset this published profile to “in review” for a demo? Reviewer fields will be cleared.')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/profiles/${profileId}/reset-demo`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to reset.')
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      setError('Network error.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={submitting}
        style={{
          height: 30, padding: '0 14px',
          background: 'transparent',
          color: 'var(--plum, #8a3a66)',
          border: '1px solid var(--plum, #8a3a66)',
          borderRadius: 4,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          opacity: submitting ? 0.6 : 0.9,
        }}
      >
        {submitting ? 'Resetting…' : 'Reset for demo'}
      </button>
      {error && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#B0413E' }}>
          {error}
        </span>
      )}
    </div>
  )
}
