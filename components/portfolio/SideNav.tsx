'use client'

import { useEffect, useState } from 'react'

const navItems = [
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
}

export default function SideNav({ schoolName, studentName, role }: SideNavProps = {}) {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const ids = navItems.map(n => n.href.slice(1))
    const handler = () => {
      let current = ids[0]
      ids.forEach(id => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < 120) current = id
      })
      setActive(current)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

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
        <div className="sidenav-student-name" style={{ padding: '0 1.5rem 1rem', fontFamily: 'var(--font-heading)', fontSize: '13px', color: 'white', lineHeight: 1.3 }}>
          {studentName}
        </div>
      )}
      {navItems.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className={active === href.slice(1) ? 'active' : ''}
          onClick={() => setActive(href.slice(1))}
        >
          {label}
        </a>
      ))}

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
