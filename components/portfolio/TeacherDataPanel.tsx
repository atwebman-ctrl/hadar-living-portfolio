'use client'

// ============================================================
// components/portfolio/TeacherDataPanel.tsx
//
// Tabbed data-entry panel visible only to admin/teacher roles.
// Tabs: Assessment Scores | Reading List
// Sub-forms are split into AssessmentForm and ReadingForm.
// ============================================================

import { useState } from 'react'
import AssessmentForm from './AssessmentForm'
import ReadingForm from './ReadingForm'
import BookCatalogManager from './BookCatalogManager'

type Tab = 'assessment' | 'reading' | 'catalog'

interface StatusMessage {
  type: 'success' | 'error'
  msg: string
}

export default function TeacherDataPanel({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<Tab>('assessment')
  const [status, setStatus] = useState<StatusMessage | null>(null)

  function switchTab(next: Tab) {
    setTab(next)
    setStatus(null)
  }

  return (
    <section
      style={{
        margin: '1.5rem 2rem',
        border: '1px solid var(--gold)',
        background: 'var(--parchment)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--navy)',
          padding: '0.6rem 1.25rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}
        >
          Teacher Data Entry
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)' }}>
        {(['assessment', 'reading', 'catalog'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === t ? 'var(--navy)' : 'var(--ink-light)',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {t === 'assessment' ? 'Assessment Scores' : t === 'reading' ? 'Reading List' : 'Book Catalog'}
          </button>
        ))}
      </div>

      {/* Status banner */}
      {status && (
        <div
          style={{
            padding: '0.5rem 1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          {status.msg}
        </div>
      )}

      {/* Active form */}
      <div style={{ padding: '1.25rem' }}>
        {tab === 'assessment' && <AssessmentForm studentId={studentId} onStatus={setStatus} />}
        {tab === 'reading'    && <ReadingForm studentId={studentId} onStatus={setStatus} />}
        {tab === 'catalog'    && <BookCatalogManager />}
      </div>
    </section>
  )
}
