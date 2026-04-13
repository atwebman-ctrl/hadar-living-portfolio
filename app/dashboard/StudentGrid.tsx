'use client'

// ============================================================
// app/dashboard/StudentGrid.tsx
//
// Roster view: compact toolbar (grade pills + search + view
// toggle) above the filtered grid. Owns query, grade filter,
// and view-mode local state.
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import type { Student } from '@/lib/types'
import { formatGrade, sortGrades } from '@/lib/gradeLevel'
import { StudentCard, EmptyState } from './DashboardUI'
import StudentList from './StudentList'

interface Props { students: Student[]; role: string }

type ViewMode = 'grid' | 'list'

const VIEW_STORAGE_KEY = 'dashboard.viewMode'

export default function StudentGrid({ students, role }: Props) {
  const [query,       setQuery]       = useState('')
  const [gradeFilter, setGradeFilter] = useState('All')
  const [viewMode,    setViewMode]    = useState<ViewMode>('list')

  // Rehydrate view mode from localStorage after mount (SSR-safe default: list)
  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === 'grid' || stored === 'list') setViewMode(stored)
  }, [])

  const updateViewMode = (m: ViewMode) => {
    setViewMode(m)
    window.localStorage.setItem(VIEW_STORAGE_KEY, m)
  }

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
      <div className="db-toolbar">
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

        <div className="db-toolbar-search">
          <svg
            className="db-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="db-search"
            placeholder="Search scholars..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search students by name"
          />
        </div>

        <div className="db-view-toggle" role="group" aria-label="View mode">
          <ViewToggleButton
            label="Grid view"
            active={viewMode === 'grid'}
            onClick={() => updateViewMode('grid')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3"  y="3"  width="7" height="7" />
              <rect x="14" y="3"  width="7" height="7" />
              <rect x="3"  y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </ViewToggleButton>
          <ViewToggleButton
            label="List view"
            active={viewMode === 'list'}
            onClick={() => updateViewMode('list')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6"  x2="21" y2="6"  />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6"  x2="3.01" y2="6"  />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </ViewToggleButton>
        </div>
      </div>

      <hr className="db-toolbar-rule" />

      {filtered.length === 0 ? (
        <div className="db-empty-filter">
          <p className="db-empty-filter-title">No scholars found</p>
          <p className="db-empty-filter-hint">Try a different filter or add a new student</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="student-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          {filtered.map((s) => <StudentCard key={s.id} student={s} role={role} />)}
        </div>
      ) : (
        <StudentList students={filtered} />
      )}
    </>
  )
}

function ViewToggleButton({
  label,
  active,
  onClick,
  children,
}: {
  label:    string
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="db-view-btn"
      data-active={active ? 'true' : 'false'}
    >
      {children}
    </button>
  )
}
