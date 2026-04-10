'use client'

import { useRef, useState } from 'react'

interface Props {
  studentId:        string
  profilePhotoPath: string | null
  firstName:        string
  lastName:         string
  size?:            number
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${path}`
}

export default function ProfilePhotoUpload({
  studentId, profilePhotoPath, firstName, lastName, size = 72,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  // Local display URL — updated immediately on upload success so the modal
  // doesn't flash. The parent (EditStudentForm) calls router.refresh() on close.
  const [displayUrl, setDisplayUrl] = useState<string | null>(() => buildPhotoUrl(profilePhotoPath))

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const fontSize = Math.round(size * 0.33)

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_type', 'profile_photo')
      const res = await fetch(`/api/dashboard/students/${studentId}/uploads`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Upload failed.')
      } else {
        const j = await res.json().catch(() => ({})) as { storagePath?: string }
        if (j.storagePath) setDisplayUrl(buildPhotoUrl(j.storagePath))
      }
    } catch {
      setError('Network error.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div
        onClick={openPicker}
        title="Click to change photo"
        style={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(184,160,80,0.4)', flexShrink: 0,
          cursor: uploading ? 'default' : 'pointer',
          background: 'linear-gradient(135deg, #1a3a6b 0%, #C49A2A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {displayUrl
          ? <img src={displayUrl} alt={`${firstName} ${lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontFamily: 'var(--font-heading)', fontSize: `${fontSize}px`, color: '#fff', fontWeight: 700, userSelect: 'none' }}>{initials}</span>
        }
      </div>

      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        style={{ background: 'none', border: 'none', padding: 0, cursor: uploading ? 'default' : 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}
      >
        {uploading ? 'Uploading…' : 'Change Photo'}
      </button>

      {error && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#991b1b' }}>{error}</span>
      )}
    </div>
  )
}
