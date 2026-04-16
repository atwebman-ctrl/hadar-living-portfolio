'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Student } from '@/lib/types'
import { formatGrade, sortGrades } from '@/lib/gradeLevel'
import type { WorkbenchMode } from './WorkbenchView'

interface Props {
  students:      Student[]
  onSwitchMode?: (mode: WorkbenchMode) => void
}

type StudentCompleteness = {
  mapMath: number; mapEnglish: number; avant: number; readings: number
  notes: number; writing: number; photos: number; awards: number
}

const THRESHOLDS: Record<string, number> = {
  mapMath: 1, mapEnglish: 1, avant: 1, readings: 3,
  notes: 3, writing: 1, photos: 2, awards: 0,
}

const COLS: { key: keyof StudentCompleteness; label: string }[] = [
  { key: 'mapMath',    label: 'MAP Math' },
  { key: 'mapEnglish', label: 'MAP ELA' },
  { key: 'avant',      label: 'AVANT' },
  { key: 'readings',   label: 'Canon' },
  { key: 'writing',    label: 'Composition' },
  { key: 'notes',      label: 'Notes' },
  { key: 'photos',     label: 'Photos' },
]

const S = {
  pill:    { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', minHeight: 36, cursor: 'pointer', border: '1px solid var(--rule)', background: 'none', color: 'var(--ink-light)', transition: 'all 0.15s' } as CSSProperties,
  pillOn:  { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', minHeight: 36, cursor: 'pointer', border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--cream)', transition: 'all 0.15s' } as CSSProperties,
  summary: { display: 'flex', gap: 20, marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--ink-light)' } as CSSProperties,
  th:      { position: 'sticky' as const, top: 0, zIndex: 2, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--ink-faint)', background: 'var(--cream)', padding: '8px 6px', textAlign: 'center' as const, borderBottom: '2px solid var(--gold)', whiteSpace: 'nowrap' as const } as CSSProperties,
  td:      { padding: '6px 8px', borderBottom: '1px solid var(--rule)', textAlign: 'center' as const, verticalAlign: 'middle' as const } as CSSProperties,
  name:    { padding: '6px 8px', borderBottom: '1px solid var(--rule)', fontWeight: 500, color: 'var(--navy)', fontSize: 13, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 } as CSSProperties,
  dot:     { display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' } as CSSProperties,
  link:    { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 } as CSSProperties,
}

const DOT_COLORS = { green: '#166534', amber: '#b45309', gray: '#9ca3af' }

export default function CompletenessMode({ students, onSwitchMode }: Props) {
  const [data, setData]           = useState<Record<string, StudentCompleteness>>({})
  const [loading, setLoading]     = useState(true)
  const [gradeFilter, setGradeFilter] = useState('All')

  useEffect(() => {
    fetch('/api/dashboard/completeness')
      .then(r => r.json())
      .then(json => { setData(json.students ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const grades = useMemo(() => {
    const set = new Set(students.map(s => s.gradeLevel).filter(Boolean))
    return sortGrades(Array.from(set))
  }, [students])

  const filtered = useMemo(() => {
    return students
      .filter(s => gradeFilter === 'All' || s.gradeLevel === gradeFilter)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
  }, [students, gradeFilter])

  function cellState(count: number, key: string): 'green' | 'amber' | 'gray' {
    if (count === 0) return 'gray'
    if (count >= (THRESHOLDS[key] ?? 1)) return 'green'
    return 'amber'
  }

  const completeCount = filtered.filter(s => {
    const c = data[s.id]
    if (!c) return false
    return COLS.every(col => THRESHOLDS[col.key] === 0 || c[col.key] >= (THRESHOLDS[col.key] ?? 1))
  }).length

  const gapCount = filtered.reduce((sum, s) => {
    const c = data[s.id]
    if (!c) return sum + COLS.filter(col => THRESHOLDS[col.key] > 0).length
    return sum + COLS.filter(col => cellState(c[col.key], col.key) === 'gray').length
  }, 0)

  if (loading) {
    return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', padding: '2rem 0' }}>Loading completeness data…</div>
  }

  return (
    <div>
      {/* Grade filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {['All', ...grades].map(g => (
          <button key={g} type="button" style={gradeFilter === g ? S.pillOn : S.pill}
            onClick={() => setGradeFilter(g)}>
            {g === 'All' ? 'All' : formatGrade(g)}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={S.summary}>
        <span><strong>{completeCount}</strong> of {filtered.length} students fully complete</span>
        <span><strong>{gapCount}</strong> gaps to fill</span>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--rule)', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...S.th, textAlign: 'left' }}>Student</th>
              {COLS.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const c = data[s.id] ?? { mapMath: 0, mapEnglish: 0, avant: 0, readings: 0, notes: 0, writing: 0, photos: 0, awards: 0 }
              return (
                <tr key={s.id}>
                  <td style={S.name}>
                    {s.firstName} {s.lastName}
                    <span style={{ fontWeight: 400, color: 'var(--ink-faint)', marginLeft: 6, fontSize: 10 }}>
                      {formatGrade(s.gradeLevel)}
                    </span>
                  </td>
                  {COLS.map(col => {
                    const count = c[col.key]
                    const state = cellState(count, col.key)
                    const dotColor = DOT_COLORS[state]
                    return (
                      <td key={col.key} style={S.td}>
                        <span style={{ ...S.dot, background: dotColor }} />
                        {state === 'gray' ? (
                          (col.key === 'mapMath' || col.key === 'mapEnglish') && onSwitchMode ? (
                            <button type="button" style={S.link} onClick={() => onSwitchMode('scores')}>Add</button>
                          ) : (
                            <a href={`/portfolio/${s.id}`} style={S.link}>Add</a>
                          )
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: state === 'green' ? '#166534' : '#b45309' }}>
                            {count}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
