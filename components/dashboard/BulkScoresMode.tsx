'use client'

// ============================================================
// components/dashboard/BulkScoresMode.tsx
//
// Spreadsheet-style bulk score entry for the Teacher Workbench.
// Controls row (type / term / grade filter) → score grid →
// CSV paste support → save row.
// ============================================================

import { useMemo, useState, type CSSProperties } from 'react'
import type { Student, AssessmentType } from '@/lib/types'
import { TERM_OPTIONS } from '@/lib/constants'
import { formatGrade, sortGrades } from '@/lib/gradeLevel'
import BulkScorePaste from './BulkScorePaste'

interface Props { students: Student[] }

type ScoreRow = {
  studentId: string
  rit:       string
  pct:       string
  score:     string
}

const TYPES: { value: AssessmentType; label: string; isMap: boolean }[] = [
  { value: 'maps_math',       label: 'MAP Math',         isMap: true },
  { value: 'maps_english',    label: 'MAP Reading',      isMap: true },
  { value: 'avant_reading',   label: 'AVANT Reading',    isMap: false },
  { value: 'avant_listening', label: 'AVANT Listening',   isMap: false },
  { value: 'avant_writing',   label: 'AVANT Writing',    isMap: false },
  { value: 'avant_speaking',  label: 'AVANT Speaking',   isMap: false },
]

function termToAcademicYear(term: string): string {
  const parts = term.split(' ')
  const season = parts[0]
  const year = parseInt(parts[1], 10)
  if (isNaN(year)) return ''
  if (season === 'Fall') return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

// ── Styles ────────────────────────────────────────────────────

const S = {
  ctrl:    { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 } as CSSProperties,
  sel:     { border: '1px solid var(--rule)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--ink)', background: 'var(--white)', minHeight: 44, cursor: 'pointer' } as CSSProperties,
  pill:    { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', minHeight: 36, cursor: 'pointer', border: '1px solid var(--rule)', background: 'none', color: 'var(--ink-light)', transition: 'all 0.15s' } as CSSProperties,
  pillOn:  { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', minHeight: 36, cursor: 'pointer', border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--cream)', transition: 'all 0.15s' } as CSSProperties,
  yearLbl: { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-faint)', textTransform: 'uppercase' as const, alignSelf: 'center' } as CSSProperties,
  th:      { position: 'sticky' as const, top: 0, zIndex: 2, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--ink-faint)', background: 'var(--cream)', padding: '8px 10px', textAlign: 'left' as const, borderBottom: '2px solid var(--gold)', whiteSpace: 'nowrap' as const } as CSSProperties,
  td:      { padding: '6px 8px', borderBottom: '1px solid var(--rule)', verticalAlign: 'middle' as const } as CSSProperties,
  numInp:  { width: 72, border: '1px solid var(--rule)', borderRadius: 4, padding: '8px 10px', fontSize: 14, textAlign: 'center' as const, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--white)', boxSizing: 'border-box' as const } as CSSProperties,
  filled:  { width: 72, border: '1px solid var(--cream-dark, var(--rule))', borderRadius: 4, padding: '8px 10px', fontSize: 14, textAlign: 'center' as const, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--cream)', boxSizing: 'border-box' as const } as CSSProperties,
  footer:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: 8 } as CSSProperties,
  counter: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.06em' } as CSSProperties,
  saveBtn: { minHeight: 44, padding: '10px 24px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, background: 'var(--navy)', color: 'var(--cream)', border: 'none', borderRadius: 6, cursor: 'pointer' } as CSSProperties,
  toast:   { fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', marginTop: 8 } as CSSProperties,
}
const thC = { ...S.th, textAlign: 'center' as const }
const nameCell = { ...S.td, fontWeight: 500, color: 'var(--navy)', fontSize: 14, width: 200, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties
const prevCell = { ...S.td, fontStyle: 'italic', fontSize: 12, color: 'var(--ink-light)', textAlign: 'center' as const } as CSSProperties

// ── Component ─────────────────────────────────────────────────

export default function BulkScoresMode({ students }: Props) {
  const [assessType,   setAssessType]   = useState<AssessmentType>('maps_math')
  const [term,         setTerm]         = useState<string>(TERM_OPTIONS[TERM_OPTIONS.length - 1])
  const [gradeFilter,  setGradeFilter]  = useState('All')
  const [rows,         setRows]         = useState<Record<string, ScoreRow>>({})
  const [saving,       setSaving]       = useState(false)
  const [toast,        setToast]        = useState<{ type: 'ok' | 'warn' | 'err'; msg: string } | null>(null)
  const [showPaste,    setShowPaste]    = useState(false)

  const isMap = TYPES.find((t) => t.value === assessType)?.isMap ?? true
  const academicYear = termToAcademicYear(term)

  const grades = useMemo(() => {
    const set = new Set(students.map((s) => s.gradeLevel).filter(Boolean))
    return sortGrades(Array.from(set))
  }, [students])

  const filtered = useMemo(() => {
    return students
      .filter((s) => gradeFilter === 'All' || s.gradeLevel === gradeFilter)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
  }, [students, gradeFilter])

  function getRow(id: string): ScoreRow {
    return rows[id] ?? { studentId: id, rit: '', pct: '', score: '' }
  }

  function updateRow(id: string, field: 'rit' | 'pct' | 'score', value: string) {
    setRows((prev) => ({ ...prev, [id]: { ...getRow(id), [field]: value } }))
  }

  const filledCount = filtered.filter((s) => {
    const r = getRow(s.id)
    return isMap ? r.rit !== '' : r.score !== ''
  }).length

  function handlePasteResult(data: { name: string; studentId: string | null; col1: string; col2: string }[]) {
    setRows((prev) => {
      const next = { ...prev }
      for (const d of data) {
        if (!d.studentId) continue
        if (isMap) {
          next[d.studentId] = { studentId: d.studentId, rit: d.col1, pct: d.col2, score: '' }
        } else {
          next[d.studentId] = { studentId: d.studentId, rit: '', pct: '', score: d.col1 }
        }
      }
      return next
    })
    setShowPaste(false)
  }

  // TODO: After bulk save, offer PDF upload per row for MAP scores

  async function handleSave() {
    const entries = filtered
      .map((s) => {
        const r = getRow(s.id)
        if (isMap && !r.rit) return null
        if (!isMap && !r.score) return null
        return {
          studentId:      s.id,
          assessmentType: assessType,
          ritScore:       isMap && r.rit  ? parseFloat(r.rit) : null,
          percentile:     isMap && r.pct  ? parseFloat(r.pct) : null,
          score:          !isMap && r.score ? parseFloat(r.score) : null,
          term,
          academicYear,
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)

    if (entries.length === 0) return
    setSaving(true); setToast(null)
    try {
      const res = await fetch('/api/dashboard/assessments/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed.')
      const { inserted, errors: errs } = json as { inserted: number; errors: string[] }
      if (errs?.length) {
        setToast({ type: 'warn', msg: `${inserted} saved, ${errs.length} failed` })
      } else {
        setToast({ type: 'ok', msg: `${inserted} scores saved` })
        setRows({})
      }
    } catch (err) {
      setToast({ type: 'err', msg: err instanceof Error ? err.message : 'Save failed.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Controls */}
      <div style={S.ctrl}>
        <select style={S.sel} value={assessType} onChange={(e) => { setAssessType(e.target.value as AssessmentType); setRows({}) }}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select style={S.sel} value={term} onChange={(e) => setTerm(e.target.value)}>
          {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={S.yearLbl}>{academicYear || '—'}</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 8 }}>
          {['All', ...grades].map((g) => (
            <button key={g} type="button" style={gradeFilter === g ? S.pillOn : S.pill}
              onClick={() => setGradeFilter(g)}>
              {g === 'All' ? 'All' : formatGrade(g)}
            </button>
          ))}
        </div>
      </div>

      {/* CSV paste toggle */}
      <button type="button" onClick={() => setShowPaste((p) => !p)} style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        marginBottom: 8, textDecoration: 'underline', letterSpacing: '0.06em',
      }}>
        {showPaste ? '× Close paste' : 'Paste from spreadsheet'}
      </button>

      {showPaste && (
        <BulkScorePaste
          students={students}
          isMap={isMap}
          onApply={handlePasteResult}
          onCancel={() => setShowPaste(false)}
        />
      )}

      {/* Score grid */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--rule)', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Student</th>
              {isMap ? (
                <>
                  <th style={thC}>RIT</th>
                  <th style={thC}>Percentile</th>
                </>
              ) : (
                <th style={thC}>Score (0–10)</th>
              )}
              {/* TODO: Previous column — requires fetching latest assessment per student */}
              <th style={thC}>Previous</th>
              <th style={thC}>Delta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const r = getRow(s.id)
              return (
                <tr key={s.id}>
                  <td style={nameCell}>
                    {s.firstName} {s.lastName}
                    <span style={{ fontWeight: 400, color: 'var(--ink-faint)', marginLeft: 6, fontSize: 11 }}>
                      {formatGrade(s.gradeLevel)}
                    </span>
                  </td>
                  {isMap ? (
                    <>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <input type="number" style={r.rit ? S.filled : S.numInp}
                          value={r.rit} onChange={(e) => updateRow(s.id, 'rit', e.target.value)}
                          placeholder="—" />
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <input type="number" style={r.pct ? S.filled : S.numInp}
                          value={r.pct} min={0} max={100}
                          onChange={(e) => updateRow(s.id, 'pct', e.target.value)}
                          placeholder="—" />
                      </td>
                    </>
                  ) : (
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <input type="number" style={r.score ? S.filled : S.numInp}
                        value={r.score} min={0} max={10}
                        onChange={(e) => updateRow(s.id, 'score', e.target.value)}
                        placeholder="—" />
                    </td>
                  )}
                  <td style={prevCell}>—</td>
                  <td style={{ ...S.td, textAlign: 'center', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                    —
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span style={S.counter}>{filledCount} of {filtered.length} students entered</span>
        <button type="button" style={{ ...S.saveBtn, opacity: filledCount === 0 || saving ? 0.45 : 1 }}
          disabled={filledCount === 0 || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save all scores'}
        </button>
      </div>

      {toast && (
        <div style={{
          ...S.toast,
          color: toast.type === 'ok' ? 'var(--teal, #166534)' : toast.type === 'warn' ? '#92400e' : '#991b1b',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
