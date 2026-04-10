'use client'

// ============================================================
// components/portfolio/InlineVideoForm.tsx
//
// "+ Add Video" modal inside the Rhetoric Room section.
// Admin/teacher only (caller gates).
//
// Two input modes (toggle at top of modal):
//   url  — paste a YouTube or Vimeo link
//   file — drag-and-drop or browse for mp4/mov/webm via
//          VideoUploadZone; file uploads immediately on
//          selection; DB record created on form submit.
//
// POSTs { videoUrl } or { videoStoragePath } to
// /api/dashboard/students/[studentId]/videos.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRADE_SELECT_OPTIONS, TERM_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, modalPanel } from '@/lib/modalStyles'
import VideoUploadZone from './VideoUploadZone'

interface Props { studentId: string }

type InputMode = 'url' | 'file'

const CATEGORIES = [
  { value: 'hebrew_speaking',     label: 'Hebrew Speaking' },
  { value: 'poetry_recitation',   label: 'Poetry Recitation' },
  { value: 'socratic_reflection', label: 'Socratic Reflection' },
  { value: 'immersion',           label: 'Immersion' },
  { value: 'other',               label: 'Other' },
] as const

// ── Styles ────────────────────────────────────────────────────

const toggleBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}
const field: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem',
}
const lbl: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-mid)',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)',
  fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)',
  border: '1px solid var(--rule)', boxSizing: 'border-box',
}
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }
const submitBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)',
  border: 'none', padding: '7px 20px', cursor: 'pointer', marginTop: '0.25rem',
}
const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '0.4rem 0.75rem', marginBottom: '0.75rem',
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em',
  color:      type === 'success' ? '#166534' : '#991b1b',
  background: type === 'success' ? '#f0fdf4' : '#fef2f2',
  border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
})

// ── Component ─────────────────────────────────────────────────

const EMPTY = { title: '', videoUrl: '', gradeLevel: '', term: '', category: 'hebrew_speaking' }

export default function InlineVideoForm({ studentId }: Props) {
  const router = useRouter()

  const [open,         setOpen]         = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [status,       setStatus]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form,         setForm]         = useState({ ...EMPTY })
  const [mode,         setMode]         = useState<InputMode>('url')
  const [storagePath,  setStoragePath]  = useState<string | null>(null)

  function close() {
    setOpen(false); setStatus(null); setMode('url')
    setStoragePath(null); setForm({ ...EMPTY })
  }
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'file' && !storagePath) {
      setStatus({ type: 'error', msg: 'Wait for the file to finish uploading.' }); return
    }
    setSaving(true); setStatus(null)
    try {
      const body = mode === 'url'
        ? { title: form.title, videoUrl: form.videoUrl,         gradeLevel: form.gradeLevel, term: form.term, category: form.category }
        : { title: form.title, videoStoragePath: storagePath,   gradeLevel: form.gradeLevel, term: form.term, category: form.category }

      const res  = await fetch(`/api/dashboard/students/${studentId}/videos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: json.error ?? 'Save failed.' })
      } else {
        close(); router.refresh()
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error — please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.title && !!form.gradeLevel && !!form.term &&
    (mode === 'url' ? !!form.videoUrl : !!storagePath)

  return (
    <>
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <button style={toggleBtn} onClick={() => { setOpen(true); setStatus(null) }}>+ Add Video</button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(520)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Add Video
              </span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {status && <div style={statusBar(status.type)}>{status.msg}</div>}

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 0, marginBottom: '1.25rem', border: '1px solid var(--rule)' }}>
                {(['url', 'file'] as InputMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => { setMode(m); setStatus(null) }}
                    style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                      letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                      background: mode === m ? 'var(--navy)' : 'var(--cream)',
                      color:      mode === m ? 'var(--gold-pale)' : 'var(--ink-mid)' }}>
                    {m === 'url' ? 'YouTube / Vimeo URL' : 'Upload File'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={field}>
                  <span style={lbl}>Title</span>
                  <input style={inp} type="text" value={form.title} required
                    placeholder="e.g. Grade 3 Bronze Poetry Recitation"
                    onChange={(e) => update('title', e.target.value)} />
                </div>

                {mode === 'url' && (
                  <div style={field}>
                    <span style={lbl}>YouTube or Vimeo URL</span>
                    <input style={inp} type="url" value={form.videoUrl} required={mode === 'url'}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) => update('videoUrl', e.target.value)} />
                  </div>
                )}

                {mode === 'file' && (
                  <div style={field}>
                    <span style={lbl}>Video File (mp4, mov, webm · max 500 MB)</span>
                    <VideoUploadZone
                      studentId={studentId}
                      gradeLevel={form.gradeLevel}
                      onDone={(path) => setStoragePath(path)}
                      onError={(msg) => setStatus({ type: 'error', msg })}
                    />
                  </div>
                )}

                <div style={twoCol}>
                  <div style={field}>
                    <span style={lbl}>Grade Level</span>
                    <select style={inp} value={form.gradeLevel} required onChange={(e) => update('gradeLevel', e.target.value)}>
                      <option value="">Select grade…</option>
                      {GRADE_SELECT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={field}>
                    <span style={lbl}>Term</span>
                    <select style={inp} value={form.term} required onChange={(e) => update('term', e.target.value)}>
                      <option value="">Select term…</option>
                      {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={field}>
                  <span style={lbl}>Category</span>
                  <select style={inp} value={form.category} onChange={(e) => update('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button style={{ ...submitBtn, opacity: (saving || !canSubmit) ? 0.5 : 1 }}
                    type="submit" disabled={saving || !canSubmit}>
                    {saving ? 'Saving…' : 'Save Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
