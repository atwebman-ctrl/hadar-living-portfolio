'use client'

import { useEffect, useState } from 'react'

const navItems = [
  { href: '#overview',  label: 'Overview' },
  { href: '#academics', label: 'Intellectual Arc' },
  { href: '#hebrew',    label: 'Immersion Engine' },
  { href: '#canon',     label: 'The Canon' },
  { href: '#writing',   label: 'Creative Evolution' },
  { href: '#rhetoric',  label: 'Rhetoric Room' },
  { href: '#character', label: 'Character Arc' },
]

export default function SideNav() {
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
        <div className="logo-mark">Hadar · 2025–26</div>
        <div className="school-name">Jewish Classical Academy</div>
      </div>
      <div className="nav-label">Portfolio</div>
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
    </nav>
  )
}
