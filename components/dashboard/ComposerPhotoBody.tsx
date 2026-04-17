'use client'

// ============================================================
// components/dashboard/ComposerPhotoBody.tsx
//
// Photo-entry body for StreamComposer.
// Click-to-pick or drag-to-drop. Phase 1: parent just logs the
// File[]; real upload wiring lands in Phase 4.
// Caption lives in ComposerOptionsRow (not here).
// ============================================================

import { useRef, useState, type CSSProperties } from 'react'

interface Props {
  onFilesSelected: (files: File[]) => void
}

const WRAP: CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', gap: 10,
}

const DROPZONE_BASE: CSSProperties = {
  border: '2px dashed var(--rule)', borderRadius: 8,
  background: 'var(--cream)', padding: 24,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 6,
  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
  textAlign: 'center',
}

const DROPZONE_ACTIVE: CSSProperties = {
  ...DROPZONE_BASE,
  borderColor: 'var(--gold)',
  background: 'var(--white)',
}

const PRIMARY: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--navy)',
}

const SECONDARY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)',
  fontStyle: 'italic',
}

export default function ComposerPhotoBody({ onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFilesSelected(files)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files ?? []).filter(
      (f) => f.type.startsWith('image/'),
    )
    if (files.length > 0) onFilesSelected(files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  return (
    <div style={WRAP}>
      <div
        style={dragging ? DROPZONE_ACTIVE : DROPZONE_BASE}
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <span style={PRIMARY}>Drop photos here, or click to choose.</span>
        <span style={SECONDARY}>
          Tagged to whichever student is selected · drag multiple to batch upload
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}
