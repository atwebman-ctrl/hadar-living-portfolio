'use client'

import { useRef, useState, type CSSProperties } from 'react'
import type { Student } from '@/lib/types'
import { TERM_OPTIONS } from '@/lib/constants'
import StudentAutocomplete from './StudentAutocomplete'

interface Props { students: Student[] }

type QueuedPhoto = {
  id:       string
  file:     File
  preview:  string
  student:  { id: string; name: string } | null
  status:   'ready' | 'uploading' | 'done' | 'failed'
}

const CATEGORIES = [
  { value: 'classroom',    label: 'Classroom' },
  { value: 'field_trip',   label: 'Field trip' },
  { value: 'project',      label: 'Project' },
  { value: 'performance',  label: 'Performance' },
  { value: 'celebration',  label: 'Celebration' },
  { value: 'portrait',     label: 'Portrait' },
  { value: 'other',        label: 'Other' },
] as const

function termToAcademicYear(term: string): string {
  const parts = term.split(' ')
  const season = parts[0]
  const year = parseInt(parts[1], 10)
  if (isNaN(year)) return ''
  if (season === 'Fall') return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

const S = {
  zone:    { border: '2px dashed var(--rule)', borderRadius: 10, padding: '40px 20px', textAlign: 'center' as const, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', marginBottom: 16 } as CSSProperties,
  zoneHi:  { border: '2px dashed var(--gold)', borderRadius: 10, padding: '40px 20px', textAlign: 'center' as const, cursor: 'pointer', background: 'rgba(196,154,42,0.04)', marginBottom: 16 } as CSSProperties,
  zoneH1:  { fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: 4 } as CSSProperties,
  zoneSub: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' } as CSSProperties,
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 } as CSSProperties,
  card:    { border: '1px solid var(--rule)', borderRadius: 6, padding: 8, background: 'var(--white)' } as CSSProperties,
  thumb:   { width: '100%', height: 100, objectFit: 'cover' as const, borderRadius: 4, marginBottom: 6 } as CSSProperties,
  fname:   { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 } as CSSProperties,
  badge:   { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 6px', borderRadius: 3, marginTop: 6, display: 'inline-block' } as CSSProperties,
  ctrl:    { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12, marginBottom: 16 } as CSSProperties,
  sel:     { border: '1px solid var(--rule)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--ink)', background: 'var(--white)', minHeight: 44, cursor: 'pointer' } as CSSProperties,
  footer:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' } as CSSProperties,
  counter: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.06em' } as CSSProperties,
  btn:     { minHeight: 44, padding: '10px 24px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, background: 'var(--navy)', color: 'var(--cream)', border: 'none', borderRadius: 6, cursor: 'pointer' } as CSSProperties,
  toast:   { fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', marginTop: 8 } as CSSProperties,
}

const STATUS_COLORS: Record<QueuedPhoto['status'], { bg: string; color: string }> = {
  ready:     { bg: 'rgba(0,0,0,0.04)', color: 'var(--ink-faint)' },
  uploading: { bg: 'rgba(196,154,42,0.12)', color: '#92400e' },
  done:      { bg: 'rgba(22,101,52,0.08)', color: '#166534' },
  failed:    { bg: 'rgba(153,27,27,0.08)', color: '#991b1b' },
}

export default function BatchPhotosMode({ students }: Props) {
  const [queue, setQueue]       = useState<QueuedPhoto[]>([])
  const [term, setTerm]         = useState<string>(TERM_OPTIONS[TERM_OPTIONS.length - 1])
  const [category, setCategory] = useState('classroom')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [toast, setToast]       = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newItems: QueuedPhoto[] = arr.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      preview: URL.createObjectURL(f),
      student: null,
      status: 'ready',
    }))
    setQueue(prev => [...prev, ...newItems])
  }

  function tagStudent(photoId: string, student: { id: string; name: string } | null) {
    setQueue(prev => prev.map(p => p.id === photoId ? { ...p, student } : p))
  }

  function removePhoto(photoId: string) {
    setQueue(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (photo) URL.revokeObjectURL(photo.preview)
      return prev.filter(p => p.id !== photoId)
    })
  }

  const taggedCount = queue.filter(p => p.student).length
  const academicYear = termToAcademicYear(term)

  async function handleUpload() {
    const tagged = queue.filter(p => p.student && p.status !== 'done')
    if (tagged.length === 0) return
    setUploading(true); setToast(null)
    let done = 0; let failed = 0

    for (const photo of tagged) {
      setProgress(`Uploading ${done + failed + 1} of ${tagged.length}…`)
      setQueue(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p))

      const student = students.find(s => s.id === photo.student!.id)
      const fd = new FormData()
      fd.append('file', photo.file)
      fd.append('upload_type', 'photo')
      fd.append('academic_year', academicYear)
      fd.append('grade_level', student?.gradeLevel ?? '')
      fd.append('term', term)
      fd.append('category', category)

      try {
        const res = await fetch(`/api/dashboard/students/${photo.student!.id}/uploads`, {
          method: 'POST', body: fd,
        })
        if (!res.ok) throw new Error('Upload failed')
        setQueue(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'done' } : p))
        done++
      } catch {
        setQueue(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'failed' } : p))
        failed++
      }
    }

    setProgress('')
    setUploading(false)
    if (failed === 0) {
      setToast({ type: 'ok', msg: `${done} photos uploaded` })
    } else {
      setToast({ type: 'err', msg: `${done} uploaded, ${failed} failed` })
    }
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        style={dragging ? S.zoneHi : S.zone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
      >
        <p style={S.zoneH1}>Drag photos here or click to browse</p>
        <p style={S.zoneSub}>Tag each photo with a student name after upload</p>
        <input ref={inputRef} type="file" multiple accept="image/*"
          style={{ display: 'none' }} onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <>
          <div style={S.grid}>
            {queue.map((p) => {
              const sc = STATUS_COLORS[p.status]
              return (
                <div key={p.id} style={S.card}>
                  <img src={p.preview} alt="" style={S.thumb} />
                  <div style={S.fname}>{p.file.name}</div>
                  {p.status === 'ready' ? (
                    <StudentAutocomplete students={students} selected={p.student}
                      onSelect={(s) => tagStudent(p.id, s)} />
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)' }}>
                      {p.student?.name ?? 'Untagged'}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{p.status}</span>
                    {p.status === 'ready' && (
                      <button type="button" onClick={() => removePhoto(p.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
                      }}>×</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controls */}
          <div style={S.ctrl}>
            <select style={S.sel} value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={S.sel} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Footer */}
          <div style={S.footer}>
            <span style={S.counter}>
              {progress || `${taggedCount} of ${queue.length} photos tagged`}
            </span>
            <button type="button" style={{ ...S.btn, opacity: taggedCount === 0 || uploading ? 0.45 : 1 }}
              disabled={taggedCount === 0 || uploading} onClick={handleUpload}>
              {uploading ? 'Uploading…' : 'Upload all'}
            </button>
          </div>

          {toast && (
            <div style={{ ...S.toast, color: toast.type === 'ok' ? 'var(--teal, #166534)' : '#991b1b' }}>
              {toast.msg}
            </div>
          )}
        </>
      )}
    </div>
  )
}
