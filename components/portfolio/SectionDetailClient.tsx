'use client'

// ============================================================
// components/portfolio/SectionDetailClient.tsx
//
// Client wrapper for /portfolio/[studentId]/section/[slug].
// Renders the single section that matches the slug, with a
// back link and a year selector that pushes ?year= to the URL.
// ============================================================

import { Component, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole, PortfolioData } from '@/lib/types'
import YearSelector from '@/components/portfolio/YearSelector'
import TheCanon from '@/components/portfolio/TheCanon'
import MathSection from '@/components/portfolio/MathSection'
import EnglishSection from '@/components/portfolio/EnglishSection'
import LanguageSection from '@/components/portfolio/LanguageSection'
import CharacterArc from '@/components/portfolio/CharacterArc'
import ScriptureEmpty from '@/components/portfolio/ScriptureEmpty'
import { buildPortfolioTabs } from '@/lib/portfolioTabs'
import layoutStyles from '@/components/portfolio/layout.module.css'

// ── Error boundary ────────────────────────────────────────────

class SectionErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { hasError: true, message }
  }
  componentDidCatch(err: unknown, info: { componentStack?: string }) {
    console.error('[SectionErrorBoundary] caught error:', err)
    console.error('[SectionErrorBoundary] component stack:', info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem 2.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#991b1b' }}>
          <strong>Something went wrong loading this section.</strong>
          {this.state.message && (
            <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.7rem', color: '#b91c1c' }}>
              {this.state.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

interface Props {
  portfolio:    PortfolioData
  studentId:    string
  role:         UserRole
  slug:         string
  selectedYear: string   // from searchParams.year ?? 'all'
  years:        string[] // distinct years collected server-side
}

export default function SectionDetailClient({
  portfolio,
  studentId,
  role,
  slug,
  selectedYear,
  years,
}: Props) {
  const router = useRouter()
  const { student, assessments, aiDrafts, teacherNotes } = portfolio

  const handleYearChange = (year: string) => {
    const base = `/portfolio/${studentId}/section/${slug}`
    router.push(year === 'all' ? base : `${base}?year=${year}`)
  }

  const thirdLanguages = portfolio.school.thirdLanguages ?? []

  // 1-based ordinal of this section within the school's tab list.
  // Drives the gold mono number in each section header.
  const sectionIndex = Math.max(
    1,
    buildPortfolioTabs(thirdLanguages).findIndex((t) => t.slug === slug) + 1,
  )

  // ── Section renderer ────────────────────────────────────────
  const renderSection = () => {
    const language = thirdLanguages.find((l) => l.code === slug)
    if (language) {
      return (
        <LanguageSection
          language={language}
          assessments={assessments}
          studentVideos={portfolio.studentVideos}
          writingSamples={portfolio.writingSamples}
          handwritingSamples={portfolio.handwritingSamples}
          teacherNotes={teacherNotes}
          studentId={studentId}
          studentName={student.firstName}
          role={role}
          gradeLevel={student.gradeLevel}
          existingDraft={aiDrafts.find((d) => d.sectionType === 'immersion')}
          sectionIndex={sectionIndex}
        />
      )
    }

    switch (slug) {
      case 'the-canon':
        return (
          <TheCanon
            readings={portfolio.readings}
            teacherNotes={teacherNotes}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'reading_bookshelf')}
            sectionIndex={sectionIndex}
          />
        )
      case 'math':
        return (
          <MathSection
            assessments={assessments}
            teacherNotes={teacherNotes}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            gradeLevel={student.gradeLevel}
            academicYear={student.academicYear}
            currentYear={student.academicYear}
            selectedYear={selectedYear}
            existingMathDraft={aiDrafts.find((d) => d.sectionType === 'math_scores')}
            sectionIndex={sectionIndex}
          />
        )
      case 'english':
        return (
          <EnglishSection
            assessments={assessments}
            studentVideos={portfolio.studentVideos}
            writingSamples={portfolio.writingSamples}
            handwritingSamples={portfolio.handwritingSamples}
            teacherNotes={teacherNotes}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            gradeLevel={student.gradeLevel}
            academicYear={student.academicYear}
            selectedYear={selectedYear}
            existingEnglishDraft={aiDrafts.find((d) => d.sectionType === 'english_scores')}
            sectionIndex={sectionIndex}
          />
        )
      case 'scripture':
        return <ScriptureEmpty sectionIndex={sectionIndex} />
      case 'soulcraft':
        return (
          <CharacterArc
            characterAwards={portfolio.characterAwards}
            teacherNotes={teacherNotes}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
            sectionIndex={sectionIndex}
          />
        )
      default:
        return null
    }
  }

  // Sections that benefit from the year filter
  const YEAR_FILTER_SLUGS = ['math', 'english', 'the-canon']
  const showYearFilter = YEAR_FILTER_SLUGS.includes(slug) && years.length > 1

  return (
    <div className={layoutStyles.main}>
      {/* Back link */}
      <div style={{ padding: '1.5rem 2.5rem 0' }}>
        <a href={`/portfolio/${studentId}`} className={layoutStyles.backLink}>
          ← Back to Overview
        </a>
      </div>

      {showYearFilter && (
        <YearSelector years={years} selectedYear={selectedYear} onChange={handleYearChange} />
      )}

      <SectionErrorBoundary>
        {renderSection()}
      </SectionErrorBoundary>
    </div>
  )
}
