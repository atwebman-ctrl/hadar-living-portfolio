'use client'

// ============================================================
// app/dashboard/_stream-test/page.tsx
//
// THROWAWAY DEV ROUTE — renders the Phase 1 StreamComposer in
// isolation against a hardcoded fake roster. Delete this file
// when StreamComposer is wired into WorkbenchView in Phase 4.
// ============================================================

import type { CSSProperties } from 'react'
import type { FeedEntry, Student } from '@/lib/types'
import StreamComposer from '@/components/dashboard/StreamComposer'

const NOW = '2026-04-16T00:00:00.000Z'

const TEST_STUDENTS: Student[] = [
  {
    id: 'test-athena',
    schoolId: 'test-school',
    firstName: 'Athena',
    lastName: 'Lonsdale',
    gradeLevel: '3',
    academicYear: '2025-2026',
    parentUserIds: [],
    profilePhotoPath: null,
    summary: null,
    progressSummary: null,
    isDemo: true,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    gender: 'girl',
    dateOfBirth: null,
    enrollmentStatus: 'active',
  },
  {
    id: 'test-thomas',
    schoolId: 'test-school',
    firstName: 'Thomas',
    lastName: 'Sowell',
    gradeLevel: '5',
    academicYear: '2025-2026',
    parentUserIds: [],
    profilePhotoPath: null,
    summary: null,
    progressSummary: null,
    isDemo: true,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    gender: 'boy',
    dateOfBirth: null,
    enrollmentStatus: 'active',
  },
  {
    id: 'test-baruch',
    schoolId: 'test-school',
    firstName: 'Baruch',
    lastName: 'Spinoza',
    gradeLevel: '4',
    academicYear: '2025-2026',
    parentUserIds: [],
    profilePhotoPath: null,
    summary: null,
    progressSummary: null,
    isDemo: true,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    gender: 'boy',
    dateOfBirth: null,
    enrollmentStatus: 'active',
  },
]

const PAGE: CSSProperties = {
  minHeight: '100vh', background: 'var(--cream)',
}
const CONTENT: CSSProperties = {
  maxWidth: 1280, margin: '0 auto', padding: 32,
}
const TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)', color: 'var(--navy-deep)',
  fontSize: 28, fontWeight: 500, margin: 0,
}
const SUBTITLE: CSSProperties = {
  fontFamily: 'var(--font-body)', color: 'var(--ink-light)',
  fontSize: 14, fontStyle: 'italic', margin: '6px 0 24px',
}

export default function StreamTestPage() {
  const handleSaved = (entry: FeedEntry) => {
    console.log('[stream-test] onSaved entry:', entry)
  }

  return (
    <div style={PAGE}>
      <div style={CONTENT}>
        <h1 style={TITLE}>StreamComposer — Phase 1 scaffold test</h1>
        <p style={SUBTITLE}>
          Dev-only route. Saves real teacher notes for the selected fake student
          (which won't exist in the DB) — expect Note save to 404. UI behaves
          fully; this route will be deleted in Phase 4.
        </p>
        <StreamComposer students={TEST_STUDENTS} onSaved={handleSaved} />
      </div>
    </div>
  )
}
