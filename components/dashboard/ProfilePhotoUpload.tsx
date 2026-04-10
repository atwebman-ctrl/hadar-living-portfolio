'use client'

// ============================================================
// components/dashboard/ProfilePhotoUpload.tsx
//
// 72px circle (or custom size) that shows the student's profile
// photo (or gold-gradient initials). Three ways to upload:
//   1. Click the circle   → label[for] natively opens file picker
//   2. Click "Change Photo" button → same input via label
//   3. Drag-and-drop an image onto the circle
//
// XHR to /uploads?upload_type=profile_photo → router.refresh().
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  studentId:        string
  profilePhotoPath: string | null
  firstName:        string
  lastName:         string
  size?:            number  // circle diameter in px (default 72)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${path}`
}

export default function ProfilePhotoUpload({
  studentId, profilePhotoPath, firstName, lastName, size = 72,
}: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [dragging,  setDragging]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const initials  = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const url       = buildPhotoUrl(profilePhotoPath)
  const fontSize  = Math.round(size * 0.33)
  // Unique id ties the <label> to the hidden <input> — no JS needed for click
  const inputId   = `profile-photo-input-${studentId}`

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // allow re-selecting same file after error
    upload(file)
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true) }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setDragging(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please drop an image file.'); return }
    upload(file)
  }

  function upload(file: File) {
    setUploading(true); setProgress(0); setError(null)

    const fd = new FormData()
    fd.append('file',        file)
    fd.append('upload_type', 'profile_photo')

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) { router.refresh() }
      else {
        try { setError(JSON.parse(xhr.responseText).error ?? 'Upload failed.') }
        catch { setError('Upload failed.') }
      }
    }
    xhr.onerror = () => { setUploading(false); setError('Network error.') }
    xhr.open('POST', `/api/dashboard/students/${studentId}/uploads`)
    xhr.send(fd)
  }

  const ringColor = dragging ? 'rgba(196,154,42,0.8)' : 'rgba(184,160,80,0.4)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>

      {/*
        <label htmlFor={inputId}> is the browser-native trigger for the hidden file
        input — clicking anywhere inside the label opens the picker without JS.
        Drag-and-drop handlers are also on this element.
      */}
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click or drop image to change photo"
        style={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden',
          border: `2px solid ${ringColor}`,
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer',
          pointerEvents: uploading ? 'none' : 'auto',
          background: 'linear-gradient(135deg, #1a3a6b 0%, #C49A2A 100%)',
          transition: 'border-color 0.15s',
          boxShadow: dragging ? '0 0 0 3px rgba(196,154,42,0.25)' : 'none',
        }}
      >
        {url
          ? <img
              src={url}
              alt={`${firstName} ${lastName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            />
          : <span style={{ fontFamily: 'var(--font-heading)', fontSize: `${fontSize}px`, color: '#fff', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>
              {initials}
            </span>
        }
      </label>

      {/* Hidden file input — linked to the label above */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={uploading}
      />

      {/* "Change Photo" text — also a label so click = file picker */}
      <label
        htmlFor={inputId}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-faint)',
          cursor: uploading ? 'default' : 'pointer',
          pointerEvents: uploading ? 'none' : 'auto',
        }}
      >
        {uploading
          ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Uploading {progress}%…</span>
              <span style={{ display: 'inline-block', width: 48, height: 2, background: 'var(--rule)', verticalAlign: 'middle', position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', inset: 0, width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.1s linear' }} />
              </span>
            </span>
          )
          : 'Change Photo'
        }
      </label>

      {error && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#991b1b' }}>
          {error}
        </span>
      )}
    </div>
  )
}
