'use client'

// ============================================================
// components/dashboard/BulkScorePaste.tsx
//
// Paste-from-spreadsheet support for BulkScoresMode.
// Parses tab-separated rows from NWEA / Excel / Google Sheets,
// fuzzy-matches student names against the roster, and feeds
// the matched data back to the parent grid.
// ============================================================

import { useState, type CSSProperties } from 'react'
import type { Student } from '@/lib/types'

interface Props {
  students: Student[]
  isMap:    boolean
  onApply:  (data: ParsedRow[]) => void
  onCancel: () => void
}

export interface ParsedRow {
  name:      string
  studentId: string | null
  col1:      string // RIT for MAP, Score for AVANT
  col2:      string // Percentile for MAP, empty for AVANT
}

function fuzzyMatch(input: string, students: Student[]): Student | null {
  const q = input.trim().toLowerCase()
  if (!q) return null
  // Exact match on full name
  const exact = students.find((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase() === q
  )
  if (exact) return exact
  // First name match (common in NWEA exports)
  const byFirst = students.filter((s) => s.firstName.toLowerCase() === q)
  if (byFirst.length === 1) return byFirst[0]
  // Last name match
  const byLast = students.filter((s) => s.lastName.toLowerCase() === q)
  if (byLast.length === 1) return byLast[0]
  // Contains
  const contains = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
  )
  if (contains.length === 1) return contains[0]
  return null
}

function parseClipboard(text: string, students: Student[], isMap: boolean): ParsedRow[] {
  return text.trim().split('\n').map((line) => {
    const cols = line.split('\t').map((c) => c.trim())
    const name = cols[0] ?? ''
    const match = fuzzyMatch(name, students)
    return {
      name,
      studentId: match?.id ?? null,
      col1: cols[1] ?? '',
      col2: isMap ? (cols[2] ?? '') : '',
    }
  }).filter((r) => r.name)
}

// ── Styles ────────────────────────────────────────────────────

const WRAP: CSSProperties = {
  border: '1px solid var(--rule)', borderRadius: 6, padding: 16,
  background: 'var(--white)', marginBottom: 16,
}

const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 100, border: '1px solid var(--rule)', borderRadius: 6,
  padding: 10, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink)',
  background: 'var(--cream)', resize: 'vertical', boxSizing: 'border-box',
}

const BTN: CSSProperties = {
  minHeight: 44, padding: '10px 18px', fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
  border: 'none', borderRadius: 6, cursor: 'pointer',
}

const ROW: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
  fontSize: 13, borderBottom: '1px solid var(--rule)',
}

const MATCH: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px',
  borderRadius: 3, whiteSpace: 'nowrap',
}

// ── Component ─────────────────────────────────────────────────

export default function BulkScorePaste({ students, isMap, onApply, onCancel }: Props) {
  const [raw,     setRaw]     = useState('')
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)

  function handleParse() {
    if (!raw.trim()) return
    setPreview(parseClipboard(raw, students, isMap))
  }

  const matchCount = preview?.filter((r) => r.studentId).length ?? 0
  const missCount  = preview ? preview.length - matchCount : 0

  return (
    <div style={WRAP}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.06em', margin: '0 0 8px' }}>
        Paste tab-separated rows from Excel or Google Sheets.
        {isMap ? ' Columns: Name, RIT, Percentile' : ' Columns: Name, Score'}
      </p>

      {!preview ? (
        <>
          <textarea style={TEXTAREA} value={raw} onChange={(e) => setRaw(e.target.value)}
            placeholder={isMap ? 'Name\tRIT\tPercentile' : 'Name\tScore'} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" style={{ ...BTN, background: 'var(--navy)', color: 'var(--cream)' }}
              onClick={handleParse} disabled={!raw.trim()}>
              Parse
            </button>
            <button type="button" style={{ ...BTN, background: 'none', color: 'var(--ink-light)', textDecoration: 'underline' }}
              onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)' }}>
              {matchCount} matched{missCount > 0 ? `, ${missCount} unmatched` : ''}
            </span>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {preview.map((r, i) => (
              <div key={i} style={ROW}>
                <span style={{ width: 160, color: r.studentId ? 'var(--ink)' : '#b45309', fontWeight: 500 }}>
                  {r.name}
                </span>
                <span style={{
                  ...MATCH,
                  background: r.studentId ? 'rgba(22,101,52,0.08)' : 'rgba(180,83,9,0.1)',
                  color: r.studentId ? '#166534' : '#b45309',
                }}>
                  {r.studentId ? '✓ matched' : 'no match'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-light)' }}>
                  {r.col1}{isMap && r.col2 ? ` / ${r.col2}` : ''}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" style={{ ...BTN, background: 'var(--navy)', color: 'var(--cream)', opacity: matchCount === 0 ? 0.45 : 1 }}
              disabled={matchCount === 0}
              onClick={() => onApply(preview)}>
              Apply {matchCount} rows
            </button>
            <button type="button" style={{ ...BTN, background: 'none', color: 'var(--ink-light)', textDecoration: 'underline' }}
              onClick={() => setPreview(null)}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  )
}
