'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const pcts = [[90,76],[94,91],[99,84],[98,87],[99,94],[96,97],[98,95]]

const data = {
  labels: ["Feb '24\nGr.1","May '24\nGr.1","Aug '24\nGr.2","Jan '25\nGr.2","May '25\nGr.2","Aug '25\nGr.3","Jan '26\nGr.3"],
  datasets: [
    {
      label: 'English', data: [183,193,216,212,221,216,229],
      borderColor: '#1B3A6B', backgroundColor: 'rgba(27,58,107,.06)',
      pointBackgroundColor: '#1B3A6B', tension: 0.35, borderWidth: 2.5, pointRadius: 5, fill: true,
    },
    {
      label: 'Math', data: [179,194,188,199,211,214,219],
      borderColor: '#B8963E', backgroundColor: 'rgba(184,150,62,.04)',
      pointBackgroundColor: '#B8963E', tension: 0.35, borderWidth: 2.5, pointRadius: 5, fill: true,
    },
  ],
}

export default function MapsChart() {
  return (
    <Line
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => `${pcts[ctx.dataIndex][ctx.datasetIndex]}th percentile`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'DM Mono', size: 9 }, maxRotation: 0 },
          },
          y: {
            min: 170, max: 240,
            grid: { color: 'rgba(0,0,0,.04)' },
            ticks: { font: { family: 'DM Mono', size: 9 }, stepSize: 10 },
          },
        },
      }}
    />
  )
}
