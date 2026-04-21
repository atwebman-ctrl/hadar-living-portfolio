'use client'

import { useState } from 'react'
import type { Assessment, StudentVideo, AiDraft, TeacherNote, UserRole, WritingSample, HandwritingSample } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import SubjectScoreRows, { type ScoreDisplayRow } from '@/components/portfolio/SubjectScoreRows'
import MapPercentileChart, { type StudentScorePoint } from '@/components/charts/MapPercentileChart'
import { termToSeason } from '@/lib/mapsHelpers'
import InlineAssessmentForm from '@/components/portfolio/InlineAssessmentForm'
import InlineSectionComment from '@/components/shared/InlineSectionComment'
import EnglishVideoTab from '@/components/portfolio/EnglishVideoTab'
import CompositionView from '@/components/portfolio/CompositionView'
import { DEMO_ENGLISH_ROWS, DEMO_READING_SCORES } from './IntellectualArcDemoData'
import groupStyles from '@/components/portfolio/GroupDetail.module.css'
import s from './sections.module.css'

interface Props {
  assessments?:          Assessment[]
  studentVideos?:        StudentVideo[]
  writingSamples?:       WritingSample[]
  handwritingSamples?:   HandwritingSample[]
  teacherNotes?:         TeacherNote[]
  studentId?:            string
  studentName?:          string
  role?:                 UserRole
  existingEnglishDraft?: AiDraft
  gradeLevel?:           string
  academicYear?:         string
  selectedYear?:         string
}

type SubTab = 'spelling' | 'grammar' | 'composition' | 'video'

const SUB_TABS: { slug: SubTab; label: string }[] = [
  { slug: 'spelling',    label: 'Spelling'    },
  { slug: 'grammar',     label: 'Grammar'     },
  { slug: 'composition', label: 'Composition' },
  { slug: 'video',       label: 'Video'       },
]

// ── Helpers (copied verbatim from IntellectualArc) ────────────

function toDisplayRows(
  assessments: Assessment[],
  currentGradeNum: number | null,
  currentAcademicYear: string | null | undefined,
): ScoreDisplayRow[] {
  const curStart = currentAcademicYear ? parseInt(currentAcademicYear.split('-')[0], 10) : NaN
  return assessments.map((a) => {
    let gradeTag: string | undefined
    if (currentGradeNum !== null && !isNaN(curStart)) {
      const aStart = parseInt((a.academicYear ?? '').split('-')[0], 10)
      if (!isNaN(aStart)) {
        const g = currentGradeNum - (curStart - aStart)
        if (g >= 0 && g <= 12) gradeTag = g === 0 ? 'K' : `Gr ${g}`
      }
    }
    return {
      id: a.id, term: a.term, academicYear: a.academicYear,
      ritScore: a.ritScore, score: a.score, percentile: a.percentile,
      gradeLevel: gradeTag,
      pdfPath: a.pdfPath, pdfPublicUrl: a.pdfPublicUrl,
    }
  })
}

function buildSubjectContext(
  rows: ScoreDisplayRow[],
  subject: string,
  studentFirstName: string | null,
): Record<string, unknown> {
  const latest = rows[0], earliest = rows[rows.length - 1]
  return {
    studentFirstName, subject,
    latestRit:          latest?.ritScore ?? latest?.score ?? null,
    latestPercentile:   latest?.percentile ?? null,
    earliestRit:        earliest?.ritScore ?? earliest?.score ?? null,
    earliestPercentile: earliest?.percentile ?? null,
    termCount:          rows.length,
  }
}

function parseGradeNumber(gradeLevel: string): number | null {
  const lower = gradeLevel.toLowerCase()
  if (lower.startsWith('k')) return 0
  const m = lower.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function toStudentScorePoints(
  assessments: Assessment[],
  currentGradeNum: number,
  currentAcademicYear: string,
): StudentScorePoint[] {
  const curStart = parseInt(currentAcademicYear.split('-')[0], 10)
  if (isNaN(curStart)) return []
  return assessments.flatMap((a) => {
    if (!a.ritScore) return []
    const aStart = parseInt((a.academicYear ?? '').split('-')[0], 10)
    if (isNaN(aStart)) return []
    const grade = currentGradeNum - (curStart - aStart)
    if (grade < 0 || grade > 8) return []
    if (!a.term) return []
    return [{ grade, season: termToSeason(a.term), ritScore: a.ritScore }]
  })
}

// ── Sub-components ────────────────────────────────────────────

function SubjectHeading({ title, tag }: { title: string; tag: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', borderBottom: '1px solid var(--rule)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--navy)', margin: 0 }}>{title}</h3>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{tag}</span>
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div style={{ padding: '2rem', color: 'var(--ink-light)', fontSize: '0.9rem' }}>
      {label} assessments — coming soon
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function EnglishSection({
  assessments,
  studentVideos,
  writingSamples,
  handwritingSamples,
  teacherNotes,
  studentId,
  studentName,
  role,
  existingEnglishDraft,
  gradeLevel,
  academicYear,
  selectedYear,
}: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>('spelling')

  const visibleAssessments = (selectedYear && selectedYear !== 'all')
    ? assessments?.filter((a) => a.academicYear === selectedYear)
    : assessments

  const englishAssessments = visibleAssessments?.filter((a) => a.assessmentType === 'maps_english') ?? []
  const hasEnglishData     = englishAssessments.length > 0
  const gradeNum           = gradeLevel ? parseGradeNumber(gradeLevel) : null
  const englishRows        = hasEnglishData
    ? toDisplayRows(englishAssessments, gradeNum, academicYear)
    : DEMO_ENGLISH_ROWS

  const canGenerate    = !!studentId && !!role && role !== 'parent'
  const englishContext = canGenerate ? buildSubjectContext(englishRows, 'English Language Arts', studentName ?? null) : null

  const readingScores = (hasEnglishData && gradeNum !== null && academicYear)
    ? toStudentScorePoints(englishAssessments, gradeNum, academicYear)
    : DEMO_READING_SCORES

  const canEdit = (role === 'admin' || role === 'teacher') && !!studentId
  const englishVideos = (studentVideos ?? []).filter((v) => v.language === 'english')

  return (
    <section id="english">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>01</span>
        <h2 className={s.sectionTitle}>English</h2>
        <div className={s.sectionRule} />
      </div>

      {/* ── Standardized Tests (always visible) ──────────────── */}
      <div className={`${s.chartWrap} reveal`}>
        <SubjectHeading title="English Language Arts" tag="MAP Assessment" />
        <div style={{ position: 'relative', height: 260, marginBottom: '1.25rem' }}>
          <MapPercentileChart subject="reading" studentScores={readingScores} />
        </div>
        <SubjectScoreRows rows={englishRows} />
        {studentId && role && (englishContext || role === 'parent') && (
          <AiNarrativePanel studentId={studentId} role={role} sectionType="english_scores" existingDraft={existingEnglishDraft} draftContext={englishContext ?? {}} />
        )}
        {studentId && (
          <InlineSectionComment
            studentId={studentId}
            sectionCategory="english"
            sectionAnchor="english-scores"
            canEdit={canEdit}
            notes={teacherNotes}
            role={role}
          />
        )}
        {studentId && role !== 'parent' && (
          <InlineAssessmentForm studentId={studentId} defaultType="maps_english" label="Add MAP Reading Score" />
        )}
      </div>

      {/* ── Sub-tab bar ──────────────────────────────────────── */}
      <div className={groupStyles.groupTabBar} style={{ marginTop: '2rem' }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.slug}
            className={`${groupStyles.groupTab}${activeTab === tab.slug ? ` ${groupStyles.groupTabActive}` : ''}`}
            onClick={() => setActiveTab(tab.slug)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sub-tab content ──────────────────────────────────── */}
      {activeTab === 'spelling' && <PlaceholderTab label="Spelling" />}
      {activeTab === 'grammar'  && <PlaceholderTab label="Grammar"  />}
      {activeTab === 'composition' && (
        <CompositionView
          writingSamples={(writingSamples ?? []).filter((x) => x.language === 'english')}
          handwritingSamples={handwritingSamples ?? []}
          teacherNotes={teacherNotes}
          studentId={studentId ?? ''}
          studentName={studentName}
          role={role ?? 'parent'}
          initialLanguage="english"
          academicYear={academicYear}
          gradeLevel={gradeLevel}
        />
      )}
      {activeTab === 'video'    && <EnglishVideoTab videos={englishVideos} canEdit={canEdit} studentId={studentId} teacherNotes={teacherNotes} role={role} />}
    </section>
  )
}
