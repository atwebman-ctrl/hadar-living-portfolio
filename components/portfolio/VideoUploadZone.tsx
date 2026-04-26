'use client'

// ============================================================
// components/portfolio/VideoUploadZone.tsx
//
// Drag-and-drop + browse file picker for video uploads.
// Uploads immediately to Supabase storage via the uploads API
// and calls onDone(storagePath) on success.
// Used by InlineVideoForm.tsx.
// ============================================================

import { useRef, useState } from 'react'

export type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface Props {
  studentId:   string
  gradeLevel:  string
  onDone:      (storagePath: string) => void
  onError:     (msg: string) => void
}

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_BYTES = 500 * 1024 * 1024 // 500 MB

export default function VideoUploadZone({ studentId, gradeLevel, onDone, onError }: Props) {
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const [state,    setState]      = useState<UploadState>('idle')
  const [progress, setProgress]   = useState(0)
  const [filename, setFilename]   = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState(false)

  function reset() { setState('idle'); setProgress(0); setFilename(null) }

  function upload(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('Only mp4, mov, and webm files are supported.'); return
    }
    if (file.size > MAX_BYTES) {
      onError('File exceeds the 500 MB limit.'); return
    }
    setFilename(file.name); setState('uploading'); setProgress(0)

    const fd = new FormData()
    fd.append('file',          file)
    fd.append('upload_type',   'video')
    fd.append('academic_year', '')
    fd.append('grade_level',   gradeLevel)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/dashboard/students/${studentId}/uploads`)
    xhr.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = JSON.parse(xhr.responseText) as { storagePath: string }
        setState('done'); setProgress(100); onDone(body.storagePath)
      } else {
        const body = JSON.parse(xhr.responseText) as { error?: string }
        setState('error'); onError(body.error ?? 'Upload failed.')
      }
    })
    xhr.addEventListener('error', () => { setState('error'); onError('Network error — upload failed.') })
    xhr.send(fd)
  }

  if (state === 'uploading') return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-mid)', marginBottom: '0.4rem' }}>
        Uploading {filename} — {progress}%
      </div>
      <div style={{ height: 3, background: 'var(--rule)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.1s linear' }} />
      </div>
    </div>
  )

  if (state === 'done') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.5rem 0.75rem', background: 'var(--state-success-bg)', border: '1px solid var(--state-success-border)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--state-success)' }}>
        ✓ {filename} uploaded
      </span>
      <button type="button" onClick={reset}
        style={{ background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--state-success)', cursor: 'pointer' }}>
        Replace
      </button>
    </div>
  )

  if (state === 'error') return (
    <div onClick={reset} style={{ border: '2px dashed var(--state-error-border)', background: 'var(--state-error-bg)',
      padding: '1rem', textAlign: 'center', cursor: 'pointer' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--state-error)', letterSpacing: '0.06em' }}>
        Upload failed — click to try again
      </div>
    </div>
  )

  return (
    <>
      <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]) }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]) }}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? 'var(--navy)' : 'var(--rule)'}`,
          background: dragOver ? 'var(--cream-dark)' : 'var(--cream)',
          padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          DRAG &amp; DROP A VIDEO FILE
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
          or click to browse
        </div>
      </div>
    </>
  )
}
