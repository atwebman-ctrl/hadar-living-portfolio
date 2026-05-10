// ============================================================
// app/portfolio/[studentId]/page.tsx
//
// Portfolio hub page. Server component — verifies auth,
// derives school_id from Clerk org, fetches PortfolioData,
// enforces parent access, then renders HubShell.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import HubShell from '@/components/portfolio/HubShell'
import '../../demo/portfolio.css'

type Props = {
  params: Promise<{ studentId: string }>
}

export default async function PortfolioPage({ params }: Props) {
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
        thirdLanguages={portfolio.school.thirdLanguages}
      />
      <HubShell portfolio={portfolio} studentId={studentId} role={role} />
    </>
  )
}
