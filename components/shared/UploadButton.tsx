'use client'

// ============================================================
// components/shared/UploadButton.tsx
//
// Legacy multipart upload button. POSTs the file directly to
// /api/dashboard/students/.../uploads, bounded by Vercel's
// ~4.5 MB serverless body cap. Used by callers that haven't
// migrated to DirectUploadButton yet (profile_photo, video,
// school logo, report cards, assessment PDFs).
//
// For surfaces inside the photo / handwriting / parent_upload
// trio, prefer DirectUploadButton — it bypasses the body cap
// via a signed-URL upload directly to Supabase storage.
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LEGACY_MAX_FILE_BYTES,
  MIME_ALLOWLIST,
  TYPE_LABEL,
  errorMessageForStatus,
  type UploadType,
} from '@/lib/uploadValidation'

export type { UploadType }

export interface UploadMetadata {
  caption?:            string
  date_taken?:         string
  term?:               string
  category?:           string
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
  disabled?:    boolean
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
  disabled   = false,
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
    if (status === 'uploading' || disabled) return
    setStatus('idle')
    setErrorMsg(null)
    inputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected after an error
    e.target.value = ''

    // Client-side validation — fast feedback before opening XHR. Server is
    // still the authoritative gate, but Vercel kills oversize requests before
    // our handler runs, so a client-side check prevents the silent-failure mode.
    if (file.size > LEGACY_MAX_FILE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const msg = `File too large (${sizeMB} MB). Please choose a file under 4 MB.`
      setStatus('error'); setErrorMsg(msg); onError?.(msg); return
    }
    if (!MIME_ALLOWLIST[uploadType].test(file.type)) {
      const msg = `File type not allowed. Please choose ${TYPE_LABEL[uploadType]} file.`
      setStatus('error'); setErrorMsg(msg); onError?.(msg); return
    }

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
    if (metadata.category)           form.append('category',           metadata.category)
    if (metadata.title)              form.append('title',              metadata.title)
    if (metadata.description)        form.append('description',        metadata.description)
    if (metadata.date)               form.append('date',               metadata.date)
    if (metadata.parent_upload_type) form.append('parent_upload_type', metadata.parent_upload_type)

    // Use XHR so we can report real progress
    const result = await new Promise<{ ok: boolean; status: number; body: unknown }>((resolve) => {
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
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body })
      })

      xhr.addEventListener('error', () => resolve({ ok: false, status: 0, body: null }))
      xhr.send(form)
    })

    if (!result.ok) {
      const serverMsg = (result.body as Record<string, string> | null)?.error
      const msg = errorMessageForStatus(result.status, serverMsg)
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
        disabled={isUploading || disabled}
        style={{
          fontFamily:      'var(--font-mono)',
          fontSize:        '0.65rem',
          letterSpacing:   '0.12em',
          textTransform:   'uppercase',
          color:           (isUploading || disabled) ? 'var(--ink-faint)' : 'var(--gold)',
          background:      'transparent',
          border:          '1px solid',
          borderColor:     (isUploading || disabled) ? 'var(--rule)' : 'var(--gold)',
          padding:         '0.45rem 0.9rem',
          cursor:          (isUploading || disabled) ? 'default' : 'pointer',
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
