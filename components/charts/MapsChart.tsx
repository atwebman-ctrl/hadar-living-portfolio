'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export interface MapsDataPoint {
  label: string
  englishRit: number | null
  mathRit: number | null
  englishPct: number | null
  mathPct: number | null
}

// Demo fallback — used when no data prop is provided (/demo route)
const DEMO_DATA: MapsDataPoint[] = [
  { label: "Feb '24\nGr.1", englishRit: 183, mathRit: 179, englishPct: 90, mathPct: 76 },
  { label: "May '24\nGr.1", englishRit: 193, mathRit: 194, englishPct: 94, mathPct: 91 },
  { label: "Aug '24\nGr.2", englishRit: 216, mathRit: 188, englishPct: 99, mathPct: 84 },
  { label: "Jan '25\nGr.2", englishRit: 212, mathRit: 199, englishPct: 98, mathPct: 87 },
  { label: "May '25\nGr.2", englishRit: 221, mathRit: 211, englishPct: 99, mathPct: 94 },
  { label: "Aug '25\nGr.3", englishRit: 216, mathRit: 214, englishPct: 96, mathPct: 97 },
  { label: "Jan '26\nGr.3", englishRit: 229, mathRit: 219, englishPct: 98, mathPct: 95 },
]

interface Props {
  data?: MapsDataPoint[]
}

export default function MapsChart({ data = DEMO_DATA }: Props) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'English',
        data: data.map((d) => d.englishRit),
        borderColor: '#1B3A6B',
        backgroundColor: 'rgba(27,58,107,.06)',
        pointBackgroundColor: '#1B3A6B',
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 5,
        fill: true,
      },
      {
        label: 'Math',
        data: data.map((d) => d.mathRit),
        borderColor: '#B8963E',
        backgroundColor: 'rgba(184,150,62,.04)',
        pointBackgroundColor: '#B8963E',
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 5,
        fill: true,
      },
    ],
  }

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const point = data[ctx.dataIndex]
                const pct = ctx.datasetIndex === 0 ? point.englishPct : point.mathPct
                return pct !== null ? `${pct}th percentile` : ''
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'DM Mono', size: 9 }, maxRotation: 0 },
          },
          y: {
            min: 170,
            max: 240,
            grid: { color: 'rgba(0,0,0,.04)' },
            ticks: { font: { family: 'DM Mono', size: 9 }, stepSize: 10 },
          },
        },
      }}
    />
  )
}
