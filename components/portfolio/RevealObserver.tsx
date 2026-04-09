'use client'

// ============================================================
// components/portfolio/RevealObserver.tsx
//
// Renders nothing; sets up the IntersectionObserver that adds
// the 'visible' class to .reveal elements as they scroll into
// view. Must be rendered on any page that uses portfolio.css.
//
// A MutationObserver watches for new .reveal elements added
// dynamically (e.g. when selectedYear changes) so they animate
// in correctly without requiring a full page reload.
// ============================================================

import { useEffect } from 'react'

export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 },
    )

    // Observe all current .reveal elements that haven't animated yet.
    const observeNew = () =>
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el))

    observeNew()

    // Watch for new .reveal elements added to the DOM after initial mount
    // (e.g. when the year selector switches views).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.classList.contains('reveal') && !node.classList.contains('visible')) {
            io.observe(node)
          }
          node.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el))
        }
      }
    })

    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
