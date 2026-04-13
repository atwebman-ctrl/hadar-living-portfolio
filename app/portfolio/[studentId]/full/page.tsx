// ============================================================
// app/portfolio/[studentId]/full/page.tsx
//
// Full-scroll portfolio page — all sections in one view.
// Same auth/data logic as the hub page.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
import layoutStyles from '@/components/portfolio/layout.module.css'
import '../../../demo/portfolio.css'

type Props = { params: Promise<{ studentId: string }> }

export default async function FullPortfolioPage({ params }: Props) {
  const { studentId } = await params
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())

  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  const studentName = `${portfolio.student.firstName} ${portfolio.student.lastName}`

  return (
    <>
      <RevealObserver />
      <SideNav
        schoolName={portfolio.school.name}
        studentName={studentName}
        studentId={studentId}
        role={role}
      />
      {/* Back to overview */}
      <a href={`/portfolio/${studentId}`} className={layoutStyles.overviewBtn}>
        ← Overview
      </a>
      <PortfolioClient portfolio={portfolio} studentId={studentId} role={role} />
    </>
  )
}
