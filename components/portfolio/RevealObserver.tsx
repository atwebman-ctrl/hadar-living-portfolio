'use client'

// ============================================================
// components/portfolio/RevealObserver.tsx
//
// Renders nothing; sets up the IntersectionObserver that adds
// the 'visible' class to .reveal elements as they scroll into
// view. Must be rendered on any page that uses portfolio.css.
// ============================================================

import { useEffect } from 'react'

export default function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 },
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return null
}
