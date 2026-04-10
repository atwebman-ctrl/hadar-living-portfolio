'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, modalPanel } from '@/lib/modalStyles'

const CATEGORIES = [
  { value: 'classroom',   label: 'Classroom'   },
  { value: 'field_trip',  label: 'Field Trip'  },
  { value: 'project',     label: 'Project'     },
  { value: 'performance', label: 'Performance' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'portrait',    label: 'Portrait'    },
  { value: 'other',       label: 'Other'       },
] as const

const s = {
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '0.75rem' } as React.CSSProperties,
  label: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' } as React.CSSProperties,
  input: { width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', boxSizing: 'border-box' } as React.CSSProperties,
}

interface Props { studentId: string; academicYear: string; gradeLevel: string }

export default function PhotoUploadModal({ studentId, academicYear, gradeLevel }: Props) {
  const router = useRouter()
  const [open,      setOpen]      = useState(false)
  const [caption,   setCaption]   = useState('')
  const [term,      setTerm]      = useState('')
  const [category,  setCategory]  = useState('classroom')
  const [file,      setFile]      = useState<File | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function reset() { setCaption(''); setTerm(''); setCategory('classroom'); setFile(null); setError(null); setUploading(false) }
  function close() { setOpen(false); reset() }

  function pickFile(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(null); setFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }

  async function handleUpload() {
    if (!file || uploading) return
    setUploading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file',          file)
      fd.append('upload_type',   'photo')
      fd.append('caption',       caption)
      fd.append('term',          term)
      fd.append('category',      category)
      fd.append('academic_year', academicYear)
      fd.append('grade_level',   gradeLevel)
      const res = await fetch(`/api/dashboard/students/${studentId}/uploads`, { method: 'POST', body: fd })
      if (res.ok) { close(); router.refresh() }
      else { const j = await res.json().catch(() => ({})) as { error?: string }; setError(j.error ?? 'Upload failed.') }
    } catch { setError('Network error.') }
    finally { setUploading(false) }
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)', background: 'none', border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer' }}
        >+ Upload Photo</button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Upload Photo</span>
              <button type="button" onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer' }} aria-label="Close">✕</button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
              {error && <div style={{ marginBottom: '0.75rem', padding: '0.4rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</div>}

              <div style={s.field}><span style={s.label}>Caption (optional)</span><input style={s.input} type="text" value={caption} placeholder="What's happening in this photo?" onChange={(e) => setCaption(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={s.field}><span style={s.label}>Term</span>
                  <select style={s.input} value={term} onChange={(e) => setTerm(e.target.value)}>
                    <option value="">Select term…</option>
                    {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={s.field}><span style={s.label}>Category</span>
                  <select style={s.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Drop zone — drag here OR use the visible file input below */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
                onDrop={onDrop}
                style={{ border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--rule)'}`, padding: '0.75rem', marginBottom: '0.5rem', background: dragging ? 'rgba(196,154,42,0.04)' : 'transparent', transition: 'border-color 0.15s' }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', textAlign: 'center', margin: '0 0 0.6rem', letterSpacing: '0.06em' }}>
                  {file ? `✓ ${file.name}` : 'Drop image here, or use the file picker below'}
                </p>
                {/* Visible, unstyled file input — always clickable, no JS needed */}
                <input type="file" accept="image/*" onChange={(e) => pickFile(e.target.files?.[0])} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', padding: '7px 20px', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', opacity: (!file || uploading) ? 0.5 : 1 }}
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
