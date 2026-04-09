'use client'

// ============================================================
// components/portfolio/SideNav.tsx
//
// Portfolio sidebar navigation. When studentId is provided,
// renders route-based links to hub / section detail / full
// pages, with usePathname for active detection.
// When no studentId (demo), falls back to anchor links.
// ============================================================

import { usePathname } from 'next/navigation'

const SECTION_ITEMS = [
  { slug: 'intellectual-arc',  label: 'Intellectual Arc' },
  { slug: 'immersion-engine',  label: 'Immersion Engine' },
  { slug: 'the-canon',         label: 'The Canon' },
  { slug: 'creative-evolution',label: 'Creative Evolution' },
  { slug: 'rhetoric-room',     label: 'Rhetoric Room' },
  { slug: 'character-arc',     label: 'Character Arc' },
  { slug: 'scope-and-sequence',label: 'Scope & Sequence' },
  { slug: 'handwriting',       label: 'Handwriting' },
  { slug: 'photo-gallery',     label: 'Photo Gallery' },
  { slug: 'teacher-notes',     label: 'Teacher Notes' },
  { slug: 'parent-uploads',    label: 'Parent Uploads' },
]

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
  /** School display name. Defaults to 'Hadar · 2025–26' (demo fallback). */
  schoolName?: string
  /** Student full name shown below the Portfolio label. */
  studentName?: string
  /** Viewer role. When 'admin' or 'teacher', shows a back-to-dashboard link. */
  role?: string
  /** When provided, renders route-based links instead of anchor links. */
  studentId?: string
  /** Active slug override (passed from section page for immediate highlight). */
  activeSlug?: string
}

export default function SideNav({
  schoolName,
  studentName,
  role,
  studentId,
  activeSlug,
}: SideNavProps = {}) {
  const pathname = usePathname()

  // Determine active item from current path
  const isHub     = !!studentId && pathname === `/portfolio/${studentId}`
  const isFull    = !!studentId && pathname === `/portfolio/${studentId}/full`
  const activeSection = activeSlug ?? (
    studentId
      ? SECTION_ITEMS.find((s) => pathname.includes(`/section/${s.slug}`))?.slug
      : null
  )

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
        // ── Route-based nav ──────────────────────────────────
        <>
          <a
            href={`/portfolio/${studentId}`}
            className={isHub ? 'active' : ''}
          >
            Overview
          </a>

          {SECTION_ITEMS.map(({ slug, label }) => (
            <a
              key={slug}
              href={`/portfolio/${studentId}/section/${slug}`}
              className={activeSection === slug ? 'active' : ''}
            >
              {label}
            </a>
          ))}

          <a
            href={`/portfolio/${studentId}/full`}
            className={isFull ? 'active' : ''}
            style={{ opacity: 0.65, fontSize: '0.78rem' }}
          >
            Full Portfolio
          </a>
        </>
      ) : (
        // ── Anchor fallback (demo page) ───────────────────────
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
