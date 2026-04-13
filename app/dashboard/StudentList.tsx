'use client'

// ============================================================
// app/dashboard/StudentList.tsx
//
// Compact sortable table view for the dashboard roster.
// Shown when the view-mode toggle in StudentGrid is set to
// 'list'. Columns: photo, name, grade, year, gender, latest
// MAP Math / MAP English percentile, Hebrew composite, actions.
//
// NOTE: Assessment data (MAP math, MAP English, Hebrew composite)
// is not loaded on the dashboard today — /api/dashboard/students
// returns students rows only. Those columns render "—" placeholders
// until a future sprint bulk-fetches latest assessments per student.
// ============================================================

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Student } from '@/lib/types'
import { GRADE_LEVELS, formatGrade } from '@/lib/gradeLevel'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${path}`
}

type SortKey = 'name' | 'grade' | 'year' | 'gender' | 'mapMath' | 'mapEnglish' | 'hebrew'
type SortDir = 'asc' | 'desc'

interface Props { students: Student[] }

export default function StudentList({ students }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...students]
    arr.sort((a, b) => {
      const cmp = compare(a, b, sortKey)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [students, sortKey, sortDir])

  return (
    <div className="db-list-wrap">
      <table className="db-list">
        <thead>
          <tr>
            <th className="db-list-col-photo" aria-label="Photo" />
            <SortableTh label="Name"        col="name"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Grade"       col="grade"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Year"        col="year"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Gender"      col="gender"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="MAP Math"    col="mapMath"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="MAP English" col="mapEnglish" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Hebrew"      col="hebrew"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="db-list-col-action" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const photoUrl = buildPhotoUrl(s.profilePhotoPath ?? null)
            const genderLabel =
              s.gender === 'boy'  ? 'Boy'  :
              s.gender === 'girl' ? 'Girl' : '—'
            return (
              <tr key={s.id}>
                <td className="db-list-col-photo">
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(184,160,80,0.35)',
                    background: 'rgba(139,115,85,0.12)',
                    borderStyle: photoUrl ? 'solid' : 'dashed',
                  }}>
                    {photoUrl && (
                      <img
                        src={photoUrl}
                        alt={`${s.firstName} ${s.lastName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}
                  </div>
                </td>
                <td>
                  <Link href={`/portfolio/${s.id}`} className="db-list-name">
                    {s.firstName} {s.lastName}
                  </Link>
                </td>
                <td>{formatGrade(s.gradeLevel)}</td>
                <td>{s.academicYear}</td>
                <td>{genderLabel}</td>
                <td className="db-list-num">—</td>
                <td className="db-list-num">—</td>
                <td className="db-list-num">—</td>
                <td className="db-list-col-action">
                  <Link href={`/portfolio/${s.id}`} className="db-list-view">View</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label:   string
  col:     SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort:  (c: SortKey) => void
}) {
  const active = col === sortKey
  return (
    <th>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="db-list-th"
        data-active={active ? 'true' : 'false'}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{label}</span>
        <span className="db-list-sort" aria-hidden="true">
          {active ? (sortDir === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    </th>
  )
}

function gradeWeight(g: string): number {
  const idx = (GRADE_LEVELS as readonly string[]).indexOf(g)
  return idx < 0 ? 999 : idx
}

function compare(a: Student, b: Student, key: SortKey): number {
  switch (key) {
    case 'name':
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    case 'grade':
      return gradeWeight(a.gradeLevel) - gradeWeight(b.gradeLevel)
    case 'year':
      return a.academicYear.localeCompare(b.academicYear)
    case 'gender':
      return (a.gender ?? 'zz').localeCompare(b.gender ?? 'zz')
    case 'mapMath':
    case 'mapEnglish':
    case 'hebrew':
      return 0
  }
}
