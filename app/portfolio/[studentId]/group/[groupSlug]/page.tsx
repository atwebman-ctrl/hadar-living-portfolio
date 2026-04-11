// ============================================================
// app/portfolio/[studentId]/group/[groupSlug]/page.tsx
//
// Group detail page. Validates the group slug, fetches
// portfolio data, then renders GroupDetailClient with tabs.
// ============================================================

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import GroupDetailClient from '@/components/portfolio/GroupDetailClient'
import '../../../../demo/portfolio.css'

const VALID_GROUPS = ['academics', 'student-work', 'gallery'] as const

type Props = {
  params:       Promise<{ studentId: string; groupSlug: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { studentId, groupSlug } = await params
  const { tab } = await searchParams

  if (!(VALID_GROUPS as readonly string[]).includes(groupSlug)) notFound()

  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())

  let portfolio: Awaited<ReturnType<typeof getStudentPortfolio>> | null = null
  try {
    portfolio = await getStudentPortfolio(studentId, schoolId)
  } catch (err) {
    console.error('[GroupPage] getStudentPortfolio error:', err)
    return notFound()
  }
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
        activeGroup={groupSlug}
      />
      <GroupDetailClient
        portfolio={portfolio}
        studentId={studentId}
        role={role}
        groupSlug={groupSlug}
        initialTab={tab}
      />
    </>
  )
}
