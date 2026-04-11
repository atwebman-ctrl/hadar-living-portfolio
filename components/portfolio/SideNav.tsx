'use client'

// ============================================================
// components/portfolio/SideNav.tsx
//
// Portfolio sidebar navigation with collapsible group sections.
// Groups match the hub layout: Academics, Student Work, Gallery.
// Clicking a group header navigates to the group page.
// Chevron toggles sub-item visibility.
// ============================================================

import { useState } from 'react'
import { usePathname } from 'next/navigation'

const GROUPS = [
  {
    slug: 'academics',
    label: 'Academics',
    items: [
      { slug: 'intellectual-arc',   label: 'Intellectual Arc' },
      { slug: 'immersion-engine',   label: 'Immersion Engine' },
      { slug: 'scope-and-sequence', label: 'Scope & Sequence' },
    ],
  },
  {
    slug: 'student-work',
    label: 'Student Work',
    items: [
      { slug: 'the-canon',          label: 'The Canon' },
      { slug: 'creative-evolution', label: 'Creative Evolution' },
      { slug: 'rhetoric-room',      label: 'Rhetoric Room' },
      { slug: 'handwriting',        label: 'Handwriting' },
      { slug: 'teacher-notes',      label: 'Teacher Notes' },
      { slug: 'character-arc',      label: 'Character Arc' },
    ],
  },
  {
    slug: 'gallery',
    label: 'Gallery',
    items: [
      { slug: 'photo-gallery',  label: 'Photo Gallery' },
      { slug: 'parent-uploads', label: 'Parent Uploads' },
    ],
  },
]

// Flat list for finding active section
const ALL_ITEMS = GROUPS.flatMap((g) => g.items)

// Anchor fallback for demo page (no studentId)
const ANCHOR_ITEMS = [
  { href: '#overview',       label: 'Overview' },
  { href: '#academics',      label: 'Intellectual Arc' },
  { href: '#hebrew',         label: 'Immersion Engine' },
  { href: '#canon',          label: 'The Canon' },
  { href: '#writing',        label: 'Creative Evolution' },
  { href: '#rhetoric',       label: 'Rhetoric Room' },
  { href: '#character',      label: 'Character Arc' },
  { href: '#scope',          label: 'Scope & Sequence' },
  { href: '#handwriting',    label: 'Handwriting' },
  { href: '#photos',         label: 'Photo Gallery' },
  { href: '#teacher-notes',  label: 'Teacher Notes' },
  { href: '#parent-uploads', label: 'Parent Uploads' },
]

interface SideNavProps {
  schoolName?:  string
  studentName?: string
  role?:        string
  studentId?:   string
  activeSlug?:  string
  /** Active group slug — passed from group page for highlight. */
  activeGroup?: string
}

export default function SideNav({
  schoolName,
  studentName,
  role,
  studentId,
  activeSlug,
  activeGroup,
}: SideNavProps = {}) {
  const pathname = usePathname()

  const isHub  = !!studentId && pathname === `/portfolio/${studentId}`
  const isFull = !!studentId && pathname === `/portfolio/${studentId}/full`

  // Determine active section from path or prop
  const activeSection = activeSlug ?? (
    studentId
      ? ALL_ITEMS.find((s) => pathname.includes(`/section/${s.slug}`))?.slug
      : null
  )

  // Determine active group from prop, path, or active section
  const currentGroup = activeGroup ?? (
    studentId
      ? GROUPS.find((g) => pathname.includes(`/group/${g.slug}`))?.slug
      : null
  ) ?? (
    activeSection
      ? GROUPS.find((g) => g.items.some((i) => i.slug === activeSection))?.slug
      : null
  )

  // Track which groups are expanded; start with active group open
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    if (currentGroup) init[currentGroup] = true
    return init
  })

  const toggleGroup = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  return (
    <nav className="sidenav">
      <div className="logo">
        <div className="logo-mark">{schoolName ?? 'Hadar · 2025–26'}</div>
        {!schoolName && (
          <div className="school-name">Jewish Classical Academy</div>
        )}
      </div>
      <div className="nav-label">Portfolio</div>

      {studentName && (
        <div
          className="sidenav-student-name"
          style={{ padding: '0 1.5rem 1rem', fontFamily: 'var(--font-heading)', fontSize: '13px', color: 'white', lineHeight: 1.3 }}
        >
          {studentName}
        </div>
      )}

      {studentId ? (
        <>
          <a
            href={`/portfolio/${studentId}`}
            className={isHub ? 'active' : ''}
          >
            Overview
          </a>

          {GROUPS.map((group) => {
            const isGroupActive = currentGroup === group.slug
            const isOpen = expanded[group.slug] ?? false

            return (
              <div key={group.slug}>
                <div className="sidenav-group-row">
                  <a
                    href={`/portfolio/${studentId}/group/${group.slug}`}
                    className={`sidenav-group-link${isGroupActive ? ' active' : ''}`}
                  >
                    {group.label}
                  </a>
                  <button
                    className="sidenav-chevron"
                    onClick={(e) => { e.preventDefault(); toggleGroup(group.slug) }}
                    aria-label={`Toggle ${group.label}`}
                  >
                    <svg
                      width="10" height="10" viewBox="0 0 10 10"
                      style={{
                        transform:  isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <path d="M3 1 L7 5 L3 9" stroke="currentColor" fill="none" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>

                {isOpen && (
                  <div className="sidenav-sub-items">
                    {group.items.map(({ slug, label }) => (
                      <a
                        key={slug}
                        href={`/portfolio/${studentId}/group/${group.slug}?tab=${slug}`}
                        className={activeSection === slug ? 'active' : ''}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <a
            href={`/portfolio/${studentId}/full`}
            className={isFull ? 'active' : ''}
            style={{ opacity: 0.65, fontSize: '0.78rem', marginTop: '0.5rem' }}
          >
            Full Portfolio
          </a>
        </>
      ) : (
        <>
          {ANCHOR_ITEMS.map(({ href, label }) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </>
      )}

      {(role === 'admin' || role === 'teacher') && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '1rem 1.5rem 0', paddingTop: '0.75rem' }}>
          <a
            href="/dashboard"
            style={{
              display:        'block',
              fontFamily:     'var(--font-heading)',
              fontStyle:      'italic',
              fontSize:       '0.72rem',
              color:          'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              letterSpacing:  '0.02em',
              padding:        '0.25rem 0 0.5rem',
              transition:     'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            ← Back to Dashboard
          </a>
        </div>
      )}
    </nav>
  )
}
