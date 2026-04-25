'use client'

// ============================================================
// components/shared/DirectUploadButton.tsx
//
// Three-step upload that bypasses Vercel's ~4.5 MB body cap by
// PUTting the file straight to Supabase storage:
//
//   1. POST /uploads/sign  — server validates auth + size + MIME,
//                            returns { signedUrl, token, path }
//   2. PUT  signedUrl      — raw XHR upload, fires progress events
//   3. POST /uploads/finalize — server re-validates path + auth and
//                               inserts the matching DB row
//
// Drop-in replacement for UploadButton. Same prop interface; the
// only behavioural change is a "Preparing…/Uploading…/Saving…"
// three-stage progress UX. Used today by UnifiedGallery,
// ParentUploadForm, and CompositionHandwriting; other surfaces
// (profile_photo, video, school logo, report cards) still use
// UploadButton until they're migrated.
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MAX_FILE_BYTES,
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

type Stage = 'idle' | 'preparing' | 'uploading' | 'saving' | 'success' | 'error'

interface SignResponse  { token: string; path: string; signedUrl: string }
interface XhrResult     { ok: boolean; status: number; body: unknown }

// ── Helpers ───────────────────────────────────────────────────

async function postJson(url: string, body: unknown): Promise<XhrResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let parsed: unknown = null
  try { parsed = await res.json() } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, body: parsed }
}

function putWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<XhrResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100))
    })
    xhr.addEventListener('load', () => {
      let parsed: unknown = null
      try { parsed = JSON.parse(xhr.responseText) } catch { /* ignore */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: parsed })
    })
    xhr.addEventListener('error', () => resolve({ ok: false, status: 0, body: null }))
    xhr.send(file)
  })
}

// ── Component ─────────────────────────────────────────────────

export default function DirectUploadButton({
  studentId, uploadType, academicYear, gradeLevel,
  label    = 'Upload File',
  accept   = 'image/*',
  disabled = false,
  metadata = {},
  onSuccess, onError,
}: Props) {
  const router         = useRouter()
  const inputRef       = useRef<HTMLInputElement>(null)
  const [stage,    setStage]    = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isBusy = stage === 'preparing' || stage === 'uploading' || stage === 'saving'

  function handleClick() {
    if (isBusy || disabled) return
    setStage('idle')
    setErrorMsg(null)
    inputRef.current?.click()
  }

  function fail(msg: string) {
    setStage('error')
    setErrorMsg(msg)
    onError?.(msg)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // ── Client-side validation ──
    if (file.size > MAX_FILE_BYTES[uploadType]) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const maxMB  = Math.round(MAX_FILE_BYTES[uploadType] / (1024 * 1024))
      return fail(`File too large (${sizeMB} MB). Limit is ${maxMB} MB for this upload type.`)
    }
    if (!MIME_ALLOWLIST[uploadType].test(file.type)) {
      return fail(`File type not allowed. Please choose ${TYPE_LABEL[uploadType]} file.`)
    }

    // ── Stage 1: /sign ──
    setStage('preparing')
    setProgress(0)
    setErrorMsg(null)

    const sign = await postJson(
      `/api/dashboard/students/${studentId}/uploads/sign`,
      { uploadType, filename: file.name, mime: file.type, size: file.size },
    )
    if (!sign.ok) {
      const serverMsg = (sign.body as Record<string, string> | null)?.error
      return fail(errorMessageForStatus(sign.status, serverMsg))
    }
    const { signedUrl, path } = sign.body as SignResponse

    // ── Stage 2: PUT to signed URL ──
    setStage('uploading')
    const put = await putWithProgress(signedUrl, file, setProgress)
    if (!put.ok) {
      // Storage failures don't carry our usual error JSON; use a clear default.
      return fail('File upload failed. Please try again.')
    }

    // ── Stage 3: /finalize ──
    setStage('saving')
    const finalize = await postJson(
      `/api/dashboard/students/${studentId}/uploads/finalize`,
      { uploadType, path, academicYear, gradeLevel, metadata },
    )
    if (!finalize.ok) {
      const serverMsg = (finalize.body as Record<string, string> | null)?.error
      return fail(errorMessageForStatus(finalize.status, serverMsg))
    }

    setStage('success')
    setProgress(100)
    router.refresh()
    onSuccess?.((finalize.body as { record?: unknown })?.record ?? finalize.body)
  }

  const labelText =
    stage === 'preparing' ? 'Preparing…'
    : stage === 'uploading' ? `Uploading ${progress}%`
    : stage === 'saving' ? 'Saving…'
    : stage === 'success' ? 'Uploaded ✓'
    : label

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
        disabled={isBusy || disabled}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         (isBusy || disabled) ? 'var(--ink-faint)' : 'var(--gold)',
          background:    'transparent',
          border:        '1px solid',
          borderColor:   (isBusy || disabled) ? 'var(--rule)' : 'var(--gold)',
          padding:       '0.45rem 0.9rem',
          cursor:        (isBusy || disabled) ? 'default' : 'pointer',
          transition:    'color 0.15s, border-color 0.15s',
        }}
      >
        {labelText}
      </button>

      {stage === 'uploading' && (
        <div style={{ marginTop: '0.4rem', height: 3, background: 'var(--rule)', width: '100%' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.1s linear' }} />
        </div>
      )}

      {stage === 'error' && errorMsg && (
        <p style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#b91c1c', letterSpacing: '0.05em' }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
