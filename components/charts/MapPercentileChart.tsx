'use client'

// ============================================================
// components/charts/MapPercentileChart.tsx
//
// Renders NWEA MAP percentile bands as stacked area fills with
// the student's actual RIT scores plotted as dots on top.
// Bands: 5th / 25th / 50th / 75th / 95th using 2025 norms.
//
// Uses raw Chart.js (not react-chartjs-2 <Line>) so we have
// explicit control over instance creation and destruction:
//   - chartRef stores the single live instance
//   - useEffect cleanup always calls chart.destroy() before
//     unmount or before a new instance is created
//   - animation: false prevents requestAnimationFrame callbacks
//     from holding stale data references between renders
//   - deps use JSON-serialized keys so the effect only re-runs
//     when data actually changes, not on every parent render
// ============================================================

import { useEffect, useRef } from 'react'
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } from 'chart.js'
import { getPercentileBands } from '@/lib/nweaNorms'
import type { NormSubject, NormSeason } from '@/lib/nweaNorms'

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

// ── Public types ──────────────────────────────────────────────

export interface StudentScorePoint {
  grade:    number      // 0 = K, 1–8 = grades 1–8
  season:   NormSeason
  ritScore: number
}

interface Props {
  subject:        NormSubject
  studentScores?: StudentScorePoint[]
  /** If omitted, derived from studentScores min/max grade ± 1. */
  gradeRange?:    { start: number; end: number }
}

// ── Constants ─────────────────────────────────────────────────

const GRADE_LABEL: Record<number, string> = {
  0: 'K', 1: '1', 2: '2', 3: '3', 4: '4',
  5: '5', 6: '6', 7: '7', 8: '8',
}

const BAND_BG = [
  'rgba(12, 108, 88, 0.72)',   // fill to p5
  'rgba(24, 148, 118, 0.52)',  // p5 → p25
  'rgba(44, 178, 148, 0.40)',  // p25 → p50
  'rgba(68, 200, 165, 0.30)',  // p50 → p75
  'rgba(104, 220, 185, 0.20)', // p75 → p95
]

const NAVY = '#1B3A6B'
const GOLD = '#B8963E'

// ── Helpers ───────────────────────────────────────────────────

function effectiveRange(
  scores: StudentScorePoint[],
  override?: { start: number; end: number },
): { start: number; end: number } {
  if (override) return override
  if (!scores.length) return { start: 1, end: 3 }
  const grades = scores.map((s) => s.grade)
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<ChartJS | null>(null)

  // Stable serialized dep keys — effect only fires when data actually changes,
  // not on every parent render that passes a new array/object reference.
  const scoresKey = JSON.stringify(studentScores)
  const rangeKey  = JSON.stringify(gradeRange ?? null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Destroy any existing instance before creating a new one.
    // This prevents accumulated event listeners on the canvas element.
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    // ── Build chart data ───────────────────────────────────────
    const range  = effectiveRange(studentScores, gradeRange)
    const bands  = getPercentileBands(subject, range)
    const labels = bands.map((b) =>
      b.season === 'fall' ? (GRADE_LABEL[b.grade] ?? String(b.grade)) : '',
    )
    const p = (key: 'p5' | 'p25' | 'p50' | 'p75' | 'p95') => bands.map((b) => b[key])

    const studentData = bands.map((b) => {
      const match = studentScores.find((s) => s.grade === b.grade && s.season === b.season)
      return match?.ritScore ?? null
    })

    const lastIdx  = studentData.reduce<number>((last, v, i) => (v !== null ? i : last), -1)
    const ptColors = studentData.map((v, i) =>
      v === null ? 'transparent' : i === lastIdx ? GOLD : NAVY,
    )
    const ptRadii = studentData.map((v, i) =>
      v === null ? 0 : i === lastIdx ? 7 : 5,
    )

    // Extend the upper bound well past p95 so scores in the 95th+ band have
    // vertical room to separate. Also expand the lower padding. yMax must
    // cover any student RIT that lands above p95 as well.
    const studentMax = studentScores.reduce((m, s) => Math.max(m, s.ritScore), 0)
    const p95Max     = Math.max(...p('p95'))
    const topTarget  = Math.max(p95Max, studentMax) + 35
    const yMin = Math.max(100, Math.floor((Math.min(...p('p5'))  - 15) / 10) * 10)
    const yMax = Math.ceil( topTarget / 10) * 10

    const mkBand = (data: number[], fill: string, bg: string) => ({
      data, fill, backgroundColor: bg, borderColor: 'transparent',
      borderWidth: 0, pointRadius: 0, tension: 0.35,
    })

    // ── Create instance ────────────────────────────────────────
    // All closures (tooltip title, generateLabels) are created fresh here
    // and live only as long as this chart instance. When the cleanup below
    // calls chart.destroy(), Chart.js removes all canvas event listeners
    // and these closures are freed.
    chartRef.current = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          mkBand(p('p5'),  'start', BAND_BG[0]),
          mkBand(p('p25'), '-1',    BAND_BG[1]),
          mkBand(p('p50'), '-1',    BAND_BG[2]),
          mkBand(p('p75'), '-1',    BAND_BG[3]),
          mkBand(p('p95'), '-1',    BAND_BG[4]),
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
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        // Disable animation: requestAnimationFrame callbacks created during
        // animation hold references to the chart config until they fire.
        // With hover-triggered re-renders this can queue hundreds of frames.
        animation: false,
        plugins: {
          legend: {
            display:  true,
            position: 'bottom' as const,
            labels: {
              font:     { family: 'DM Mono', size: 8 },
              boxWidth: 12,
              color:    '#888',
              generateLabels: () => [
                { text: '95th %ile', fillStyle: BAND_BG[4], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '75th %ile', fillStyle: BAND_BG[3], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '50th %ile', fillStyle: BAND_BG[2], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '25th %ile', fillStyle: BAND_BG[1], strokeStyle: 'transparent', lineWidth: 0 },
                { text: '5th %ile',  fillStyle: BAND_BG[0], strokeStyle: 'transparent', lineWidth: 0 },
              ],
            },
          },
          tooltip: {
            filter:    (item) => item.datasetIndex === 5 && item.parsed.y !== null,
            callbacks: {
              // `bands` is captured here but lives only as long as this chart
              // instance — destroyed with it in the cleanup below.
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
            title: { display: true, text: 'Grade · Season', font: { family: 'DM Mono', size: 9 }, color: '#999' },
          },
          y: {
            min:   yMin,
            max:   yMax,
            grid:  { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { family: 'DM Mono', size: 9 }, stepSize: 20 },
            title: { display: true, text: 'RIT Score', font: { family: 'DM Mono', size: 9 }, color: '#999' },
          },
        },
      },
    })

    // Cleanup: runs before the next effect execution AND on unmount.
    // chart.destroy() removes all canvas event listeners (mousemove, click,
    // touchstart etc.) registered by Chart.js, releasing the chart and its
    // closure references.
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  // scoresKey/rangeKey are JSON-serialized proxies for studentScores/gradeRange.
  // subject is a primitive string. These three together capture all meaningful
  // input changes without triggering on new array/object references from parent renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, scoresKey, rangeKey])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
