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
import TheCanon from '@/components/portfolio/TheCanon'
import MathSection from '@/components/portfolio/MathSection'
import EnglishSection from '@/components/portfolio/EnglishSection'
import LanguageSection from '@/components/portfolio/LanguageSection'
import CharacterArc from '@/components/portfolio/CharacterArc'
import ScriptureEmpty from '@/components/portfolio/ScriptureEmpty'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter'
import InviteParentButton from '@/components/shared/InviteParentButton'
import YearSelector from '@/components/portfolio/YearSelector'
import { buildPortfolioTabs } from '@/lib/portfolioTabs'

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

  const { student, school, assessments, aiDrafts } = portfolio

  // Source of truth for section numbering in the long-scroll view.
  // Order matches buildPortfolioTabs(): Canon · Math · English · [third langs] · Scripture · Soulcraft.
  const tabs = buildPortfolioTabs(school.thirdLanguages ?? [])
  const indexOf = (slug: string) => Math.max(1, tabs.findIndex((t) => t.slug === slug) + 1)

  return (
    <>
      <HeroSection
        student={student}
        school={school}
        studentId={studentId}
        assessments={assessments}
        role={role}
        inviteButton={(role === 'admin' || role === 'teacher') ? <InviteParentButton studentId={studentId} /> : undefined}
      />

      <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />

      <TheCanon
        readings={portfolio.readings}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'reading_bookshelf')}
        sectionIndex={indexOf('the-canon')}
      />
      <MathSection
        assessments={assessments}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        gradeLevel={student.gradeLevel}
        academicYear={student.academicYear}
        currentYear={student.academicYear}
        selectedYear={selectedYear}
        existingMathDraft={aiDrafts.find((d) => d.sectionType === 'math_scores')}
        sectionIndex={indexOf('math')}
      />
      <EnglishSection
        assessments={assessments}
        studentVideos={portfolio.studentVideos}
        writingSamples={portfolio.writingSamples}
        handwritingSamples={portfolio.handwritingSamples}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        gradeLevel={student.gradeLevel}
        academicYear={student.academicYear}
        selectedYear={selectedYear}
        existingEnglishDraft={aiDrafts.find((d) => d.sectionType === 'english_scores')}
        sectionIndex={indexOf('english')}
      />
      {school.thirdLanguages.map((language) => (
        <LanguageSection
          key={language.code}
          language={language}
          assessments={assessments}
          studentVideos={portfolio.studentVideos}
          writingSamples={portfolio.writingSamples}
          handwritingSamples={portfolio.handwritingSamples}
          studentId={studentId}
          studentName={student.firstName}
          role={role}
          gradeLevel={student.gradeLevel}
          existingDraft={aiDrafts.find((d) => d.sectionType === 'immersion')}
          sectionIndex={indexOf(language.code)}
        />
      ))}
      <ScriptureEmpty sectionIndex={indexOf('scripture')} />
      <CharacterArc
        characterAwards={portfolio.characterAwards}
        studentId={studentId}
        studentName={student.firstName}
        role={role}
        existingDraft={aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
        sectionIndex={indexOf('soulcraft')}
      />
      <PortfolioFooter schoolName={school.name} />
    </>
  )
}
