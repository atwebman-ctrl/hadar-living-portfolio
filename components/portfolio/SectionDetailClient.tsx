'use client'

// ============================================================
// components/portfolio/SectionDetailClient.tsx
//
// Client wrapper for /portfolio/[studentId]/section/[slug].
// Renders the single section that matches the slug, with a
// back link and a year selector that pushes ?year= to the URL.
// ============================================================

import { useRouter } from 'next/navigation'
import type { UserRole, PortfolioData } from '@/lib/types'
import YearSelector from '@/components/portfolio/YearSelector'
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
      case 'intellectual-arc':
        return (
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
        )
      case 'immersion-engine':
        return (
          <ImmersionEngine
            assessments={assessments}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'immersion')}
          />
        )
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
      case 'creative-evolution':
        return (
          <CreativeEvolution
            writingSamples={portfolio.writingSamples}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'writing')}
          />
        )
      case 'rhetoric-room':
        return (
          <RhetoricRoom
            videos={portfolio.videos}
            studentVideos={portfolio.studentVideos}
            studentId={studentId}
            role={role}
          />
        )
      case 'character-arc':
        return (
          <CharacterArc
            characterAwards={portfolio.characterAwards}
            studentId={studentId}
            studentName={student.firstName}
            role={role}
            existingDraft={aiDrafts.find((d) => d.sectionType === 'virtue_badges')}
          />
        )
      case 'scope-and-sequence':
        return (
          <ScopeAndSequence
            gradeLevel={student.gradeLevel}
            subjects={portfolio.scopeAndSequence}
          />
        )
      case 'handwriting':
        return (
          <HandwritingSamples
            samples={portfolio.handwritingSamples}
            uploadEnabled={role !== 'parent'}
            studentId={studentId}
            academicYear={student.academicYear}
            gradeLevel={student.gradeLevel}
          />
        )
      case 'photo-gallery':
        return (
          <PhotoGallery
            photos={portfolio.photos}
            uploadEnabled={role !== 'parent'}
            studentId={studentId}
            academicYear={student.academicYear}
            gradeLevel={student.gradeLevel}
          />
        )
      case 'teacher-notes':
        return (
          <TeacherNotes
            notes={portfolio.teacherNotes}
            role={role}
            studentId={studentId}
          />
        )
      case 'parent-uploads':
        return (
          <ParentUploads
            uploads={portfolio.parentUploads}
            uploadEnabled={true}
            studentId={studentId}
            academicYear={student.academicYear}
            gradeLevel={student.gradeLevel}
          />
        )
      default:
        return null
    }
  }

  // Sections that benefit from the year filter
  const YEAR_FILTER_SLUGS = ['intellectual-arc', 'the-canon', 'creative-evolution']
  const showYearFilter = YEAR_FILTER_SLUGS.includes(slug) && years.length > 1

  return (
    <div className="main">
      {/* Back link */}
      <div style={{ padding: '1.5rem 2.5rem 0' }}>
        <a
          href={`/portfolio/${studentId}`}
          style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       '0.68rem',
            letterSpacing:  '0.08em',
            textTransform:  'uppercase',
            color:          'var(--ink-mid)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--navy)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-mid)')}
        >
          ← Back to Overview
        </a>
      </div>

      {showYearFilter && (
        <YearSelector years={years} selectedYear={selectedYear} onChange={handleYearChange} />
      )}

      {renderSection()}
    </div>
  )
}
