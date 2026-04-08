'use client'

// ============================================================
// app/dashboard/StudentGrid.tsx
//
// Roster view: grade pills + search bar + filtered grid.
// Manages both filter dimensions in local state.
// ============================================================

import { useState, useMemo } from 'react'
import type { Student } from '@/lib/types'
import { formatGrade, sortGrades } from '@/lib/gradeLevel'
import { StudentCard, EmptyState } from './DashboardUI'

interface Props { students: Student[]; role: string }

export default function StudentGrid({ students, role }: Props) {
  const [query,       setQuery]       = useState('')
  const [gradeFilter, setGradeFilter] = useState('All')

  const grades = useMemo(() => {
    const set = new Set(students.map((s) => s.gradeLevel).filter(Boolean))
    return sortGrades(Array.from(set))
  }, [students])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      const matchesGrade = gradeFilter === 'All' || s.gradeLevel === gradeFilter
      const matchesName  = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
      return matchesGrade && matchesName
    })
  }, [students, query, gradeFilter])

  if (students.length === 0) return <EmptyState />

  return (
    <>
      {/* Registry heading */}
      <div className="db-official-badge">⊙ Official Record</div>
      <h2 className="db-registry-title">Registry of Advanced Scholars</h2>
      <div className="db-registry-rule" />
      <p className="db-registry-sub">
        Student records, academic progress, and portfolio archives for the current academic cycle.
      </p>

      {/* Grade filter pills */}
      <div className="db-pills">
        {['All', ...grades].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGradeFilter(g)}
            className={`db-pill${gradeFilter === g ? ' db-pill--active' : ''}`}
          >
            {g === 'All' ? 'All' : formatGrade(g)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="db-search-wrap">
        <input
          type="search"
          className="db-search"
          placeholder="Search scholars..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search students by name"
        />
      </div>

      {/* Grid or no-results */}
      {filtered.length === 0 ? (
        <p className="db-no-results">No scholars match the current filters.</p>
      ) : (
        <div className="student-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          {filtered.map((s) => <StudentCard key={s.id} student={s} role={role} />)}
        </div>
      )}
    </>
  )
}
