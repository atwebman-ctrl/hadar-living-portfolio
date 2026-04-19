'use client'

// ============================================================
// app/dashboard/StudentGrid.tsx
//
// Roster view with a left-rail filter sidebar.
//
// Sidebar (PedagogicalSidebar): pedagogical-school + grade
// filters. The old horizontal "All / Grade 3 / Grade 4" pills
// have been retired — the same filter lives vertically in the
// sidebar now.
//
// Main content: search + view-mode toggle on top of the
// filtered grid/list.
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import type { Student, PedagogicalSchool } from '@/lib/types'
import type { StudentProfileStatus } from '@/lib/profileStatus'
import { sortGrades } from '@/lib/gradeLevel'
import { StudentCard, EmptyState } from './DashboardUI'
import StudentList from './StudentList'
import NoteSlideOver from '@/components/dashboard/NoteSlideOver'
import PedagogicalSidebar from '@/components/dashboard/PedagogicalSidebar'

interface Props {
  students:           Student[]
  role:               string
  pedagogicalSchools: PedagogicalSchool[]
  profileStatuses:    Record<string, StudentProfileStatus>
}

type ViewMode = 'grid' | 'list'

const VIEW_STORAGE_KEY = 'dashboard.viewMode'

export default function StudentGrid({
  students,
  role,
  pedagogicalSchools,
  profileStatuses,
}: Props) {
  const [query,        setQuery]        = useState('')
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null)
  const [gradeFilter,  setGradeFilter]  = useState<string | null>(null)
  const [viewMode,     setViewMode]     = useState<ViewMode>('list')
  const [slideOverStudent, setSlideOverStudent] = useState<{ id: string; name: string } | null>(null)

  const canEdit = role === 'admin' || role === 'teacher'
  const openQuickNote = canEdit
    ? (s: Student) => setSlideOverStudent({ id: s.id, name: `${s.firstName} ${s.lastName}` })
    : undefined

  // Rehydrate view mode from localStorage after mount (SSR-safe default: list)
  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === 'grid' || stored === 'list') setViewMode(stored)
  }, [])

  const updateViewMode = (m: ViewMode) => {
    setViewMode(m)
    window.localStorage.setItem(VIEW_STORAGE_KEY, m)
  }

  const allGrades = useMemo(() => {
    const set = new Set(students.map((s) => s.gradeLevel).filter(Boolean))
    return sortGrades(Array.from(set))
  }, [students])

  // Given a pedagogical-school id, does the student belong to it?
  const inSchool = (student: Student, schoolId: string | null) => {
    if (schoolId === null) return true
    const school = pedagogicalSchools.find((s) => s.id === schoolId)
    return !!school && school.grades.includes(student.gradeLevel)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (!inSchool(s, schoolFilter)) return false
      if (gradeFilter !== null && s.gradeLevel !== gradeFilter) return false
      if (q && !`${s.firstName} ${s.lastName}`.toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, query, schoolFilter, gradeFilter, pedagogicalSchools])

  // Counts for the sidebar — unaffected by the search query so
  // switching filters doesn't visually "empty" the rail.
  const studentCounts = useMemo(() => {
    const byGrade:  Record<string, number> = {}
    const bySchool: Record<string, number> = { all: students.length }
    for (const s of students) {
      byGrade[s.gradeLevel] = (byGrade[s.gradeLevel] ?? 0) + 1
      for (const ps of pedagogicalSchools) {
        if (ps.grades.includes(s.gradeLevel)) {
          bySchool[ps.id] = (bySchool[ps.id] ?? 0) + 1
        }
      }
    }
    return { byGrade, bySchool }
  }, [students, pedagogicalSchools])

  // Selecting a school clears an incompatible grade filter.
  const handleSelectSchool = (schoolId: string | null) => {
    setSchoolFilter(schoolId)
    if (schoolId && gradeFilter) {
      const school = pedagogicalSchools.find((s) => s.id === schoolId)
      if (school && !school.grades.includes(gradeFilter)) setGradeFilter(null)
    }
  }

  if (students.length === 0) return <EmptyState />

  return (
    <div className="db-body">
      <div className="db-sidebar-slot">
        <PedagogicalSidebar
          pedagogicalSchools={pedagogicalSchools}
          allGrades={allGrades}
          activeSchoolId={schoolFilter}
          activeGrade={gradeFilter}
          studentCounts={studentCounts}
          onSelectSchool={handleSelectSchool}
          onSelectGrade={setGradeFilter}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: '0 0 0 2rem' }}>
        <div className="db-toolbar">
          <div className="db-toolbar-search" style={{ flex: '1 1 auto' }}>
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
            {filtered.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                role={role}
                onQuickNote={openQuickNote}
                profileStatus={profileStatuses[s.id]}
              />
            ))}
          </div>
        ) : (
          <StudentList students={filtered} profileStatuses={profileStatuses} />
        )}
      </div>

      <NoteSlideOver
        studentId={slideOverStudent?.id ?? ''}
        studentName={slideOverStudent?.name ?? ''}
        isOpen={slideOverStudent !== null}
        onClose={() => setSlideOverStudent(null)}
      />
    </div>
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
