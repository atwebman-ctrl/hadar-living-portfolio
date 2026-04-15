'use client'

// ============================================================
// components/portfolio/TheCanon.tsx
//
// The Canon section — list view of the student's reading canon.
// Composition:
//   • Section header
//   • CanonListView (stats bar + expandable rows)
//   • AiNarrativePanel (sectionType: reading_bookshelf)
//   • InlineReadingForm (teacher/admin "+ Add Book")
// Demo fallback: renders DEMO_READINGS when no live data and no studentId.
// ============================================================

import type { Reading, AiDraft, UserRole } from '@/lib/types'
import CanonListView from '@/components/portfolio/CanonListView'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import AiDraftEditor from '@/components/shared/AiDraftEditor'
import InlineReadingForm from '@/components/portfolio/InlineReadingForm'
import { DEMO_READINGS, DEMO_CANON_NARRATIVE } from './TheCanonDemoData'
import s from './sections.module.css'

interface Props {
  readings?:      Reading[]
  studentId?:     string
  studentName?:   string
  role?:          UserRole
  existingDraft?: AiDraft
}

function buildDraftContext(readings: Reading[], firstName: string | null) {
  return {
    studentFirstName: firstName,
    completedCount: readings.filter((r) => r.completed).length,
    totalCount: readings.length,
    books: readings.map((r) => ({
      title: r.title, author: r.author, completed: r.completed, whyChosen: r.whyChosen,
    })),
  }
}

export default function TheCanon({ readings, studentId, studentName, role, existingDraft }: Props) {
  const isLive = !!readings && readings.length > 0
  const isDemo = !isLive && !studentId
  const displayReadings = isLive ? readings! : (isDemo ? DEMO_READINGS : [])

  const draftContext = (studentId && role && role !== 'parent' && isLive)
    ? buildDraftContext(readings!, studentName ?? null)
    : null

  return (
    <section id="canon">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>03</span>
        <h2 className={s.sectionTitle}>The Canon</h2>
        <div className={s.sectionRule} />
      </div>

      <div className="reveal">
        <CanonListView readings={displayReadings} studentId={studentId} role={role} />
      </div>

      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="reading_bookshelf"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}

      {isDemo && (
        <AiDraftEditor
          draftId="demo-canon"
          sectionType="reading_bookshelf"
          initialStatus="accepted"
          initialText={DEMO_CANON_NARRATIVE}
          initialFinalText={DEMO_CANON_NARRATIVE}
        />
      )}

      {studentId && role && role !== 'parent' && <InlineReadingForm studentId={studentId} />}
    </section>
  )
}
