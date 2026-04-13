// ============================================================
// components/portfolio/IntellectualArcAllYears.tsx
//
// Trajectory view for IntellectualArc when selectedYear === 'all'.
// Shows:
//   1. MapTrajectoryChart — percentile lines across all years
//   2. Summary sentence per subject (earliest → latest + delta)
//   3. Per-year score tables in collapsible YearGroups
// ============================================================

import type { Assessment, UserRole } from '@/lib/types'
import MapTrajectoryChart, { termSortKey } from '@/components/charts/MapTrajectoryChart'
import SubjectScoreRows, { type ScoreDisplayRow } from '@/components/portfolio/SubjectScoreRows'
import YearGroup from '@/components/portfolio/YearGroup'
import InlineAssessmentForm from '@/components/portfolio/InlineAssessmentForm'
import s from './sections.module.css'

interface Props {
  mathAssessments:    Assessment[]
  englishAssessments: Assessment[]
  currentYear:        string   // student's active year — default-open in YearGroup
  studentId?:         string
  role?:              UserRole
}

// ── Helpers ───────────────────────────────────────────────────

function toDisplayRows(assessments: Assessment[]): ScoreDisplayRow[] {
  return assessments.map((a) => ({
    id: a.id, term: a.term, academicYear: a.academicYear,
    ritScore: a.ritScore, score: a.score, percentile: a.percentile,
  }))
}

/** "Math: 45th → 92nd percentile over 3 years (+47 pts)" */
function trajectorySummary(assessments: Assessment[], label: string): string | null {
  const withPct = assessments
    .filter((a) => a.percentile != null)
    .sort((a, b) => termSortKey(a.term, a.academicYear) - termSortKey(b.term, b.academicYear))
  if (withPct.length < 2) return null
  const first = withPct[0].percentile!
  const last  = withPct[withPct.length - 1].percentile!
  const delta = last - first
  const years = new Set(withPct.map((a) => a.academicYear)).size
  return `${label}: ${first}th → ${last}th percentile over ${years} year${years !== 1 ? 's' : ''} (${delta >= 0 ? '+' : ''}${delta} pts)`
}

/** Group assessments by academicYear, sorted newest-first */
function groupByYear(assessments: Assessment[]): { year: string; rows: ScoreDisplayRow[] }[] {
  const map = new Map<string, Assessment[]>()
  for (const a of assessments) {
    const bucket = map.get(a.academicYear) ?? []
    bucket.push(a)
    map.set(a.academicYear, bucket)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (b ?? '').localeCompare(a ?? ''))   // newest year first
    .map(([year, rows]) => ({ year, rows: toDisplayRows(rows) }))
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

export default function IntellectualArcAllYears({
  mathAssessments,
  englishAssessments,
  currentYear,
  studentId,
  role,
}: Props) {
  const mathSummary    = trajectorySummary(mathAssessments, 'Math')
  const englishSummary = trajectorySummary(englishAssessments, 'English')
  const mathGroups     = groupByYear(mathAssessments)
  const englishGroups  = groupByYear(englishAssessments)
  const canEdit        = !!studentId && role && role !== 'parent'

  return (
    <>
      {/* ── Trajectory chart ──────────────────────────────── */}
      <div className={`${s.chartWrap} reveal`}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', borderBottom: '1px solid var(--rule)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--navy)', margin: 0 }}>Multi-Year Trajectory</h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>MAP Assessments — All Years</span>
        </div>

        {/* Summary sentences */}
        {(mathSummary || englishSummary) && (
          <div style={{ marginBottom: '1rem' }}>
            {[mathSummary, englishSummary].filter(Boolean).map((s) => (
              <p key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-mid)', margin: '0 0 0.3rem', letterSpacing: '0.04em' }}>
                {s}
              </p>
            ))}
          </div>
        )}

        <div style={{ position: 'relative', height: 260, marginTop: '0.5rem' }}>
          <MapTrajectoryChart mathAssessments={mathAssessments} englishAssessments={englishAssessments} />
        </div>
      </div>

      {/* ── Per-year tables ───────────────────────────────── */}
      {mathGroups.length > 0 && (
        <div className={`${s.chartWrap} reveal`}>
          <SubjectHeading title="Mathematics" tag="MAP — by year" />
          {mathGroups.map(({ year, rows }) => (
            <YearGroup key={year} year={year} defaultOpen={year === currentYear}>
              <SubjectScoreRows rows={rows} />
            </YearGroup>
          ))}
          {canEdit && studentId && (
            <InlineAssessmentForm studentId={studentId} defaultType="maps_math" label="Add MAP Math Score" />
          )}
        </div>
      )}

      {englishGroups.length > 0 && (
        <div className={`${s.chartWrap} reveal`}>
          <SubjectHeading title="English Language Arts" tag="MAP — by year" />
          {englishGroups.map(({ year, rows }) => (
            <YearGroup key={year} year={year} defaultOpen={year === currentYear}>
              <SubjectScoreRows rows={rows} />
            </YearGroup>
          ))}
          {canEdit && studentId && (
            <InlineAssessmentForm studentId={studentId} defaultType="maps_english" label="Add MAP Reading Score" />
          )}
        </div>
      )}
    </>
  )
}
