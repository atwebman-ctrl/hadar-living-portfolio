// ============================================================
// app/portfolio/[studentId]/full/page.tsx
//
// Reports page — historical report cards + uploader.
// The legacy scrolling-all-sections view (PortfolioClient) is
// still reachable from the "View all sections →" toggle at the
// bottom of ReportsView.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
import ReportsView from '@/components/portfolio/ReportsView'
import layoutStyles from '@/components/portfolio/layout.module.css'
import '../../../demo/portfolio.css'

type Props = { params: Promise<{ studentId: string }> }

export default async function ReportsPage({ params }: Props) {
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
      <div className={layoutStyles.main}>
        <div style={{ padding: '1.5rem 2.5rem 0' }}>
          <a href={`/portfolio/${studentId}`} className={layoutStyles.backLink}>
            ← Back to Overview
          </a>
        </div>
        <div style={{ padding: '1.5rem 2.5rem 3rem' }}>
          <ReportsView
            reportCards={portfolio.reportCards}
            studentId={studentId}
            role={role}
            academicYear={portfolio.student.academicYear}
            gradeLevel={portfolio.student.gradeLevel}
            scrollingPortfolio={
              <PortfolioClient portfolio={portfolio} studentId={studentId} role={role} />
            }
          />
        </div>
      </div>
    </>
  )
}
