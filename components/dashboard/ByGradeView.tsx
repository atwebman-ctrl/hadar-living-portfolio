'use client'

// ============================================================
// components/dashboard/ByGradeView.tsx
//
// Groups students into collapsible sections by grade level.
// ============================================================

import { useState } from 'react'
import type { Student } from '@/lib/types'
import { StudentCard } from '@/app/dashboard/DashboardUI'

const INK   = '#2c1f0e'
const GOLD  = '#B8A050'
const SEPIA = '#5a4a3a'
const FAINT = '#8a7558'

interface Props { students: Student[]; role: string }

function groupByGrade(students: Student[]): Record<string, Student[]> {
  return students.reduce<Record<string, Student[]>>((acc, s) => {
    ;(acc[s.gradeLevel] ??= []).push(s)
    return acc
  }, {})
}

export default function ByGradeView({ students, role }: Props) {
  const grouped = groupByGrade(students)
  const grades  = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
  const [open, setOpen] = useState<Set<string>>(() => new Set(grades))

  const toggle = (grade: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(grade) ? next.delete(grade) : next.add(grade)
      return next
    })

  if (students.length === 0) {
    return (
      <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1rem', color: FAINT, padding: '2rem 0' }}>
        No students enrolled yet.
      </p>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b5228', background: 'rgba(184,160,80,0.12)', border: '1px solid rgba(184,160,80,0.45)', padding: '0.2rem 0.65rem', display: 'inline-flex', marginBottom: '0.6rem' }}>
          ⊙ Official Record
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '2rem', color: INK, margin: '0 0 0.4rem', lineHeight: 1.15 }}>
          Scholars by Grade
        </h2>
        <div style={{ height: 1, background: 'rgba(184,160,80,0.45)', marginBottom: '0.65rem', maxWidth: 520 }} />
        <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '0.95rem', color: SEPIA, margin: '0 0 1.5rem', maxWidth: 500, lineHeight: 1.55 }}>
          {students.length} scholar{students.length !== 1 ? 's' : ''} across {grades.length} grade{grades.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {grades.map((grade) => {
        const list     = grouped[grade]
        const isOpen   = open.has(grade)
        return (
          <div key={grade} style={{ marginBottom: '2rem' }}>
            <div
              role="button"
              onClick={() => toggle(grade)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', borderLeft: `3px solid ${GOLD}`, paddingLeft: '0.75rem', marginBottom: isOpen ? '1rem' : 0 }}
            >
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: '1.2rem', color: INK }}>
                {grade}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', color: FAINT }}>
                — {list.length} scholar{list.length !== 1 ? 's' : ''}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: GOLD }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {isOpen && (
              <div className="student-grid" style={{ display: 'grid', gap: '1.25rem' }}>
                {list.map((s) => <StudentCard key={s.id} student={s} role={role} />)}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
