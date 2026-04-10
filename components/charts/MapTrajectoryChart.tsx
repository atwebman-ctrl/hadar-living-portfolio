'use client'

// ============================================================
// components/charts/MapTrajectoryChart.tsx
//
// Multi-year percentile trajectory chart.
// X axis: assessment terms in chronological order across all years.
// Y axis: percentile (0–100).
// Two lines: Mathematics (navy) and English Language Arts (gold).
// Used by IntellectualArcAllYears when selectedYear === 'all'.
//
// Uses raw Chart.js (not react-chartjs-2 <Line>) so we have
// explicit control over instance lifecycle — same pattern as
// MapPercentileChart. See that file for full rationale.
// ============================================================

import { useEffect, useRef } from 'react'
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

// ── Types ─────────────────────────────────────────────────────

interface Props {
  mathAssessments:    Assessment[]
  englishAssessments: Assessment[]
}

// ── Constants ─────────────────────────────────────────────────

const NAVY = '#1B3A6B'
const GOLD = '#B8963E'

// ── Helpers ───────────────────────────────────────────────────

// Converts (term, academicYear) to a numeric sort key.
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<ChartJS | null>(null)

  // Stable serialized dep keys — effect only fires when data actually changes.
  const mathKey    = JSON.stringify(mathAssessments.map((a) => ({ t: a.term, y: a.academicYear, p: a.percentile })))
  const englishKey = JSON.stringify(englishAssessments.map((a) => ({ t: a.term, y: a.academicYear, p: a.percentile })))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Destroy any existing instance before creating a new one.
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    // ── Build chart data ───────────────────────────────────────
    const allTerms = Array.from(
      new Map(
        [...mathAssessments, ...englishAssessments].map((a) => [
          `${a.term}||${a.academicYear}`,
          { term: a.term, academicYear: a.academicYear },
        ]),
      ).values(),
    ).sort((a, b) => termSortKey(a.term, a.academicYear) - termSortKey(b.term, b.academicYear))

    if (allTerms.length === 0) return

    const labels = allTerms.map((t) => shortLabel(t.term))

    const buildSeries = (assessments: Assessment[]) =>
      allTerms.map(({ term, academicYear }) => {
        const a = assessments.find((x) => x.term === term && x.academicYear === academicYear)
        return a?.percentile ?? null
      })

    const mathSeries    = buildSeries(mathAssessments)
    const englishSeries = buildSeries(englishAssessments)

    // ── Create instance ────────────────────────────────────────
    chartRef.current = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label:                'Mathematics',
            data:                 mathSeries,
            borderColor:          NAVY,
            backgroundColor:      NAVY,
            pointBackgroundColor: NAVY,
            pointBorderColor:     NAVY,
            borderWidth:          2,
            pointRadius:          5,
            pointHoverRadius:     7,
            spanGaps:             false,
            tension:              0.2,
          },
          {
            label:                'English',
            data:                 englishSeries,
            borderColor:          GOLD,
            backgroundColor:      GOLD,
            pointBackgroundColor: GOLD,
            pointBorderColor:     GOLD,
            borderWidth:          2,
            pointRadius:          5,
            pointHoverRadius:     7,
            spanGaps:             false,
            tension:              0.2,
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           false,
        plugins: {
          legend: {
            display:  true,
            position: 'bottom' as const,
            labels:   { font: { family: 'DM Mono', size: 9 }, boxWidth: 12, color: '#888' },
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
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mathKey, englishKey])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
