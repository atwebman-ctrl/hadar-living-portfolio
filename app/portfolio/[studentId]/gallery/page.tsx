// ============================================================
// app/portfolio/[studentId]/gallery/page.tsx
//
// Unified gallery page — single section with a source filter
// (All / School / Parent) rendering photos and parent uploads
// interleaved by date.
// ============================================================

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import UnifiedGallery from '@/components/portfolio/UnifiedGallery'
import layoutStyles from '@/components/portfolio/layout.module.css'
import '../../../demo/portfolio.css'

type Props = { params: Promise<{ studentId: string }> }

export default async function GalleryPage({ params }: Props) {
  const { studentId } = await params
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())
  if (!portfolio) return notFound()

  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  const { student } = portfolio
  const studentName = `${student.firstName} ${student.lastName}`

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
          <UnifiedGallery
            photos={portfolio.photos}
            parentUploads={portfolio.parentUploads}
            studentId={studentId}
            role={role}
            academicYear={student.academicYear}
            gradeLevel={student.gradeLevel}
          />
        </div>
      </div>
    </>
  )
}
