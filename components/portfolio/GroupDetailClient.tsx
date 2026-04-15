'use client'

// ============================================================
// components/portfolio/GroupDetailClient.tsx
//
// Tabbed view for a group of portfolio sections.
// Renders sub-section tabs (not scrolling) — user clicks
// between tabs to navigate sub-sections within a group.
// ============================================================

import { useState, useMemo, Component, type ReactNode } from 'react'
import type { UserRole, PortfolioData } from '@/lib/types'
import YearSelector from '@/components/portfolio/YearSelector'
import layoutStyles from '@/components/portfolio/layout.module.css'
import groupStyles from '@/components/portfolio/GroupDetail.module.css'
import TheCanon from '@/components/portfolio/TheCanon'
import MathSection from '@/components/portfolio/MathSection'
import EnglishSection from '@/components/portfolio/EnglishSection'
import HebrewSection from '@/components/portfolio/HebrewSection'
import CompositionView from '@/components/portfolio/CompositionView'
import CharacterArc from '@/components/portfolio/CharacterArc'

// ── Error boundary ────────────────────────────────────────────

class TabErrorBoundary extends Component<
  { children: ReactNode; tabKey: string },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; tabKey: string }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }
  componentDidCatch(err: unknown) { console.error('[TabErrorBoundary]', err) }
  componentDidUpdate(prev: { tabKey: string }) {
    if (prev.tabKey !== this.props.tabKey) this.setState({ hasError: false, message: '' })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#991b1b' }}>
          <strong>Something went wrong loading this section.</strong>
          {this.state.message && (
            <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.7rem' }}>{this.state.message}</pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

// ── Tab definitions per group ─────────────────────────────────

interface TabDef { slug: string; label: string }

export const GROUP_TABS: Record<string, TabDef[]> = {
  portfolio: [
    { slug: 'the-canon',   label: 'The Canon'   },
    { slug: 'math',        label: 'Math'        },
    { slug: 'english',     label: 'English'     },
    { slug: 'hebrew',      label: 'Hebrew'      },
    { slug: 'composition', label: 'Composition' },
    { slug: 'soulcraft',   label: 'Soulcraft'   },
  ],
}

export const GROUP_TITLES: Record<string, string> = {
  portfolio: 'Portfolio',
}

// ── Section renderer ──────────────────────────────────────────

const YEAR_FILTER_TABS = new Set(['math', 'english', 'the-canon'])

function RenderSection({ slug, portfolio, studentId, role, selectedYear }: {
  slug: string; portfolio: PortfolioData; studentId: string; role: UserRole; selectedYear: string
}) {
  const { student, assessments, aiDrafts } = portfolio
  const filtered = <T extends { academicYear?: string | null }>(items: T[]): T[] =>
    selectedYear === 'all' ? items : items.filter((i) => i.academicYear === selectedYear)

  switch (slug) {
    case 'the-canon':
      return (
        <TheCanon
          readings={filtered(portfolio.readings)}
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

// ── Main component ────────────────────────────────────────────

interface Props {
  portfolio:   PortfolioData
  studentId:   string
  role:        UserRole
  groupSlug:   string
  initialTab?: string
}

export default function GroupDetailClient({ portfolio, studentId, role, groupSlug, initialTab }: Props) {
  const tabs  = GROUP_TABS[groupSlug] ?? []
  const title = GROUP_TITLES[groupSlug] ?? groupSlug
  const [activeTab,    setActiveTab]    = useState(initialTab ?? tabs[0]?.slug ?? '')
  const [selectedYear, setSelectedYear] = useState('all')

  const years = useMemo(() => {
    const set = new Set<string>()
    portfolio.assessments.forEach((a)    => a.academicYear && set.add(a.academicYear))
    portfolio.readings.forEach((r)       => r.academicYear && set.add(r.academicYear))
    portfolio.writingSamples.forEach((w) => w.academicYear && set.add(w.academicYear))
    return Array.from(set).sort().reverse()
  }, [portfolio])

  const showYearSelector = YEAR_FILTER_TABS.has(activeTab) && years.length > 0

  return (
    <div className={layoutStyles.main}>
      {/* Back link */}
      <div style={{ padding: '1.5rem 2.5rem 0' }}>
        <a href={`/portfolio/${studentId}`} className={layoutStyles.backLink}>
          ← Back to Overview
        </a>
      </div>

      {/* Group title */}
      <div style={{ padding: '0.5rem 2.5rem 0' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize:   '2rem',
          fontWeight: 400,
          color:      'var(--navy)',
          margin:     0,
        }}>
          {title}
        </h1>
      </div>

      {/* Tab bar */}
      <div className={groupStyles.groupTabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.slug}
            className={`${groupStyles.groupTab}${activeTab === tab.slug ? ` ${groupStyles.groupTabActive}` : ''}`}
            onClick={() => setActiveTab(tab.slug)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Year selector — only for tabs that benefit from year filtering */}
      {showYearSelector && (
        <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
      )}

      {/* Active section */}
      <TabErrorBoundary tabKey={activeTab}>
        <RenderSection
          slug={activeTab}
          portfolio={portfolio}
          studentId={studentId}
          role={role}
          selectedYear={selectedYear}
        />
      </TabErrorBoundary>
    </div>
  )
}
