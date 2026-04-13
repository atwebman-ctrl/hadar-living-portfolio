'use client'

// ============================================================
// components/dashboard/StudentCardOverflow.tsx
//
// Three-dot overflow menu on the dense StudentCard. Wraps the
// archive flow so it's out of the way by default. Click-outside
// closes the popover.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import DeleteStudentButton from './DeleteStudentButton'

export default function StudentCardOverflow({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={wrapRef} className="db-card-overflow">
      <button
        type="button"
        className="db-card-overflow-trigger"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        ⋯
      </button>
      {open && (
        <div className="db-card-overflow-menu" role="menu">
          <DeleteStudentButton studentId={studentId} />
        </div>
      )}
    </div>
  )
}
