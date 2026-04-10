'use client'

// ============================================================
// components/portfolio/ParentUploadForm.tsx
//
// "Upload from Home" modal for the Parent Uploads section.
// Visible to parents (and admins/teachers when uploadEnabled).
//
// Collects title + category + description before triggering the
// file picker — all three are passed as metadata to UploadButton
// so they arrive with the multipart POST.
// ============================================================

import { useState } from 'react'
import { MODAL_OVERLAY, MODAL_HEADER, modalPanel } from '@/lib/modalStyles'
import UploadButton from '@/components/shared/UploadButton'

interface Props {
  studentId:    string
  academicYear: string
  gradeLevel:   string
}

const CATEGORIES = [
  { value: 'art_craft',     label: 'Art / Craft' },
  { value: 'home_project',  label: 'Home Project' },
  { value: 'recording',     label: 'Recording' },
  { value: 'certificate',   label: 'Certificate' },
  { value: 'photo',         label: 'Photo' },
  { value: 'other',         label: 'Other' },
] as const

// ── Styles ────────────────────────────────────────────────────

const openBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}
const fieldWrap: React.CSSProperties = {
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
const hint: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-faint)',
  letterSpacing: '0.04em', marginTop: '0.5rem',
}

// ── Component ─────────────────────────────────────────────────

const EMPTY = { title: '', category: 'other', description: '' }

export default function ParentUploadForm({ studentId, academicYear, gradeLevel }: Props) {
  const [open,   setOpen]   = useState(false)
  const [form,   setForm]   = useState({ ...EMPTY })

  function close()  { setOpen(false); setForm({ ...EMPTY }) }
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <button style={openBtn} onClick={() => setOpen(true)}>
          + Upload from Home
        </button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Upload from Home
              </span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.25rem' }}>
              <div style={fieldWrap}>
                <span style={lbl}>Title *</span>
                <input
                  style={inp}
                  type="text"
                  value={form.title}
                  placeholder='e.g. "Shabbat art project", "Home reading video"'
                  onChange={(e) => update('title', e.target.value)}
                />
              </div>

              <div style={fieldWrap}>
                <span style={lbl}>Category</span>
                <select style={inp} value={form.category} onChange={(e) => update('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={fieldWrap}>
                <span style={lbl}>Description (optional)</span>
                <textarea
                  style={{ ...inp, minHeight: '4rem', resize: 'vertical' }}
                  value={form.description}
                  placeholder="Tell us about this…"
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <UploadButton
                  studentId={studentId}
                  uploadType="parent_upload"
                  academicYear={academicYear}
                  gradeLevel={gradeLevel}
                  accept="image/*,audio/*,video/*,.pdf"
                  label="Choose & Upload File"
                  disabled={!form.title.trim()}
                  metadata={{
                    title:              form.title,
                    description:        form.description || undefined,
                    parent_upload_type: form.category,
                  }}
                  onSuccess={close}
                />
                {!form.title.trim() && (
                  <p style={hint}>Enter a title above to enable upload.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
