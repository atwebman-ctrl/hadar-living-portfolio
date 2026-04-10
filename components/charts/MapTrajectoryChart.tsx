'use client'

// ============================================================
// components/charts/MapTrajectoryChart.tsx
//
// Multi-year percentile trajectory chart.
// X axis: assessment terms in chronological order across all years.
// Y axis: percentile (0–100).
// Two lines: Mathematics (navy) and English Language Arts (gold).
// Used by IntellectualArcAllYears when selectedYear === 'all'.
// ============================================================

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { Assessment } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface Props {
  mathAssessments:    Assessment[]
  englishAssessments: Assessment[]
}

const NAVY = '#1B3A6B'
const GOLD = '#B8963E'

// ── Chronological sort key ────────────────────────────────────
// Converts (term, academicYear) to a numeric key for sorting.
// Academic year start year × 10 + season ordinal (fall=0, winter=1, spring=2)

export function termSortKey(term: string, academicYear: string): number {
  const yearStart = parseInt(academicYear.split('-')[0] ?? '2000', 10)
  const t = term.toLowerCase()
  const season = t.includes('fall') ? 0 : t.includes('winter') ? 1 : t.includes('spring') ? 2 : 3
  return yearStart * 10 + season
}

// "Fall 2024" → "Fall '24"
function shortLabel(term: string): string {
  return term.replace(/(\d{4})/, (y) => `'${y.slice(2)}`)
}

// ── Component ─────────────────────────────────────────────────

export default function MapTrajectoryChart({ mathAssessments, englishAssessments }: Props) {
  // DEBUG — remove after diagnosis
  console.log('[MapTrajectoryChart] mathAssessments received:', mathAssessments.length, mathAssessments.map((a) => ({ term: a.term, year: a.academicYear, rit: a.ritScore, pct: a.percentile })))
  console.log('[MapTrajectoryChart] englishAssessments received:', englishAssessments.length, englishAssessments.map((a) => ({ term: a.term, year: a.academicYear, rit: a.ritScore, pct: a.percentile })))

  // Build deduplicated, chronologically sorted term list
  const allTerms = Array.from(
    new Map(
      [...mathAssessments, ...englishAssessments].map((a) => [
        `${a.term}||${a.academicYear}`,
        { term: a.term, academicYear: a.academicYear },
      ]),
    ).values(),
  ).sort((a, b) => termSortKey(a.term, a.academicYear) - termSortKey(b.term, b.academicYear))

  console.log('[MapTrajectoryChart] allTerms (sorted):', allTerms.map((t) => `${t.term} / ${t.academicYear}`))

  if (allTerms.length === 0) return null

  const labels = allTerms.map((t) => shortLabel(t.term))

  const buildSeries = (assessments: Assessment[]) =>
    allTerms.map(({ term, academicYear }) => {
      const a = assessments.find((x) => x.term === term && x.academicYear === academicYear)
      return a?.percentile ?? null
    })

  const mathSeries    = buildSeries(mathAssessments)
  const englishSeries = buildSeries(englishAssessments)
  console.log('[MapTrajectoryChart] math series (percentiles by term):', mathSeries)
  console.log('[MapTrajectoryChart] english series (percentiles by term):', englishSeries)
  console.log('[MapTrajectoryChart] math non-null points:', mathSeries.filter((v) => v !== null).length, '| english non-null points:', englishSeries.filter((v) => v !== null).length)

  const datasets = [
    {
      label:              'Mathematics',
      data:               mathSeries,
      borderColor:        NAVY,
      backgroundColor:    NAVY,
      pointBackgroundColor: NAVY,
      pointBorderColor:   NAVY,
      borderWidth:        2,
      pointRadius:        5,
      pointHoverRadius:   7,
      spanGaps:           false,
      tension:            0.2,
    },
    {
      label:              'English',
      data:               englishSeries,
      borderColor:        GOLD,
      backgroundColor:    GOLD,
      pointBackgroundColor: GOLD,
      pointBorderColor:   GOLD,
      borderWidth:        2,
      pointRadius:        5,
      pointHoverRadius:   7,
      spanGaps:           false,
      tension:            0.2,
    },
  ]

  return (
    <Line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data={{ labels, datasets } as any}
      options={{
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display:  true,
            position: 'bottom' as const,
            labels: { font: { family: 'DM Mono', size: 9 }, boxWidth: 12, color: '#888' },
          },
          tooltip: {
            callbacks: {
              label: (item) =>
                `${item.dataset.label}: ${item.parsed.y != null ? item.parsed.y + 'th %ile' : '—'}`,
            },
          },
        },
        scales: {
          x: {
            grid:  { display: false },
            ticks: { font: { family: 'DM Mono', size: 9 }, maxRotation: 45 },
          },
          y: {
            min:   0,
            max:   100,
            grid:  { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font:     { family: 'DM Mono', size: 9 },
              stepSize: 25,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              callback: (v: any) => `${v}th`,
            },
            title: {
              display: true,
              text:    'Percentile',
              font:    { family: 'DM Mono', size: 9 },
              color:   '#999',
            },
          },
        },
      }}
    />
  )
}
