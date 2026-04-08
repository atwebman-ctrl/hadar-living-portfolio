'use client'

// ============================================================
// components/shared/UploadButton.tsx
//
// Generic file upload button. Triggers a hidden <input type="file">,
// POSTs multipart form data to the uploads API, and shows inline
// progress feedback. Uses design-system tokens only.
//
// Props
//   studentId      — target student UUID
//   uploadType     — 'photo' | 'handwriting' | 'parent_upload'
//   academicYear   — e.g. '2025-2026'
//   gradeLevel     — e.g. 'Grade 1'
//   label          — button label (default: 'Upload File')
//   accept         — MIME type filter (default: 'image/*')
//   metadata       — extra form fields forwarded to the API
//   onSuccess      — called with the server response on success
//   onError        — called with the error message on failure
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export type UploadType = 'photo' | 'handwriting' | 'parent_upload'

export interface UploadMetadata {
  caption?:            string
  date_taken?:         string
  term?:               string
  title?:              string
  description?:        string
  date?:               string
  parent_upload_type?: string
}

interface Props {
  studentId:    string
  uploadType:   UploadType
  academicYear: string
  gradeLevel:   string
  label?:       string
  accept?:      string
  metadata?:    UploadMetadata
  onSuccess?:   (data: unknown) => void
  onError?:     (msg: string)   => void
}

type Status = 'idle' | 'uploading' | 'success' | 'error'

export default function UploadButton({
  studentId,
  uploadType,
  academicYear,
  gradeLevel,
  label      = 'Upload File',
  accept     = 'image/*',
  metadata   = {},
  onSuccess,
  onError,
}: Props) {
  const router          = useRouter()
  const inputRef        = useRef<HTMLInputElement>(null)
  const [status,  setStatus]  = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleClick() {
    if (status === 'uploading') return
    setStatus('idle')
    setErrorMsg(null)
    inputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected after an error
    e.target.value = ''

    setStatus('uploading')
    setProgress(0)
    setErrorMsg(null)

    const form = new FormData()
    form.append('file',          file)
    form.append('upload_type',   uploadType)
    form.append('academic_year', academicYear)
    form.append('grade_level',   gradeLevel)

    if (metadata.caption)            form.append('caption',            metadata.caption)
    if (metadata.date_taken)         form.append('date_taken',         metadata.date_taken)
    if (metadata.term)               form.append('term',               metadata.term)
    if (metadata.title)              form.append('title',              metadata.title)
    if (metadata.description)        form.append('description',        metadata.description)
    if (metadata.date)               form.append('date',               metadata.date)
    if (metadata.parent_upload_type) form.append('parent_upload_type', metadata.parent_upload_type)

    // Use XHR so we can report real progress
    const result = await new Promise<{ ok: boolean; body: unknown }>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/dashboard/students/${studentId}/uploads`)

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        let body: unknown
        try { body = JSON.parse(xhr.responseText) } catch { body = null }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, body })
      })

      xhr.addEventListener('error', () => resolve({ ok: false, body: null }))
      xhr.send(form)
    })

    if (!result.ok) {
      const msg =
        (result.body as Record<string, string> | null)?.error ??
        'Upload failed. Please try again.'
      setStatus('error')
      setErrorMsg(msg)
      onError?.(msg)
      return
    }

    setProgress(100)
    setStatus('success')
    router.refresh()
    onSuccess?.(result.body)
  }

  const isUploading = status === 'uploading'

  return (
    <div style={{ display: 'inline-block' }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label={label}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        style={{
          fontFamily:      'var(--font-mono)',
          fontSize:        '0.65rem',
          letterSpacing:   '0.12em',
          textTransform:   'uppercase',
          color:           isUploading ? 'var(--ink-faint)' : 'var(--gold)',
          background:      'transparent',
          border:          '1px solid',
          borderColor:     isUploading ? 'var(--rule)' : 'var(--gold)',
          padding:         '0.45rem 0.9rem',
          cursor:          isUploading ? 'default' : 'pointer',
          transition:      'color 0.15s, border-color 0.15s',
        }}
      >
        {isUploading ? `Uploading ${progress}%` : status === 'success' ? 'Uploaded ✓' : label}
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div style={{ marginTop: '0.4rem', height: 3, background: 'var(--rule)', width: '100%' }}>
          <div
            style={{
              height:     '100%',
              width:      `${progress}%`,
              background: 'var(--gold)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <p
          style={{
            marginTop:   '0.4rem',
            fontFamily:  'var(--font-mono)',
            fontSize:    '0.6rem',
            color:       '#b91c1c',
            letterSpacing: '0.05em',
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  )
}
