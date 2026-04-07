'use client'

// ============================================================
// components/charts/MapPercentileChart.tsx
//
// Renders NWEA MAP percentile bands as stacked area fills with
// the student's actual RIT scores plotted as dots on top.
// Bands: 5th / 25th / 50th / 75th / 95th using 2025 norms.
// ============================================================

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { getPercentileBands } from '@/lib/nweaNorms'
import type { NormSubject, NormSeason } from '@/lib/nweaNorms'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ── Public types ──────────────────────────────────────────────

export interface StudentScorePoint {
  grade:    number      // 0 = K, 1–8 = grades 1–8
  season:   NormSeason
  ritScore: number
}

interface Props {
  subject:       NormSubject
  studentScores?: StudentScorePoint[]
  /** If omitted, derived from studentScores min/max grade ± 1. */
  gradeRange?:   { start: number; end: number }
}

// ── Constants ─────────────────────────────────────────────────

const GRADE_LABEL: Record<number, string> = {
  0: 'K', 1: '1', 2: '2', 3: '3', 4: '4',
  5: '5', 6: '6', 7: '7', 8: '8',
}

// Teal-to-seafoam band palette — darkest at bottom (below p5)
const BAND_BG = [
  'rgba(12, 108, 88, 0.72)',   // fill to p5
  'rgba(24, 148, 118, 0.52)',  // p5 → p25
  'rgba(44, 178, 148, 0.40)',  // p25 → p50
  'rgba(68, 200, 165, 0.30)',  // p50 → p75
  'rgba(104, 220, 185, 0.20)', // p75 → p95
]

const NAVY  = '#1B3A6B'
const GOLD  = '#B8963E'

// ── Helpers ────────────────────────────────────────────────────

function effectiveRange(
  studentScores: StudentScorePoint[],
  override?: { start: number; end: number },
): { start: number; end: number } {
  if (override) return override
  if (studentScores.length === 0) return { start: 1, end: 3 }
  const grades = studentScores.map((s) => s.grade)
  return {
    start: Math.max(0, Math.min(...grades)),
    end:   Math.min(8, Math.max(...grades) + 1),
  }
}

// ── Component ─────────────────────────────────────────────────

export default function MapPercentileChart({
  subject,
  studentScores = [],
  gradeRange,
}: Props) {
  const range  = effectiveRange(studentScores, gradeRange)
  const bands  = getPercentileBands(subject, range)

  // Categorical labels — show grade number only at fall positions
  const labels = bands.map((b) =>
    b.season === 'fall' ? (GRADE_LABEL[b.grade] ?? String(b.grade)) : '',
  )

  // Band data arrays (one value per band point)
  const p = (key: 'p5' | 'p25' | 'p50' | 'p75' | 'p95') => bands.map((b) => b[key])

  // Student score array aligned to band positions (null where no score)
  const studentData = bands.map((b) => {
    const match = studentScores.find((s) => s.grade === b.grade && s.season === b.season)
    return match?.ritScore ?? null
  })

  // Latest non-null student score → gold dot; all others → navy
  const lastIdx = studentData.reduce<number>((last, v, i) => (v !== null ? i : last), -1)
  const ptColors = studentData.map((v, i) =>
    v === null ? 'transparent' : i === lastIdx ? GOLD : NAVY,
  )
  const ptRadii = studentData.map((v, i) =>
    v === null ? 0 : i === lastIdx ? 7 : 5,
  )

  // Compute y-axis bounds from band data
  const yMin = Math.max(100, Math.floor((Math.min(...p('p5'))  - 10) / 10) * 10)
  const yMax = Math.ceil( (Math.max(...p('p95')) + 10) / 10) * 10

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mkBand = (data: number[], fill: string, bg: string): any => ({
    data, fill, backgroundColor: bg, borderColor: 'transparent',
    borderWidth: 0, pointRadius: 0, tension: 0.35,
  })

  const datasets = [
    mkBand(p('p5'),  'start', BAND_BG[0]),
    mkBand(p('p25'), '-1',    BAND_BG[1]),
    mkBand(p('p50'), '-1',    BAND_BG[2]),
    mkBand(p('p75'), '-1',    BAND_BG[3]),
    mkBand(p('p95'), '-1',    BAND_BG[4]),
    // Student overlay
    {
      label:                'Student',
      data:                 studentData,
      fill:                 false,
      borderColor:          NAVY,
      backgroundColor:      NAVY,
      pointBackgroundColor: ptColors,
      pointBorderColor:     ptColors,
      pointRadius:          ptRadii,
      pointHoverRadius:     ptRadii.map((r) => (r > 0 ? r + 2 : 0)),
      borderWidth:          2,
      spanGaps:             false,
      tension:              0.2,
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
            labels: {
              font:     { family: 'DM Mono', size: 8 },
              boxWidth: 12,
              color:    '#888',
              filter:   (item) => item.text !== 'Student' && item.datasetIndex !== undefined && item.datasetIndex < 5,
              generateLabels: () => [
                { text: '95th %ile', fillStyle: BAND_BG[4], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '75th %ile', fillStyle: BAND_BG[3], strokeStyle: 'transparent', lineWidth: 0 },
                { text: 'Mean',      fillStyle: BAND_BG[2], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '25th %ile', fillStyle: BAND_BG[1], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '5th %ile',  fillStyle: BAND_BG[0], strokeStyle: 'transparent', lineWidth: 0 },
              ],
            },
          },
          tooltip: {
            filter: (item) => item.datasetIndex === 5 && item.parsed.y !== null,
            callbacks: {
              title: (items) => {
                const b = bands[items[0].dataIndex]
                return `${GRADE_LABEL[b.grade] ?? b.grade} — ${b.season.charAt(0).toUpperCase() + b.season.slice(1)}`
              },
              label: (item) => `RIT: ${item.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid:  { display: false },
            ticks: { font: { family: 'DM Mono', size: 9 }, maxRotation: 0 },
            title: { display: true, text: 'Grade', font: { family: 'DM Mono', size: 9 }, color: '#999' },
          },
          y: {
            min:   yMin,
            max:   yMax,
            grid:  { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { family: 'DM Mono', size: 9 }, stepSize: 20 },
            title: { display: true, text: 'RIT Score', font: { family: 'DM Mono', size: 9 }, color: '#999' },
          },
        },
      }}
    />
  )
}
