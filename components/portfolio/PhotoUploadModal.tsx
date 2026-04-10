'use client'

// ============================================================
// components/portfolio/PhotoUploadModal.tsx
//
// "Upload Photo" modal for Photo Gallery section.
// Drag-and-drop zone + caption / term / category metadata.
// All fields are sent as FormData alongside the file.
// ============================================================

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, modalPanel } from '@/lib/modalStyles'

interface Props {
  studentId:    string
  academicYear: string
  gradeLevel:   string
}

const CATEGORIES = [
  { value: 'classroom',   label: 'Classroom' },
  { value: 'field_trip',  label: 'Field Trip' },
  { value: 'project',     label: 'Project' },
  { value: 'performance', label: 'Performance' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'portrait',    label: 'Portrait' },
  { value: 'other',       label: 'Other' },
] as const

// ── Styles ────────────────────────────────────────────────────

const openBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}
const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }
const lbl: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }
const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', boxSizing: 'border-box' }
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }

// ── Component ─────────────────────────────────────────────────

const EMPTY = { caption: '', term: '', category: 'classroom' }

export default function PhotoUploadModal({ studentId, academicYear, gradeLevel }: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open,      setOpen]      = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [dragging,  setDragging]  = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function close() { setOpen(false); setForm({ ...EMPTY }); setError(null); setProgress(0); setUploading(false) }
  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setUploading(true); setError(null); setProgress(0)

    const fd = new FormData()
    fd.append('file',          file)
    fd.append('upload_type',   'photo')
    fd.append('academic_year', academicYear)
    fd.append('grade_level',   gradeLevel)
    if (form.caption) fd.append('caption',  form.caption)
    if (form.term)    fd.append('term',     form.term)
    fd.append('category', form.category)

    const result = await new Promise<{ ok: boolean; msg?: string }>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/dashboard/students/${studentId}/uploads`)
      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      })
      xhr.addEventListener('load', () => {
        let body: Record<string, string> | null = null
        try { body = JSON.parse(xhr.responseText) } catch { /* ignore */ }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, msg: body?.error })
      })
      xhr.addEventListener('error', () => resolve({ ok: false, msg: 'Network error.' }))
      xhr.send(fd)
    })

    if (!result.ok) { setError(result.msg ?? 'Upload failed.'); setUploading(false); return }
    router.refresh()
    close()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <button style={openBtn} onClick={() => setOpen(true)}>+ Upload Photo</button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(500)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Upload Photo</span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {error && <div style={{ padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</div>}

              <div style={fieldWrap}>
                <span style={lbl}>Caption (optional)</span>
                <input style={inp} type="text" value={form.caption} placeholder="What's happening in this photo?" onChange={(e) => update('caption', e.target.value)} />
              </div>
              <div style={twoCol}>
                <div style={fieldWrap}>
                  <span style={lbl}>Term</span>
                  <select style={inp} value={form.term} onChange={(e) => update('term', e.target.value)}>
                    <option value="">Select term…</option>
                    {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <span style={lbl}>Category</span>
                  <select style={inp} value={form.category} onChange={(e) => update('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Drop zone */}
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f) }} />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--rule)'}`, padding: '2rem 1rem', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: dragging ? 'rgba(196,154,42,0.04)' : 'transparent', marginTop: '0.5rem', transition: 'border-color 0.15s' }}
              >
                {uploading ? (
                  <>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-mid)', margin: '0 0 0.5rem', letterSpacing: '0.08em' }}>Uploading {progress}%…</p>
                    <div style={{ height: 3, background: 'var(--rule)', borderRadius: 0 }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.1s linear' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-mid)', margin: '0 0 0.3rem', letterSpacing: '0.08em' }}>
                      Drop image here
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', margin: 0, letterSpacing: '0.06em' }}>
                      or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
