// ============================================================
// app/portfolio/[studentId]/page.tsx
//
// Portfolio hub page. Server component — verifies auth,
// derives school_id from Clerk org, fetches PortfolioData,
// enforces parent access, then renders HubShell.
// ============================================================

import Link from 'next/link'
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
      {role !== 'parent' && (
        <section
          style={{
            maxWidth:  1200,
            margin:    '0 auto 4rem',
            padding:   '1.25rem 2rem 0',
            borderTop: '1px solid var(--rule)',
          }}
        >
          <div
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         'var(--ink-faint)',
              marginBottom:  6,
            }}
          >
            For teachers
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href={`/dashboard/profiles/${studentId}/spring`}
              style={{
                color:         'var(--gold)',
                fontFamily:    'var(--font-body)',
                fontSize:      '0.95rem',
                textDecoration: 'none',
              }}
            >
              Open Spring 2025–26 Profile →
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
