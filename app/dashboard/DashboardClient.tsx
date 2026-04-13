'use client'

// ============================================================
// app/dashboard/DashboardClient.tsx
//
// Client wrapper for the dashboard. Owns the active-view state
// and orchestrates sidebar + main content rendering.
// The server component (page.tsx) fetches data and passes it in.
// ============================================================

import { useState } from 'react'
import type { Student } from '@/lib/types'
import type { DashboardView } from './dashboardTypes'
import { PageHeader } from './DashboardUI'
import AddStudentForm from './AddStudentForm'
import DashboardSidebar from './DashboardSidebar'
import StudentGrid from './StudentGrid'
import ByGradeView from '@/components/dashboard/ByGradeView'
import YearInReviewView from '@/components/dashboard/YearInReviewView'
import SettingsView from '@/components/dashboard/SettingsView'

interface Props {
  students:   Student[]
  role:       string
  schoolName: string
}

export default function DashboardClient({ students, role, schoolName }: Props) {
  const [activeView, setActiveView] = useState<DashboardView>('roster')

  return (
    <>
      <PageHeader schoolName={schoolName}>
        <AddStudentForm />
      </PageHeader>

      <div className="db-inner-layout">
        <DashboardSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          role={role}
        />

        <div className="db-content-area">
          <main className="db-main">
            {activeView === 'roster'         && <StudentGrid students={students} role={role} />}
            {activeView === 'by-grade'       && <ByGradeView students={students} role={role} />}
            {activeView === 'year-in-review' && <YearInReviewView />}
            {activeView === 'settings'       && <SettingsView role={role} />}
          </main>
        </div>
      </div>
    </>
  )
}
