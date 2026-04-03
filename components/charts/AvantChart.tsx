'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export interface AvantDataPoint {
  label: string
  speaking: number | null
  reading: number | null
  listening: number | null
  writing: number | null
}

// Demo fallback — used when no data prop is provided (/demo route)
const DEMO_DATA: AvantDataPoint[] = [
  { label: "Nov '24\n2nd Gr.", speaking: 2, reading: 3, listening: 4, writing: null },
  { label: "May '25\n2nd Gr.", speaking: 3, reading: 5, listening: 6, writing: null },
  { label: "Aug '25\n3rd Gr.", speaking: 2, reading: 4, listening: 7, writing: 2 },
  { label: "Jan '26\n3rd Gr.", speaking: 3, reading: 6, listening: 7, writing: 3 },
]

interface Props {
  data?: AvantDataPoint[]
}

export default function AvantChart({ data = DEMO_DATA }: Props) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      { label: 'Speaking',  data: data.map((d) => d.speaking),  backgroundColor: '#1B3A6B', borderRadius: 3, borderSkipped: false as const },
      { label: 'Reading',   data: data.map((d) => d.reading),   backgroundColor: '#B8963E', borderRadius: 3, borderSkipped: false as const },
      { label: 'Listening', data: data.map((d) => d.listening), backgroundColor: '#2E7D5E', borderRadius: 3, borderSkipped: false as const },
      { label: 'Writing',   data: data.map((d) => d.writing),   backgroundColor: '#7C3AED', borderRadius: 3, borderSkipped: false as const },
    ],
  }

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'DM Mono', size: 9 }, maxRotation: 0 },
          },
          y: {
            min: 0,
            max: 9,
            grid: { color: 'rgba(0,0,0,.04)' },
            ticks: {
              font: { family: 'DM Mono', size: 9 },
              stepSize: 3,
              callback: (v) =>
                v === 0 ? 'Novice' : v === 3 ? 'Intermed.' : v === 6 ? 'Advanced' : v === 9 ? 'Mastery' : '',
            },
          },
        },
      }}
    />
  )
}
