'use client'

// ============================================================
// components/portfolio/HubShell.tsx
//
// Client wrapper for the portfolio hub page. Composes
// HeroSection + PortfolioHub (dashboard grid). Receives
// pre-fetched data from the server component.
// ============================================================

import type { UserRole, PortfolioData } from '@/lib/types'
import HeroSection from '@/components/portfolio/HeroSection'
import layoutStyles from '@/components/portfolio/layout.module.css'
import InviteParentButton from '@/components/shared/InviteParentButton'
import PortfolioHub from '@/components/portfolio/PortfolioHub'

interface Props {
  portfolio: PortfolioData
  studentId: string
  role:      UserRole
}

export default function HubShell({ portfolio, studentId, role }: Props) {
  const canInvite = role === 'admin' || role === 'teacher'

  return (
    <div className={layoutStyles.main}>
      <HeroSection
        student={portfolio.student}
        school={portfolio.school}
        studentId={studentId}
        assessments={portfolio.assessments}
        role={role}
        compact
        inviteButton={canInvite ? <InviteParentButton studentId={studentId} /> : undefined}
      />
      <PortfolioHub portfolio={portfolio} studentId={studentId} role={role} />
    </div>
  )
}
