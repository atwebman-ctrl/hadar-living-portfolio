import type { Assessment, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import SubjectScoreRows, { type ScoreDisplayRow } from '@/components/portfolio/SubjectScoreRows'
import MapPercentileChart, { type StudentScorePoint } from '@/components/charts/MapPercentileChart'

interface Props {
  assessments?:          Assessment[]
  studentId?:            string
  studentName?:          string
  role?:                 UserRole
  existingMathDraft?:    AiDraft
  existingEnglishDraft?: AiDraft
  /** Student's current grade level string, e.g. "3rd Grade" */
  gradeLevel?:           string
  /** Student's current academic year, e.g. "2025-2026" */
  academicYear?:         string
}

// ── Demo fallback data ────────────────────────────────────────

const DEMO_MATH_ROWS: ScoreDisplayRow[] = [
  { term: 'Spring 2025', academicYear: '2024-2025', ritScore: 231, score: null, percentile: 95 },
  { term: 'Fall 2024',   academicYear: '2024-2025', ritScore: 224, score: null, percentile: 90 },
  { term: 'Spring 2024', academicYear: '2023-2024', ritScore: 215, score: null, percentile: 82 },
  { term: 'Fall 2023',   academicYear: '2023-2024', ritScore: 208, score: null, percentile: 76 },
]

const DEMO_ENGLISH_ROWS: ScoreDisplayRow[] = [
  { term: 'Spring 2025', academicYear: '2024-2025', ritScore: 218, score: null, percentile: 89 },
  { term: 'Fall 2024',   academicYear: '2024-2025', ritScore: 212, score: null, percentile: 85 },
  { term: 'Spring 2024', academicYear: '2023-2024', ritScore: 205, score: null, percentile: 78 },
  { term: 'Fall 2023',   academicYear: '2023-2024', ritScore: 198, score: null, percentile: 72 },
]

// Demo student scores for the percentile chart (derived from MapsChart DEMO_DATA)
const DEMO_MATH_SCORES: StudentScorePoint[] = [
  { grade: 1, season: 'fall',   ritScore: 179 },
  { grade: 1, season: 'spring', ritScore: 194 },
  { grade: 2, season: 'fall',   ritScore: 188 },
  { grade: 2, season: 'winter', ritScore: 199 },
  { grade: 2, season: 'spring', ritScore: 211 },
  { grade: 3, season: 'fall',   ritScore: 214 },
  { grade: 3, season: 'winter', ritScore: 219 },
]

const DEMO_READING_SCORES: StudentScorePoint[] = [
  { grade: 1, season: 'fall',   ritScore: 183 },
  { grade: 1, season: 'spring', ritScore: 193 },
  { grade: 2, season: 'fall',   ritScore: 216 },
  { grade: 2, season: 'winter', ritScore: 212 },
  { grade: 2, season: 'spring', ritScore: 221 },
  { grade: 3, season: 'fall',   ritScore: 216 },
  { grade: 3, season: 'winter', ritScore: 229 },
]

const LEXILE_BENCHMARKS = [
  { lbl: '3rd Grade avg',  pct: '32%',  bg: 'var(--ink-faint)', opacity: 0.3,  val: '420L',  highlight: false },
  { lbl: '8th Grade avg',  pct: '61%',  bg: 'var(--navy)',      opacity: 0.4,  val: '1010L', highlight: false },
  { lbl: '11th Grade avg', pct: '80%',  bg: 'var(--navy)',      opacity: 0.55, val: '1200L', highlight: false },
  { lbl: 'College-ready',  pct: '100%', bg: 'var(--gold)',      opacity: 0.4,  val: '1300L', highlight: false },
]

const DEMO_STUDENT_LEXILE = { lbl: 'Athena (age 8)', pct: '90%', bg: 'var(--navy)', opacity: 1, val: '1225L', highlight: true }
const DEMO_BOOKS = 'Tales from Shakespeare · Great Expectations · The Jungle Book'

// ── Helpers ───────────────────────────────────────────────────

function toDisplayRows(assessments: Assessment[]): ScoreDisplayRow[] {
  return assessments.map((a) => ({
    id: a.id, term: a.term, academicYear: a.academicYear,
    ritScore: a.ritScore, score: a.score, percentile: a.percentile,
  }))
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

function buildStudentLexileRow(assessments: Assessment[]) {
  const lexile = assessments.find((a) => a.assessmentType === 'lexile')
  if (!lexile?.lexileValue) return null
  const n = parseInt(lexile.lexileValue, 10)
  if (isNaN(n)) return null
  return { lbl: 'Current Level', pct: `${Math.min(100, Math.round((n / 1300) * 100))}%`, bg: 'var(--navy)', opacity: 1, val: lexile.lexileValue, highlight: true }
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
    const aStart = parseInt(a.academicYear.split('-')[0], 10)
    if (isNaN(aStart)) return []
    const grade = currentGradeNum - (curStart - aStart)
    if (grade < 0 || grade > 8) return []
    const t = a.term.toLowerCase()
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

// ── Component ─────────────────────────────────────────────────

export default function IntellectualArc({ assessments, studentId, studentName, role, existingMathDraft, existingEnglishDraft, gradeLevel, academicYear }: Props) {
  // Compute subject arrays unconditionally so each can fall back independently.
  const mathAssessments    = assessments?.filter((a) => a.assessmentType === 'maps_math')    ?? []
  const englishAssessments = assessments?.filter((a) => a.assessmentType === 'maps_english') ?? []

  // Per-subject flags: only true if that subject has actual MAPS scores.
  // This ensures demo fallbacks show for real students missing one or both subjects.
  const hasMathData    = mathAssessments.length > 0
  const hasEnglishData = englishAssessments.length > 0
  // Used for Lexile (which lives on the overall assessments array, not MAPS).
  const hasAnyData     = !!assessments && assessments.length > 0

  const mathRows    = hasMathData    ? toDisplayRows(mathAssessments)    : DEMO_MATH_ROWS
  const englishRows = hasEnglishData ? toDisplayRows(englishAssessments) : DEMO_ENGLISH_ROWS

  // Math percentile delta for callout (DB newest-first)
  const mathPcts = mathRows.filter((r) => r.percentile != null).map((r) => r.percentile as number)
  const firstPct = mathPcts.length >= 2 ? mathPcts[mathPcts.length - 1] : (hasMathData ? null : 76)
  const lastPct  = mathPcts.length >= 2 ? mathPcts[0]                   : (hasMathData ? null : 95)
  const deltaNum = firstPct != null && lastPct != null ? lastPct - firstPct : null
  const deltaText = deltaNum != null ? (deltaNum >= 0 ? '+' : '') + deltaNum : '+19'

  // AI contexts (teacher/admin only)
  const canGenerate    = !!studentId && !!role && role !== 'parent'
  const mathContext    = canGenerate ? buildSubjectContext(mathRows, 'Mathematics', studentName ?? null) : null
  const englishContext = canGenerate ? buildSubjectContext(englishRows, 'English Language Arts', studentName ?? null) : null

  // Percentile chart student scores — fall back to demo when no subject-specific data
  const gradeNum = gradeLevel ? parseGradeNumber(gradeLevel) : null
  const mathScores = (hasMathData && gradeNum !== null && academicYear)
    ? toStudentScorePoints(mathAssessments, gradeNum, academicYear)
    : DEMO_MATH_SCORES
  const readingScores = (hasEnglishData && gradeNum !== null && academicYear)
    ? toStudentScorePoints(englishAssessments, gradeNum, academicYear)
    : DEMO_READING_SCORES

  // Lexile
  const studentLexileRow = hasAnyData ? buildStudentLexileRow(assessments!) : DEMO_STUDENT_LEXILE
  const lexileRows = studentLexileRow
    ? [...LEXILE_BENCHMARKS.slice(0, 3), studentLexileRow, LEXILE_BENCHMARKS[3]]
    : LEXILE_BENCHMARKS

  return (
    <section id="academics">
      <div className="section-header reveal">
        <span className="section-num">01</span>
        <h2 className="section-title">The Intellectual Arc</h2>
        <div className="section-rule" />
      </div>

      {/* ── Mathematics ──────────────────────────────────────── */}
      <div className="chart-wrap reveal">
        <SubjectHeading title="Mathematics" tag="MAP Assessment" />
        {firstPct != null && lastPct != null && (
          <div className="callout" style={{ marginBottom: '1rem' }}>
            <div className="big">{deltaText}</div>
            <div className="text">
              <strong>From {firstPct}th to {lastPct}th percentile across recorded sittings.</strong>
            </div>
          </div>
        )}
        <SubjectScoreRows rows={mathRows} />
        {studentId && role && (mathContext || role === 'parent') && (
          <AiNarrativePanel studentId={studentId} role={role} sectionType="math_scores" existingDraft={existingMathDraft} draftContext={mathContext ?? {}} />
        )}
        <div style={{ position: 'relative', height: 260, marginTop: '1rem' }}>
          <MapPercentileChart subject="math" studentScores={mathScores} />
        </div>
      </div>

      {/* ── English Language Arts ────────────────────────────── */}
      <div className="chart-wrap reveal">
        <SubjectHeading title="English Language Arts" tag="MAP Assessment" />
        <SubjectScoreRows rows={englishRows} />
        {studentId && role && (englishContext || role === 'parent') && (
          <AiNarrativePanel studentId={studentId} role={role} sectionType="english_scores" existingDraft={existingEnglishDraft} draftContext={englishContext ?? {}} />
        )}
        <div style={{ position: 'relative', height: 260, marginTop: '1rem' }}>
          <MapPercentileChart subject="reading" studentScores={readingScores} />
        </div>
      </div>

      {/* ── Lexile chart ─────────────────────────────────────── */}
      <div className="chart-wrap reveal">
        <div className="chart-title">Lexile Reading Level vs. Grade Benchmarks</div>
        <p style={{ marginBottom: 8, fontStyle: 'italic', fontSize: '.85rem', color: 'var(--ink-light)' }}>
          {hasAnyData
            ? 'Reading level compared to national grade-level benchmarks.'
            : 'At age 8, Athena reads at the same level as college-entry seniors. Her current range ' +
              '(1150–1300L) aligns with 11th–12th grade readiness benchmarks.'}
        </p>
        <div style={{ marginTop: '1.25rem' }}>
          {lexileRows.map((r) => (
            <div key={r.lbl} className="lexile-row">
              <span className="lexile-lbl" style={r.highlight ? { color: 'var(--navy)', fontWeight: 500 } : undefined}>{r.lbl}</span>
              <div className="lexile-bar-outer" style={r.highlight ? { background: 'rgba(27,58,107,.1)' } : undefined}>
                <div className="lexile-bar-inner" style={{ width: r.pct, background: r.bg, opacity: r.opacity }} />
              </div>
              <span className="lexile-val" style={r.highlight ? { color: 'var(--navy)', fontWeight: 500 } : undefined}>{r.val}</span>
            </div>
          ))}
        </div>
        {!hasAnyData && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--rule)', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink-light)' }}>
            Currently reading: <em style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{DEMO_BOOKS}</em>
          </div>
        )}
      </div>
    </section>
  )
}
