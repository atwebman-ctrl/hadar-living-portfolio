'use client'

// ============================================================
// app/dashboard/DashboardSidebar.tsx
//
// Left-rail sidebar. Clickable nav items drive the main view.
// Settings nav item only shown for admin role.
// ============================================================

import type { DashboardView } from './dashboardTypes'

interface NavItem {
  icon:  string
  label: string
  view:  DashboardView
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📋', label: 'Student Rosters',  view: 'roster'          },
  { icon: '🎓', label: 'By Grade',          view: 'by-grade'        },
  { icon: '📜', label: 'Year in Review',    view: 'year-in-review'  },
  { icon: '⚙️', label: 'Settings',          view: 'settings', adminOnly: true },
]

interface Props {
  activeView:   DashboardView
  onViewChange: (view: DashboardView) => void
  role:         string
}

export default function DashboardSidebar({ activeView, onViewChange, role }: Props) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin')

  return (
    <aside className="db-sidebar">
      <p className="db-sidebar-heading">Academy Registry</p>

      <nav>
        {visibleItems.map((item) => (
          <div
            key={item.view}
            role="button"
            tabIndex={0}
            onClick={() => onViewChange(item.view)}
            onKeyDown={(e) => e.key === 'Enter' && onViewChange(item.view)}
            className={`db-nav-item${activeView === item.view ? ' db-nav-item--active' : ''}`}
          >
            <span className="db-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="db-sidebar-quote">
        <p className="db-sidebar-quote-text">
          &ldquo;The knowledge of today is the ink of tomorrow&apos;s history.&rdquo;
        </p>
        <p className="db-sidebar-quote-attr">— Hadar Academy Charter</p>
      </div>
    </aside>
  )
}
