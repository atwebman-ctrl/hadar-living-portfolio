'use client'

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

const openBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}
const fieldWrap: React.CSSProperties  = { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }
const lbl: React.CSSProperties        = { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }
const inp: React.CSSProperties        = { width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', boxSizing: 'border-box' }
const twoCol: React.CSSProperties     = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }

const EMPTY = { caption: '', term: '', category: 'classroom' }

export default function PhotoUploadModal({ studentId, academicYear, gradeLevel }: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open,      setOpen]      = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [pending,   setPending]   = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function close() {
    setOpen(false); setForm({ ...EMPTY }); setError(null); setUploading(false); setPending(null)
  }
  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    console.log('openPicker fired', inputRef.current)
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('file selected', e.target.files)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(null)
    setPending(file)
  }

  async function handleUpload() {
    if (!pending || uploading) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file',          pending)
      fd.append('upload_type',   'photo')
      fd.append('caption',       form.caption)
      fd.append('term',          form.term)
      fd.append('category',      form.category)
      fd.append('academic_year', academicYear)
      fd.append('grade_level',   gradeLevel)
      const res = await fetch(`/api/dashboard/students/${studentId}/uploads`, { method: 'POST', body: fd })
      if (res.ok) {
        close()
        router.refresh()
      } else {
        const j = await res.json().catch(() => ({})) as { error?: string }
        setError(j.error ?? 'Upload failed.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setUploading(false)
    }
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
              <button type="button" onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {error && (
                <div style={{ padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

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

              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {/* Drop zone — plain div, onClick triggers the hidden input */}
              <div
                onClick={openPicker}
                style={{
                  marginTop: '0.5rem', padding: '2rem 1rem', textAlign: 'center',
                  border: `2px dashed ${pending ? 'var(--navy)' : 'var(--rule)'}`,
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
              >
                {pending ? (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--navy)', margin: 0, letterSpacing: '0.08em' }}>
                    ✓ {pending.name} — click to replace
                  </p>
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-mid)', margin: '0 0 0.3rem', letterSpacing: '0.08em' }}>Drop image here</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', margin: 0, letterSpacing: '0.06em' }}>or click to browse</p>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  disabled={!pending || uploading}
                  onClick={(e) => { e.stopPropagation(); void handleUpload() }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', padding: '7px 20px', cursor: (!pending || uploading) ? 'not-allowed' : 'pointer', opacity: (!pending || uploading) ? 0.5 : 1 }}
                >
                  {uploading ? 'Uploading…' : 'Upload Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
