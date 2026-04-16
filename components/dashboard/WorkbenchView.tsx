'use client'

// ============================================================
// components/dashboard/WorkbenchView.tsx
//
// Teacher Workbench shell — mode bar + active mode content.
// Renders when DashboardView === 'workbench'.
//
// Modes: Quick notes (Phase 1), Bulk scores / Photos /
// Completeness (placeholder for future phases).
// ============================================================

import { useState, type CSSProperties } from 'react'
import type { Student } from '@/lib/types'
import QuickNotesMode from './QuickNotesMode'

interface Props {
  students: Student[]
  role:     string
}

type WorkbenchMode = 'notes' | 'scores' | 'photos' | 'completeness'

const MODES: { key: WorkbenchMode; label: string }[] = [
  { key: 'notes',        label: 'Quick notes' },
  { key: 'scores',       label: 'Bulk scores' },
  { key: 'photos',       label: 'Photos' },
  { key: 'completeness', label: 'Completeness' },
]

const BAR: CSSProperties = {
  display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)',
  marginBottom: '1.5rem',
}

const TAB: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', background: 'none', border: 'none',
  borderBottom: '2px solid transparent', padding: '12px 20px', minHeight: 44,
  cursor: 'pointer', color: 'var(--ink-light)', transition: 'color 0.15s, border-color 0.15s',
}

const TAB_ACTIVE: CSSProperties = {
  ...TAB, color: 'var(--navy)', borderBottomColor: 'var(--gold)',
}

const PLACEHOLDER: CSSProperties = {
  fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.95rem',
  color: 'var(--ink-faint)', padding: '3rem 0',
}

export default function WorkbenchView({ students, role }: Props) {
  const [mode, setMode] = useState<WorkbenchMode>('notes')

  return (
    <div>
      <div style={BAR}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            style={mode === m.key ? TAB_ACTIVE : TAB}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'notes' && <QuickNotesMode students={students} />}
      {mode === 'scores'       && <div style={PLACEHOLDER}>Bulk score entry — coming soon</div>}
      {mode === 'photos'       && <div style={PLACEHOLDER}>Batch photo upload — coming soon</div>}
      {mode === 'completeness' && <div style={PLACEHOLDER}>Completeness dashboard — coming soon</div>}
    </div>
  )
}
