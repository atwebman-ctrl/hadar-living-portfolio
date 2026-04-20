'use client'

// ============================================================
// components/dashboard/ReviewActionBar.tsx
//
// Sticky action bar shown at the bottom of the review-queue
// preview page. Admin (Head of School) Approves or Requests
// Changes on an in_review profile.
//
// Request Changes opens a modal that collects feedback text
// (1–2000 chars). Approve is a direct confirm.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  profileId: string
}

export default function ReviewActionBar({ profileId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [feedback,   setFeedback]   = useState('')

  const approve = async () => {
    if (!confirm('Approve and publish this profile? Parents will see it immediately.')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/profiles/${profileId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to approve.')
        setSubmitting(false)
        return
      }
      router.push('/dashboard/review-queue')
      router.refresh()
    } catch {
      setError('Network error.')
      setSubmitting(false)
    }
  }

  const requestChanges = async () => {
    if (feedback.trim().length < 1) {
      setError('Feedback is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/profiles/${profileId}/request-changes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ feedback: feedback.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to request changes.')
        setSubmitting(false)
        return
      }
      setShowModal(false)
      router.push('/dashboard/review-queue')
      router.refresh()
    } catch {
      setError('Network error.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={BAR}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
          {error && <span style={ERR}>{error}</span>}
          <button
            type="button"
            onClick={() => { setError(null); setShowModal(true) }}
            disabled={submitting}
            style={SECONDARY_BTN}
          >
            Request changes
          </button>
          <button
            type="button"
            onClick={approve}
            disabled={submitting}
            style={PRIMARY_BTN}
          >
            {submitting ? 'Approving…' : 'Approve & Publish'}
          </button>
        </div>
      </div>

      {showModal && (
        <div style={MODAL_OVERLAY} onClick={() => !submitting && setShowModal(false)}>
          <div style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
            <h2 style={MODAL_TITLE}>Request changes</h2>
            <p style={MODAL_HINT}>
              Write a short note for the teacher. They&apos;ll see this banner on the profile overview until they re-submit.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={2000}
              rows={8}
              placeholder="e.g. The Character section reads thin — please add a concrete example from the Tefillah observation."
              style={TEXTAREA}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={COUNTER}>{feedback.length}/2000</span>
              {error && <span style={ERR}>{error}</span>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting} style={SECONDARY_BTN}>
                  Cancel
                </button>
                <button type="button" onClick={requestChanges} disabled={submitting || feedback.trim().length < 1} style={PRIMARY_BTN}>
                  {submitting ? 'Sending…' : 'Send feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const BAR: React.CSSProperties = {
  position: 'sticky', bottom: 0, left: 0, right: 0,
  background: 'var(--white)', borderTop: '1px solid var(--rule)',
  padding: '14px 24px', zIndex: 10,
}
const PRIMARY_BTN: React.CSSProperties = {
  height: 40, padding: '0 20px', background: 'var(--navy)', color: 'var(--white)',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
const SECONDARY_BTN: React.CSSProperties = {
  height: 40, padding: '0 20px', background: 'transparent', color: 'var(--navy)',
  border: '1px solid var(--rule)', borderRadius: 6, cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
const ERR: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: '#B0413E',
}
const MODAL_OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(20,30,50,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}
const MODAL_PANEL: React.CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: 24, width: '100%', maxWidth: 560,
}
const MODAL_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500,
  color: 'var(--navy)', margin: 0,
}
const MODAL_HINT: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)',
  margin: '8px 0 16px',
}
const TEXTAREA: React.CSSProperties = {
  width: '100%', padding: 12, border: '1px solid var(--rule)',
  borderRadius: 6, background: 'var(--cream)',
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
  resize: 'vertical',
}
const COUNTER: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
  letterSpacing: '0.06em',
}
