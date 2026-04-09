// ============================================================
// app/portfolio/[studentId]/section/[slug]/page.tsx
//
// Section detail page. Validates the slug, fetches portfolio
// data, then renders SectionDetailClient with the matching
// section and optional year filter from searchParams.
// ============================================================

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { enforceParentAccess } from '@/lib/portfolioAuth'
import SideNav from '@/components/portfolio/SideNav'
import RevealObserver from '@/components/portfolio/RevealObserver'
import SectionDetailClient from '@/components/portfolio/SectionDetailClient'
import '../../../../demo/portfolio.css'

const VALID_SLUGS = [
  'intellectual-arc',
  'immersion-engine',
  'the-canon',
  'creative-evolution',
  'rhetoric-room',
  'character-arc',
  'scope-and-sequence',
  'handwriting',
  'photo-gallery',
  'teacher-notes',
  'parent-uploads',
] as const

type Props = {
  params:      Promise<{ studentId: string; slug: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function SectionPage({ params, searchParams }: Props) {
  const { studentId, slug } = await params
  const { year } = await searchParams

  // Guard invalid slugs
  if (!(VALID_SLUGS as readonly string[]).includes(slug)) notFound()

  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())

  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  // Collect distinct years for the year filter (same logic as HubShell/PortfolioClient)
  const yearSet = new Set<string>()
  if (portfolio.student.academicYear) yearSet.add(portfolio.student.academicYear)
  portfolio.assessments.forEach((a) => a.academicYear && yearSet.add(a.academicYear))
  portfolio.readings.forEach((r) => r.academicYear && yearSet.add(r.academicYear))
  portfolio.writingSamples.forEach((w) => w.academicYear && yearSet.add(w.academicYear))
  const years = Array.from(yearSet).sort().reverse()

  const selectedYear = year ?? 'all'
  const studentName = `${portfolio.student.firstName} ${portfolio.student.lastName}`

  return (
    <>
      <RevealObserver />
      <SideNav
        schoolName={portfolio.school.name}
        studentName={studentName}
        studentId={studentId}
        role={role}
        activeSlug={slug}
      />
      <SectionDetailClient
        portfolio={portfolio}
        studentId={studentId}
        role={role}
        slug={slug}
        selectedYear={selectedYear}
        years={years}
      />
    </>
  )
}
