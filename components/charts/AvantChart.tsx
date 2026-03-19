'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const data = {
  labels: ["Nov '24\n2nd Gr.", "May '25\n2nd Gr.", "Aug '25\n3rd Gr.", "Jan '26\n3rd Gr."],
  datasets: [
    { label: 'Speaking',  data: [2,3,2,3] as (number|null)[], backgroundColor: '#1B3A6B', borderRadius: 3, borderSkipped: false as const },
    { label: 'Reading',   data: [3,5,4,6] as (number|null)[], backgroundColor: '#B8963E', borderRadius: 3, borderSkipped: false as const },
    { label: 'Listening', data: [4,6,7,7] as (number|null)[], backgroundColor: '#2E7D5E', borderRadius: 3, borderSkipped: false as const },
    { label: 'Writing',   data: [null,null,2,3] as (number|null)[], backgroundColor: '#7C3AED', borderRadius: 3, borderSkipped: false as const },
  ],
}

export default function AvantChart() {
  return (
    <Bar
      data={data}
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
            min: 0, max: 9,
            grid: { color: 'rgba(0,0,0,.04)' },
            ticks: {
              font: { family: 'DM Mono', size: 9 },
              stepSize: 3,
              callback: (v) =>
                v===0 ? 'Novice' : v===3 ? 'Intermed.' : v===6 ? 'Advanced' : v===9 ? 'Mastery' : '',
            },
          },
        },
      }}
    />
  )
}
