'use client'

// ============================================================
// components/portfolio/PortfolioHub.tsx
//
// Hub overview: summary banner + 6-card dashboard grid +
// bottom tiles for Teacher journal and Gallery.
// ============================================================

import type React from 'react'
import type { PortfolioData, Student, UserRole } from '@/lib/types'
import InlineEditableText from '@/components/shared/InlineEditableText'
import {
  MathCard,
  EnglishCard,
  HebrewCard,
  CanonCard,
  SoulcraftCard,
} from './DashboardCards'
import grid from './DashboardGrid.module.css'

interface Props {
  portfolio: PortfolioData
  studentId: string
  role:      UserRole
}

// ── Icons ─────────────────────────────────────────────────────

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
  </svg>
)

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

// ── Summary banner ────────────────────────────────────────────

function SummaryBanner({ student, studentId, canEdit }: {
  student:   Student
  studentId: string
  canEdit:   boolean
}) {
  // TODO: Show "AI draft" badge when progress_summary is AI-generated.
  const save = async (next: string) => {
    const res = await fetch(`/api/dashboard/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ progressSummary: next }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Failed to save progress summary')
    }
  }

  return (
    <div className={grid.summaryBanner}>
      <div>
        <span className={grid.summaryLabel}>Progress summary</span>
      </div>
      <InlineEditableText
        value={student.progressSummary ?? ''}
        placeholder="Click to add a progress summary for this student…"
        onSave={save}
        canEdit={canEdit}
        maxLength={1000}
        textStyle={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--ink)', margin: '0.35rem 0 0' }}
      />
    </div>
  )
}

// ── Bottom link tile ──────────────────────────────────────────

function BottomLink({ href, icon, title, subtitle }: {
  href:     string
  icon:     React.ReactNode
  title:    string
  subtitle: string
}) {
  return (
    <a href={href} className={grid.bottomLink}>
      <div className={grid.bottomLinkIcon}>{icon}</div>
      <div>
        <h3 className={grid.bottomLinkTitle}>{title}</h3>
        <p className={grid.bottomLinkSubtitle}>{subtitle}</p>
      </div>
    </a>
  )
}

// ── Hub ───────────────────────────────────────────────────────

export default function PortfolioHub({ portfolio, studentId, role }: Props) {
  const canEdit = role === 'admin' || role === 'teacher'

  const noteCount   = portfolio.teacherNotes.length
  const photoCount  = portfolio.photos.length
  const parentCount = portfolio.parentUploads.length

  const showBanner = role !== 'parent' || !!portfolio.student.progressSummary?.trim()

  return (
    <div style={{ padding: '1.5rem 2.5rem 3rem' }}>
      {showBanner && (
        <SummaryBanner
          student={portfolio.student}
          studentId={studentId}
          canEdit={canEdit}
        />
      )}

      <div className={grid.grid}>
        <MathCard      assessments={portfolio.assessments} studentId={studentId} />
        <EnglishCard   assessments={portfolio.assessments} studentId={studentId} />
        <HebrewCard    assessments={portfolio.assessments} studentId={studentId} />
        <CanonCard     readings={portfolio.readings}       studentId={studentId} />
        <SoulcraftCard characterAwards={portfolio.characterAwards} studentId={studentId} />
      </div>

      <div className={grid.bottomLinks}>
        <BottomLink
          href={`/portfolio/${studentId}/journal`}
          icon={<DocumentIcon />}
          title="Teacher journal"
          subtitle={`${noteCount} note${noteCount !== 1 ? 's' : ''}`}
        />
        <BottomLink
          href={`/portfolio/${studentId}/gallery`}
          icon={<ImageIcon />}
          title="Gallery"
          subtitle={`${photoCount} photo${photoCount !== 1 ? 's' : ''} · ${parentCount} parent upload${parentCount !== 1 ? 's' : ''}`}
        />
      </div>
    </div>
  )
}
