// ============================================================
// app/portfolio/[studentId]/journal/page.tsx
//
// Teacher journal — aggregates every teacher note across the
// student's portfolio into a filterable, grouped timeline.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import TeacherJournal from '@/components/portfolio/TeacherJournal'
import layoutStyles from '@/components/portfolio/layout.module.css'
import '../../../demo/portfolio.css'

type Props = { params: Promise<{ studentId: string }> }

export default async function JournalPage({ params }: Props) {
  const { studentId } = await params
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())
  if (!portfolio) return notFound()

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
          <TeacherJournal
            notes={portfolio.teacherNotes}
            role={role}
            studentId={studentId}
          />
        </div>
      </div>
    </>
  )
}
