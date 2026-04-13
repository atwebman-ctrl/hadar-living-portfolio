'use client'

// ============================================================
// components/portfolio/PortfolioClient.tsx
//
// Client wrapper for the full portfolio page. Owns the
// selectedYear state and passes it to all section components.
// Receives pre-fetched portfolio data from the server component
// (app/portfolio/[studentId]/page.tsx).
// ============================================================

import { useState, useMemo } from 'react'
import type { UserRole, PortfolioData } from '@/lib/types'
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
import YearSelector from '@/components/portfolio/YearSelector'
import layoutStyles from '@/components/portfolio/layout.module.css'

interface Props {
  portfolio: PortfolioData
  studentId: string
  role:      UserRole
}

export default function PortfolioClient({ portfolio, studentId, role }: Props) {
  const [selectedYear, setSelectedYear] = useState<string>('all')

  // Collect distinct academic years that have data, newest-first.
  const years = useMemo(() => {
    const set = new Set<string>()
    if (portfolio.student.academicYear) set.add(portfolio.student.academicYear)
    portfolio.assessments.forEach((a)    => a.academicYear && set.add(a.academicYear))
    portfolio.readings.forEach((r)       => r.academicYear && set.add(r.academicYear))
    portfolio.writingSamples.forEach((w) => w.academicYear && set.add(w.academicYear))
    return Array.from(set).sort().reverse()
  }, [portfolio])

  const { student, assessments, aiDrafts } = portfolio

  return (
    <div className={layoutStyles.main}>
      <HeroSection
        student={student}
        assessments={assessments}
        inviteButton={(role === 'admin' || role === 'teacher') ? <InviteParentButton studentId={studentId} /> : undefined}
      />

      <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />

      <IntellectualArc
        assessments={assessments}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        gradeLevel={student.gradeLevel}
        academicYear={student.academicYear}
        currentYear={student.academicYear}
        selectedYear={selectedYear}
        existingMathDraft={aiDrafts.find((d) => d.sectionType === 'math_scores')}
        existingEnglishDraft={aiDrafts.find((d) => d.sectionType === 'english_scores')}
      />
      <ImmersionEngine
        assessments={assessments}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'immersion')}
      />
      <TheCanon
        readings={portfolio.readings}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'reading_bookshelf')}
      />
      <CreativeEvolution
        writingSamples={portfolio.writingSamples}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'writing')}
      />
      <RhetoricRoom
        videos={portfolio.videos}
        studentVideos={portfolio.studentVideos}
        studentId={studentId}
        role={role}
      />
      <CharacterArc
        characterAwards={portfolio.characterAwards}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
      />
      <ScopeAndSequence
        gradeLevel={student.gradeLevel}
        subjects={portfolio.scopeAndSequence}
      />
      <HandwritingSamples
        samples={portfolio.handwritingSamples}
        uploadEnabled={role !== 'parent'}
        studentId={studentId}
        academicYear={student.academicYear}
        gradeLevel={student.gradeLevel}
      />
      <PhotoGallery
        photos={portfolio.photos}
        uploadEnabled={role !== 'parent'}
        studentId={studentId}
        academicYear={student.academicYear}
        gradeLevel={student.gradeLevel}
      />
      <TeacherNotes notes={portfolio.teacherNotes} role={role} studentId={studentId} />
      <ParentUploads
        uploads={portfolio.parentUploads}
        uploadEnabled={true}
        studentId={studentId}
        role={role}
        academicYear={student.academicYear}
        gradeLevel={student.gradeLevel}
      />
      <PortfolioFooter />
    </div>
  )
}
