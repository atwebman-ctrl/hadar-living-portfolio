'use client'

// ============================================================
// components/portfolio/SideNav.tsx
//
// Portfolio sidebar navigation.
// Single "Portfolio" group with six tabs (always expanded),
// plus standalone Teacher journal + Gallery links.
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ThirdLanguage } from '@/lib/types'
import styles from './SideNav.module.css'

const PORTFOLIO_GROUP_SLUG  = 'portfolio'
const PORTFOLIO_GROUP_LABEL = 'Portfolio'

const FIXED_ITEMS_BEFORE = [
  { slug: 'the-canon', label: 'The Canon' },
  { slug: 'math',      label: 'Math'      },
  { slug: 'english',   label: 'English'   },
] as const

const FIXED_ITEMS_AFTER = [
  { slug: 'scripture', label: 'Scripture' },
  { slug: 'soulcraft', label: 'Soulcraft' },
] as const

interface SideNavProps {
  schoolName?:      string
  studentName?:     string
  role?:            string
  studentId?:       string
  activeSlug?:      string
  /** Active group slug — passed from group page for highlight. */
  activeGroup?:     string
  /** Per-school third-language tabs. Defaults to a single Hebrew tab for demo. */
  thirdLanguages?:  ThirdLanguage[]
}

const DEMO_THIRD_LANGUAGES: ThirdLanguage[] = [
  { code: 'hebrew', label: 'Hebrew', hasAvantNorms: true },
]

export default function SideNav({
  schoolName,
  studentName,
  role,
  studentId,
  activeSlug,
  activeGroup,
  thirdLanguages = DEMO_THIRD_LANGUAGES,
}: SideNavProps = {}) {
  const PORTFOLIO_ITEMS = [
    ...FIXED_ITEMS_BEFORE,
    ...thirdLanguages.map((l) => ({ slug: l.code, label: l.label })),
    ...FIXED_ITEMS_AFTER,
  ]

  // Anchor fallback for demo page (no studentId)
  const ANCHOR_ITEMS = [
    { href: '#overview',  label: 'Overview'  },
    { href: '#canon',     label: 'The Canon' },
    { href: '#math',      label: 'Math'      },
    { href: '#english',   label: 'English'   },
    ...thirdLanguages.map((l) => ({ href: `#${l.code}`, label: l.label })),
    { href: '#scripture', label: 'Scripture' },
    { href: '#character', label: 'Soulcraft' },
  ]

  const pathname = usePathname()

  const isHub     = !!studentId && pathname === `/portfolio/${studentId}`
  const isReports = !!studentId && pathname === `/portfolio/${studentId}/full`
  const isJournal = !!studentId && pathname === `/portfolio/${studentId}/journal`
  const isGallery = !!studentId && pathname === `/portfolio/${studentId}/gallery`

  // Determine active section from path or prop
  const activeSection = activeSlug ?? (
    studentId
      ? PORTFOLIO_ITEMS.find((s) => pathname.includes(`/section/${s.slug}`))?.slug
      : null
  )

  const isGroupActive =
    activeGroup === 'portfolio' ||
    (!!studentId && pathname.includes('/group/portfolio')) ||
    (activeSection ? PORTFOLIO_ITEMS.some((i) => i.slug === activeSection) : false)

  return (
    <nav className={styles.sidenav}>
      <Link
        href="/dashboard"
        className={styles.logo}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        {schoolName && <div className={styles.logoMark}>{schoolName}</div>}
      </Link>
      <div className={styles.navLabel}>Portfolio</div>

      {studentName && (
        <div className={styles.studentName}>
          {studentName}
        </div>
      )}

      {studentId ? (
        <>
          <a
            href={`/portfolio/${studentId}`}
            className={`${styles.navLink}${isHub ? ` ${styles.navLinkActive}` : ''}`}
          >
            Overview
          </a>

          <div>
            <div className={styles.groupRow}>
              <a
                href={`/portfolio/${studentId}/group/${PORTFOLIO_GROUP_SLUG}`}
                className={`${styles.groupLink}${isGroupActive ? ` ${styles.groupLinkActive}` : ''}`}
              >
                {PORTFOLIO_GROUP_LABEL}
              </a>
            </div>

            <div className={styles.subItems}>
              {PORTFOLIO_ITEMS.map(({ slug, label }) => (
                <a
                  key={slug}
                  href={`/portfolio/${studentId}/group/${PORTFOLIO_GROUP_SLUG}?tab=${slug}`}
                  className={activeSection === slug ? 'active' : ''}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <a
            href={`/portfolio/${studentId}/journal`}
            className={`${styles.navLink}${isJournal ? ` ${styles.navLinkActive}` : ''}`}
          >
            Teacher journal
          </a>
          <a
            href={`/portfolio/${studentId}/gallery`}
            className={`${styles.navLink}${isGallery ? ` ${styles.navLinkActive}` : ''}`}
          >
            Gallery
          </a>

          <a
            href={`/portfolio/${studentId}/full`}
            className={`${styles.navLink}${isReports ? ` ${styles.navLinkActive}` : ''}`}
          >
            Reports
          </a>
        </>
      ) : (
        <>
          {ANCHOR_ITEMS.map(({ href, label }) => (
            <a key={href} href={href} className={styles.navLink}>{label}</a>
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
