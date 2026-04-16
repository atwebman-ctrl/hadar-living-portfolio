'use client'

// ============================================================
// app/dashboard/DashboardClient.tsx
//
// Client wrapper for the dashboard. Owns the active-view state
// and renders the header + full-width main content.
// The server component (page.tsx) fetches data and passes it in.
// ============================================================

import { useState } from 'react'
import type { Student } from '@/lib/types'
import type { DashboardView } from './dashboardTypes'
import { PageHeader } from './DashboardUI'
import AddStudentForm from './AddStudentForm'
import StudentGrid from './StudentGrid'
import YearInReviewView from '@/components/dashboard/YearInReviewView'
import WorkbenchView from '@/components/dashboard/WorkbenchView'

interface Props {
  students:      Student[]
  role:          string
  schoolName:    string
  schoolLogoUrl: string | null
}

export default function DashboardClient({ students, role, schoolName, schoolLogoUrl }: Props) {
  const [activeView, setActiveView] = useState<DashboardView>('roster')

  return (
    <>
      <PageHeader
        schoolName={schoolName}
        schoolLogoUrl={schoolLogoUrl}
        activeView={activeView}
        onViewChange={setActiveView}
        role={role}
      >
        <AddStudentForm />
      </PageHeader>

      <main className="db-main">
        {activeView === 'roster'         && <StudentGrid students={students} role={role} />}
        {activeView === 'year-in-review' && <YearInReviewView />}
        {activeView === 'workbench'      && <WorkbenchView students={students} role={role} />}
      </main>

      <div className="db-sidebar-quote">
        <p className="db-sidebar-quote-text">
          &ldquo;Man is wise only while in search of wisdom.&rdquo;
        </p>
        <p className="db-sidebar-quote-attr">— {schoolName || 'Academy'}</p>
      </div>
    </>
  )
}
