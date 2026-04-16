import type { Assessment, AiDraft, TeacherNote, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import AiDraftEditor from '@/components/shared/AiDraftEditor'
import SubjectScoreRows, { type ScoreDisplayRow } from '@/components/portfolio/SubjectScoreRows'
import MapPercentileChart, { type StudentScorePoint } from '@/components/charts/MapPercentileChart'
import InlineAssessmentForm from '@/components/portfolio/InlineAssessmentForm'
import InlineSectionComment from '@/components/shared/InlineSectionComment'
import IntellectualArcAllYears from '@/components/portfolio/IntellectualArcAllYears'
import {
  DEMO_MATH_ROWS, DEMO_MATH_SCORES, DEMO_MATH_NARRATIVE,
} from './IntellectualArcDemoData'
import s from './sections.module.css'

interface Props {
  assessments?:       Assessment[]
  teacherNotes?:      TeacherNote[]
  studentId?:         string
  studentName?:       string
  role?:              UserRole
  existingMathDraft?: AiDraft
  /** Student's current grade level string, e.g. "3rd Grade" */
  gradeLevel?:        string
  /** Student's current academic year, e.g. "2025-2026" */
  academicYear?:      string
  /** The student's active year — used as default-open in YearGroup */
  currentYear?:       string
  /** 'all' = trajectory view; any year string = filter to that year */
  selectedYear?:      string
}

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
    const t = (a.term ?? '').toLowerCase()
    const season = t.includes('fall') ? 'fall' : t.includes('winter') ? 'winter' : t.includes('spring') ? 'spring' : null
    if (!season) return []
    return [{ grade, season, ritScore: a.ritScore }]
  })
}

// ── Sub-section heading ───────────────────────────────────────

function SubjectHeading({ title, tag }: { title: string; tag: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', borderBottom: '1px solid var(--rule)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--navy)', margin: 0 }}>{title}</h3>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{tag}</span>
    </div>
  )
}

// ── Muted "Standardized test history" link ────────────────────

function TestHistoryLink() {
  return (
    <a
      href="#"
      style={{
        display: 'inline-block',
        marginTop: '0.25rem',
        marginBottom: '1rem',
        fontSize: 12,
        color: 'var(--ink-light)',
        textDecoration: 'none',
        borderBottom: 'none',
      }}
    >
      Standardized test history →
    </a>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function MathSection({
  assessments,
  teacherNotes,
  studentId,
  studentName,
  role,
  existingMathDraft,
  gradeLevel,
  academicYear,
  currentYear,
  selectedYear,
}: Props) {
  const canEdit = !!studentId && (role === 'admin' || role === 'teacher')

  // When showing all years and there is real math data, delegate to the trajectory view.
  const allMath = assessments?.filter((a) => a.assessmentType === 'maps_math') ?? []

  if (selectedYear === 'all' && allMath.length > 0) {
    return (
      <section id="math">
        <div className={`${s.sectionHeader} reveal`}>
          <span className={s.sectionNum}>01</span>
          <h2 className={s.sectionTitle}>Math</h2>
          <div className={s.sectionRule} />
        </div>
        <TestHistoryLink />
        <IntellectualArcAllYears
          mathAssessments={allMath}
          englishAssessments={[]}
          currentYear={currentYear ?? academicYear ?? ''}
          studentId={studentId}
          role={role}
        />
        {studentId && (
          <InlineSectionComment
            studentId={studentId}
            sectionCategory="intellectual_arc"
            sectionAnchor="math-scores"
            canEdit={canEdit}
            notes={teacherNotes}
            role={role}
          />
        )}
      </section>
    )
  }

  // Filter to selected year when not 'all'. Falls back to all data when selectedYear is undefined.
  const visibleAssessments = (selectedYear && selectedYear !== 'all')
    ? assessments?.filter((a) => a.academicYear === selectedYear)
    : assessments

  const mathAssessments = visibleAssessments?.filter((a) => a.assessmentType === 'maps_math') ?? []
  const hasMathData     = mathAssessments.length > 0
  const gradeNum        = gradeLevel ? parseGradeNumber(gradeLevel) : null
  const mathRows        = hasMathData
    ? toDisplayRows(mathAssessments, gradeNum, academicYear)
    : DEMO_MATH_ROWS

  // Math percentile delta for callout (DB newest-first)
  const mathPcts = mathRows.filter((r) => r.percentile != null).map((r) => r.percentile as number)
  const firstPct = mathPcts.length >= 2 ? mathPcts[mathPcts.length - 1] : (hasMathData ? null : 76)
  const lastPct  = mathPcts.length >= 2 ? mathPcts[0]                   : (hasMathData ? null : 95)
  const deltaNum = firstPct != null && lastPct != null ? lastPct - firstPct : null
  const deltaText = deltaNum != null ? (deltaNum >= 0 ? '+' : '') + deltaNum : '+19'

  // AI context (teacher/admin only)
  const canGenerate = !!studentId && !!role && role !== 'parent'
  const mathContext = canGenerate ? buildSubjectContext(mathRows, 'Mathematics', studentName ?? null) : null

  // Percentile chart student scores — fall back to demo when no subject-specific data
  const mathScores = (hasMathData && gradeNum !== null && academicYear)
    ? toStudentScorePoints(mathAssessments, gradeNum, academicYear)
    : DEMO_MATH_SCORES

  return (
    <section id="math">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>01</span>
        <h2 className={s.sectionTitle}>Math</h2>
        <div className={s.sectionRule} />
      </div>
      <TestHistoryLink />

      {/* ── Mathematics ──────────────────────────────────────── */}
      <div className={`${s.chartWrap} reveal`}>
        <SubjectHeading title="Mathematics" tag="MAP Assessment" />
        {firstPct != null && lastPct != null && (
          <div className={s.callout} style={{ marginBottom: '1rem' }}>
            <div className={s.calloutBig}>{deltaText}</div>
            <div className={s.calloutText}>
              <strong>From {firstPct}th to {lastPct}th percentile across recorded sittings.</strong>
            </div>
          </div>
        )}
        <div style={{ position: 'relative', height: 260, marginBottom: '1.25rem' }}>
          <MapPercentileChart subject="math" studentScores={mathScores} />
        </div>
        <SubjectScoreRows rows={mathRows} />
        {studentId && role && (mathContext || role === 'parent') && (
          <AiNarrativePanel studentId={studentId} role={role} sectionType="math_scores" existingDraft={existingMathDraft} draftContext={mathContext ?? {}} />
        )}
        {!studentId && (
          <AiDraftEditor
            draftId="demo-math"
            sectionType="math_scores"
            initialStatus="accepted"
            initialText={DEMO_MATH_NARRATIVE}
            initialFinalText={DEMO_MATH_NARRATIVE}
          />
        )}
        {studentId && (
          <InlineSectionComment
            studentId={studentId}
            sectionCategory="intellectual_arc"
            sectionAnchor="math-scores"
            canEdit={canEdit}
            notes={teacherNotes}
            role={role}
          />
        )}
        {studentId && role !== 'parent' && (
          <InlineAssessmentForm studentId={studentId} defaultType="maps_math" label="Add MAP Math Score" />
        )}
      </div>
    </section>
  )
}
