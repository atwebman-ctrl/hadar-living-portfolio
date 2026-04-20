'use client'

// ============================================================
// components/profiles/SubmitForReviewButton.tsx
//
// Shown on the profile overview when status='draft' and all
// required sections are complete. POSTs to the submit route;
// on success the page refreshes and the banner/state changes
// to 'in_review'.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  profileId: string
  disabled?: boolean
  disabledReason?: string
}

export default function SubmitForReviewButton({ profileId, disabled, disabledReason }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClick = async () => {
    if (!confirm('Submit this profile to Dr. Worth for review? You won\u2019t be able to edit sections while it\u2019s in review.')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/profiles/${profileId}/submit`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to submit.')
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || submitting}
        style={{
          height: 44, padding: '0 28px',
          background: (disabled || submitting) ? 'var(--ink-faint)' : 'var(--navy)',
          color: 'var(--white)', border: 'none', borderRadius: 6,
          cursor: (disabled || submitting) ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          opacity: (disabled || submitting) ? 0.6 : 1,
        }}
      >
        {submitting ? 'Submitting\u2026' : 'Submit for Review'}
      </button>
      {disabled && disabledReason && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)' }}>
          {disabledReason}
        </span>
      )}
      {error && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#B0413E' }}>
          {error}
        </span>
      )}
    </div>
  )
}
