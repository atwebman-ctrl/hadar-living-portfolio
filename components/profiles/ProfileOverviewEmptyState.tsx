'use client'

// ============================================================
// components/profiles/ProfileOverviewEmptyState.tsx
//
// Centered card with "Start [season] [year] profile" CTA.
// POSTs to /api/dashboard/profiles, then router.refresh()
// to flip the parent server component into the filled state.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/lib/types'
import {
  PAGE, SHELL, EYEBROW,
  EMPTY_CARD, EMPTY_HEADING, EMPTY_BODY,
  PRIMARY_BTN, ERR_TEXT, SEASON_LABEL,
} from './profileOverviewStyles'

type Props = {
  student: Student
  season: 'fall' | 'spring'
  academicYearLabel: string
}

export default function ProfileOverviewEmptyState({
  student, season, academicYearLabel,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onStart = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/dashboard/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          season,
          academicYearLabel,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? 'Failed to start profile.')
      }
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to start profile.')
      setBusy(false)
    }
  }

  return (
    <div style={PAGE}>
      <div style={SHELL}>
        <div style={EYEBROW}>
          {student.firstName} {student.lastName} · Profile Builder
        </div>
        <div style={EMPTY_CARD}>
          <h1 style={EMPTY_HEADING}>
            No profile for {SEASON_LABEL[season]} {academicYearLabel} yet
          </h1>
          <p style={EMPTY_BODY}>
            A profile gathers {student.firstName}&rsquo;s assessment scores,
            reading list, writing samples, and teacher narratives for the
            semester into a single document for parents and the Head of
            School to review.
          </p>
          <button
            type="button"
            style={{
              ...PRIMARY_BTN,
              opacity: busy ? 0.55 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
            disabled={busy}
            onClick={onStart}
          >
            {busy ? 'Starting…' : `Start ${SEASON_LABEL[season]} ${academicYearLabel} profile`}
          </button>
          {err && <p style={ERR_TEXT}>{err}</p>}
        </div>
      </div>
    </div>
  )
}
