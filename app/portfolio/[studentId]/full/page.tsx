// ============================================================
// app/portfolio/[studentId]/full/page.tsx
//
// Full-scroll portfolio page — all sections in one view.
// Same auth/data logic as the hub page.
// ============================================================

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
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
      <div style={{
        position:   'fixed',
        top:        '1rem',
        right:      '1.5rem',
        zIndex:     100,
      }}>
        <a
          href={`/portfolio/${studentId}`}
          style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       '0.65rem',
            letterSpacing:  '0.08em',
            textTransform:  'uppercase',
            color:          'var(--ink-mid)',
            textDecoration: 'none',
            background:     'var(--cream)',
            padding:        '0.35rem 0.7rem',
            border:         '1px solid var(--rule)',
          }}
        >
          ← Overview
        </a>
      </div>
      <PortfolioClient portfolio={portfolio} studentId={studentId} role={role} />
    </>
  )
}
