// ============================================================
// app/portfolio/[studentId]/page.tsx
//
// Server component. Verifies the viewer's Clerk session,
// derives school_id server-side from their Clerk org, fetches
// the full PortfolioData via getStudentPortfolio(), enforces
// parent access control, then renders the layout shell.
//
// HeroSection and IntellectualArc are wired to real data.
// Remaining sections receive props as they are updated each sprint.
// ============================================================

// This page is always server-rendered on demand — never statically generated.
// Authenticated, personalized content cannot be pre-rendered at build time.
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import SideNav from '@/components/portfolio/SideNav'
import HeroSection from '@/components/portfolio/HeroSection'
import IntellectualArc from '@/components/portfolio/IntellectualArc'
import ImmersionEngine from '@/components/portfolio/ImmersionEngine'
import TheCanon from '@/components/portfolio/TheCanon'
import CreativeEvolution from '@/components/portfolio/CreativeEvolution'
import RhetoricRoom from '@/components/portfolio/RhetoricRoom'
import CharacterArc from '@/components/portfolio/CharacterArc'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter'
// Shared portfolio stylesheet — also consumed by /demo
import '../../demo/portfolio.css'

type Props = {
  params: Promise<{ studentId: string }>
}

export default async function PortfolioPage({ params }: Props) {
  const { studentId } = await params

  // Auth context is derived entirely server-side from the Clerk session.
  // school_id is never accepted from the client or from query params.
  const { userId, schoolId, role } = await getAuthContext().catch(() => notFound())

  // getStudentPortfolio throws if the student doesn't exist or doesn't
  // belong to this school — map that to a 404.
  const portfolio = await getStudentPortfolio(studentId, schoolId).catch(() => notFound())

  // Parents may only view portfolios for their own children.
  // Admins and teachers have broad access within their school.
  if (role === 'parent' && !portfolio.student.parentUserIds.includes(userId)) {
    notFound()
  }

  return (
    <>
      <SideNav />
      <div className="main">
        <HeroSection student={portfolio.student} school={portfolio.school} />
        <IntellectualArc assessments={portfolio.assessments} />
        <ImmersionEngine />
        <TheCanon />
        <CreativeEvolution />
        <RhetoricRoom />
        <CharacterArc />
        <PortfolioFooter />
      </div>
    </>
  )
}
