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
import HebrewSection from '@/components/portfolio/HebrewSection'
import CompositionView from '@/components/portfolio/CompositionView'
import CharacterArc from '@/components/portfolio/CharacterArc'
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
  const { student, assessments, aiDrafts } = portfolio

  const handleYearChange = (year: string) => {
    const base = `/portfolio/${studentId}/section/${slug}`
    router.push(year === 'all' ? base : `${base}?year=${year}`)
  }

  // ── Section renderer ────────────────────────────────────────
  const renderSection = () => {
    switch (slug) {
      case 'the-canon':
        return (
          <TheCanon
            readings={portfolio.readings}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'reading_bookshelf')}
          />
        )
      case 'math':
        return (
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
          />
        )
      case 'english':
        return (
          <EnglishSection
            assessments={assessments}
            studentVideos={portfolio.studentVideos}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            gradeLevel={student.gradeLevel}
            academicYear={student.academicYear}
            selectedYear={selectedYear}
            existingEnglishDraft={aiDrafts.find((d) => d.sectionType === 'english_scores')}
          />
        )
      case 'hebrew':
        return (
          <HebrewSection
            assessments={assessments}
            studentVideos={portfolio.studentVideos}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            gradeLevel={student.gradeLevel}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'immersion')}
          />
        )
      case 'composition':
        return (
          <CompositionView
            writingSamples={portfolio.writingSamples}
            handwritingSamples={portfolio.handwritingSamples}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            academicYear={student.academicYear}
            gradeLevel={student.gradeLevel}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'writing')}
          />
        )
      case 'soulcraft':
        return (
          <CharacterArc
            characterAwards={portfolio.characterAwards}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
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
