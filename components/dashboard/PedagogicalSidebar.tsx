'use client'

// ============================================================
// components/dashboard/PedagogicalSidebar.tsx
//
// Left-rail filter for the dashboard roster. Two sections:
//   1. Pedagogical schools (Lower / Grammar / Logic etc.)
//   2. Grades present in the roster (narrowed to the active
//      pedagogical school when one is selected)
//
// The pedagogical-schools section is hidden for tenants with
// zero or one school — a single school doesn't earn its own
// filter row. Grades always render.
// ============================================================

import type { CSSProperties } from 'react'
import type { PedagogicalSchool } from '@/lib/types'
import { formatGrade, sortGrades } from '@/lib/gradeLevel'

interface Props {
  pedagogicalSchools: PedagogicalSchool[]
  allGrades:          string[]
  activeSchoolId:     string | null
  activeGrade:        string | null
  studentCounts: {
    byGrade:  Record<string, number>
    bySchool: Record<string, number>
  }
  onSelectSchool: (schoolId: string | null) => void
  onSelectGrade:  (grade: string | null) => void
}

export default function PedagogicalSidebar({
  pedagogicalSchools,
  allGrades,
  activeSchoolId,
  activeGrade,
  studentCounts,
  onSelectSchool,
  onSelectGrade,
}: Props) {
  const showSchools = pedagogicalSchools.length > 1
  const sortedSchools = [...pedagogicalSchools].sort((a, b) => a.order - b.order)

  // Narrow grades to the active pedagogical school, if one is selected.
  const activeSchool = activeSchoolId
    ? pedagogicalSchools.find((s) => s.id === activeSchoolId) ?? null
    : null

  const visibleGrades = sortGrades(
    activeSchool
      ? allGrades.filter((g) => activeSchool.grades.includes(g))
      : allGrades
  )

  const totalCount = studentCounts.bySchool.all ?? 0

  return (
    <aside style={SIDEBAR_STYLE}>
      <p style={EYEBROW_STYLE}>Scholars</p>

      {showSchools && (
        <>
          <SectionHeader>Pedagogical Schools</SectionHeader>
          <ul style={LIST_STYLE}>
            <FilterRow
              label="All"
              count={totalCount}
              active={activeSchoolId === null}
              onClick={() => onSelectSchool(null)}
            />
            {sortedSchools.map((s) => (
              <FilterRow
                key={s.id}
                label={s.label}
                count={studentCounts.bySchool[s.id] ?? 0}
                active={activeSchoolId === s.id}
                onClick={() => onSelectSchool(s.id)}
              />
            ))}
          </ul>
          <div style={{ height: '1.25rem' }} />
        </>
      )}

      <SectionHeader>Grades</SectionHeader>
      <ul style={LIST_STYLE}>
        <FilterRow
          label="All grades"
          count={
            activeSchool
              ? (studentCounts.bySchool[activeSchool.id] ?? 0)
              : totalCount
          }
          active={activeGrade === null}
          onClick={() => onSelectGrade(null)}
        />
        {visibleGrades.map((g) => (
          <FilterRow
            key={g}
            label={formatGrade(g)}
            count={studentCounts.byGrade[g] ?? 0}
            active={activeGrade === g}
            onClick={() => onSelectGrade(g)}
          />
        ))}
      </ul>
    </aside>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p style={SECTION_HEADER_STYLE}>{children}</p>
}

function FilterRow({
  label,
  count,
  active,
  onClick,
}: {
  label:   string
  count:   number
  active:  boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        style={{
          ...ROW_STYLE,
          ...(active ? ACTIVE_ROW_STYLE : null),
        }}
      >
        <span style={ROW_LABEL_STYLE}>{label}</span>
        <span style={ROW_COUNT_STYLE}>{count}</span>
      </button>
    </li>
  )
}

// ── Styles ───────────────────────────────────────────────────

const SIDEBAR_STYLE: CSSProperties = {
  width: 240,
  flexShrink: 0,
  padding: '1.5rem 1rem 2rem',
  borderRight: '1px solid var(--rule)',
  position: 'sticky',
  top: 0,
  alignSelf: 'flex-start',
  maxHeight: '100vh',
  overflowY: 'auto',
  background: 'transparent',
}

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  margin: '0 0 1.25rem',
  paddingLeft: '0.5rem',
}

const SECTION_HEADER_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  margin: '0 0 0.5rem',
  paddingLeft: '0.5rem',
}

const LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '0.45rem 0.5rem 0.45rem 0.75rem',
  background: 'transparent',
  border: 'none',
  borderLeft: '3px solid transparent',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: '0.88rem',
  color: 'var(--ink)',
  transition: 'background 0.12s ease, border-color 0.12s ease, color 0.12s ease',
}

const ACTIVE_ROW_STYLE: CSSProperties = {
  borderLeftColor: 'var(--gold)',
  background: 'rgba(196,154,42,0.08)',
  color: 'var(--navy)',
  fontWeight: 600,
}

const ROW_LABEL_STYLE: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const ROW_COUNT_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  color: 'var(--ink-faint)',
  marginLeft: '0.5rem',
}
