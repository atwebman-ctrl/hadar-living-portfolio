// ============================================================
// app/portfolio/[studentId]/page.tsx
//
// Server component. Verifies the viewer's Clerk session,
// derives school_id server-side from their Clerk org, fetches
// the full PortfolioData via getStudentPortfolio(), enforces
// parent access control, then renders the layout shell.
//
// Sprint 2: original 6 sections wired to typed PortfolioData slices.
// Sprint 3: 6 additional stub sections added below.
// ============================================================

// This page is always server-rendered on demand — never statically generated.
// Authenticated, personalized content cannot be pre-rendered at build time.
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import SideNav from '@/components/portfolio/SideNav'
import HeroSection from '@/components/portfolio/HeroSection'
import IntellectualArc from '@/components/portfolio/IntellectualArc'
import ImmersionEngine from '@/components/portfolio/ImmersionEngine'
import TheCanon from '@/components/portfolio/TheCanon'
import CreativeEvolution from '@/components/portfolio/CreativeEvolution'
import RhetoricRoom from '@/components/portfolio/RhetoricRoom'
import CharacterArc from '@/components/portfolio/CharacterArc'
import ScopeAndSequence from '@/components/portfolio/ScopeAndSequence'
import HandwritingSamples from '@/components/portfolio/HandwritingSamples'
import PhotoGallery from '@/components/portfolio/PhotoGallery'
import TeacherNotes from '@/components/portfolio/TeacherNotes'
import ParentUploads from '@/components/portfolio/ParentUploads'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter'
import InviteParentButton from '@/components/shared/InviteParentButton'
import TeacherDataPanel from '@/components/portfolio/TeacherDataPanel'
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
  if (role === 'parent') {
    await enforceParentAccess(userId, schoolId, studentId)
  }

  const studentName = `${portfolio.student.firstName} ${portfolio.student.lastName}`

  return (
    <>
      <SideNav schoolName={portfolio.school.name} studentName={studentName} />
      <div className="main">
        <HeroSection student={portfolio.student} school={portfolio.school} />
        {(role === 'admin' || role === 'teacher') && (
          <>
            <div style={{ padding: '1rem 2rem 0', display: 'flex', justifyContent: 'flex-end' }}>
              <InviteParentButton studentId={studentId} />
            </div>
            <TeacherDataPanel studentId={studentId} />
          </>
        )}
        <IntellectualArc
          assessments={portfolio.assessments}
          studentId={studentId}
          studentName={portfolio.student.firstName}
          role={role}
          existingMathDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'math_scores')}
          existingEnglishDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'english_scores')}
        />
        <ImmersionEngine
          assessments={portfolio.assessments}
          studentId={studentId}
          studentName={portfolio.student.firstName}
          role={role}
          existingDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'immersion')}
        />
        <TheCanon
          readings={portfolio.readings}
          studentId={studentId}
          studentName={portfolio.student.firstName}
          role={role}
          existingDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'reading_bookshelf')}
        />
        <CreativeEvolution
          writingSamples={portfolio.writingSamples}
          studentId={studentId}
          studentName={portfolio.student.firstName}
          role={role}
          existingDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'writing')}
        />
        <RhetoricRoom videos={portfolio.videos} />
        <CharacterArc
          characterAwards={portfolio.characterAwards}
          studentId={studentId}
          studentName={portfolio.student.firstName}
          role={role}
          existingDraft={portfolio.aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
        />
        {/* Sprint 3 sections — all wired to real PortfolioData */}
        <ScopeAndSequence
          gradeLevel={portfolio.student.gradeLevel}
          subjects={portfolio.scopeAndSequence}
        />
        <HandwritingSamples
          samples={portfolio.handwritingSamples}
          uploadEnabled={role !== 'parent'}
          studentId={studentId}
          academicYear={portfolio.student.academicYear}
          gradeLevel={portfolio.student.gradeLevel}
        />
        <PhotoGallery
          photos={portfolio.photos}
          uploadEnabled={role !== 'parent'}
          studentId={studentId}
          academicYear={portfolio.student.academicYear}
          gradeLevel={portfolio.student.gradeLevel}
        />
        <TeacherNotes notes={portfolio.teacherNotes} />
        <ParentUploads
          uploads={portfolio.parentUploads}
          uploadEnabled={true}
          studentId={studentId}
          academicYear={portfolio.student.academicYear}
          gradeLevel={portfolio.student.gradeLevel}
        />
        <PortfolioFooter />
      </div>
    </>
  )
}

// ── Parent access guard ───────────────────────────────────────
//
// Replaces the legacy parentUserIds array check with the
// parent_students table, which supports the invite flow.
//
// Match logic (OR):
//   a) parent_clerk_user_id = userId  — returning parent
//   b) invited_email = primaryEmail   — first visit after invite
//
// On first match by email (parent_clerk_user_id is null), the row
// is updated to link the Clerk user ID and flip status to 'active'.
// This is idempotent: subsequent visits match via parent_clerk_user_id.
//
// Calls notFound() (throws) if no matching row exists.

async function enforceParentAccess(
  userId: string,
  schoolId: string,
  studentId: string,
): Promise<void> {
  // Resolve parent's primary email from Clerk
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId).catch(() => null)
  const primaryEmail =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null

  // Build OR filter: match by Clerk user ID or invited email
  const orParts = [`parent_clerk_user_id.eq.${userId}`]
  if (primaryEmail) orParts.push(`invited_email.eq.${primaryEmail.toLowerCase()}`)

  const { data: row } = await supabaseAdmin
    .from('parent_students')
    .select('id, parent_clerk_user_id')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .or(orParts.join(','))
    .limit(1)
    .maybeSingle()

  if (!row) notFound()

  // First visit: link the Clerk user ID to the pending invitation
  if (!row.parent_clerk_user_id) {
    await supabaseAdmin
      .from('parent_students')
      .update({ parent_clerk_user_id: userId, status: 'active' })
      .eq('id', row.id)
  }
}
