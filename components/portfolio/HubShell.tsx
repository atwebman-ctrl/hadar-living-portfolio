'use client'

// ============================================================
// components/portfolio/HubShell.tsx
//
// Client wrapper for the portfolio hub page. Owns selectedYear
// state and composes HeroSection + YearSelector + PortfolioHub.
// Receives pre-fetched data from the server component.
// ============================================================

import { useState, useMemo } from 'react'
import type { UserRole, PortfolioData } from '@/lib/types'
import HeroSection from '@/components/portfolio/HeroSection'
import InviteParentButton from '@/components/shared/InviteParentButton'
import YearSelector from '@/components/portfolio/YearSelector'
import PortfolioHub from '@/components/portfolio/PortfolioHub'

interface Props {
  portfolio: PortfolioData
  studentId: string
  role:      UserRole
}

export default function HubShell({ portfolio, studentId, role }: Props) {
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const years = useMemo(() => {
    const set = new Set<string>()
    if (portfolio.student.academicYear) set.add(portfolio.student.academicYear)
    portfolio.assessments.forEach((a)    => a.academicYear && set.add(a.academicYear))
    portfolio.readings.forEach((r)       => r.academicYear && set.add(r.academicYear))
    portfolio.writingSamples.forEach((w) => w.academicYear && set.add(w.academicYear))
    return Array.from(set).sort().reverse()
  }, [portfolio])

  const canInvite = role === 'admin' || role === 'teacher'

  return (
    <div className="main">
      <HeroSection
        student={portfolio.student}
        school={portfolio.school}
        assessments={portfolio.assessments}
        compact
        inviteButton={canInvite ? <InviteParentButton studentId={studentId} /> : undefined}
      />

      <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />

      <PortfolioHub portfolio={portfolio} studentId={studentId} selectedYear={selectedYear} />
    </div>
  )
}
