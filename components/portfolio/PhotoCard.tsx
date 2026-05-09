'use client'

// ============================================================
// components/portfolio/PhotoCard.tsx
//
// Single photo card with hover-revealed Edit/Delete (admin/teacher).
// Edit modal pre-populates caption, term, category.
// Delete is soft-delete. Both call router.refresh() on success.
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'
import type { LightboxPhoto } from './PhotoLightbox'

const CATEGORIES = [
  { value: 'classroom',   label: 'Classroom' },
  { value: 'field_trip',  label: 'Field Trip' },
  { value: 'project',     label: 'Project' },
  { value: 'performance', label: 'Performance' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'portrait',    label: 'Portrait' },
  { value: 'other',       label: 'Other' },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  classroom: 'Classroom', field_trip: 'Field Trip', project: 'Project',
  performance: 'Performance', celebration: 'Celebration', portrait: 'Portrait', other: 'Other',
}

const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }
const fld: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }
const actionBtn = (danger?: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', background: 'none', cursor: 'pointer', padding: '2px 8px',
  border: `1px solid ${danger ? '#b91c1c' : 'var(--rule)'}`,
  color: danger ? '#b91c1c' : 'var(--ink-mid)',
})

interface Props {
  photo:      LightboxPhoto
  studentId:  string
  canEdit:    boolean
  onExpand:   () => void
}

function PhotoPlaceholder({ caption }: { caption: string }) {
  return (
    <div style={{ aspectRatio: '4/3', background: 'var(--cream-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--rule)', gap: '0.4rem', padding: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', opacity: 0.3 }}>📷</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', maxWidth: '80%' }}>{caption || 'Photo'}</span>
    </div>
  )
}

export default function PhotoCard({ photo, studentId, canEdit, onExpand }: Props) {
  const router = useRouter()
  const [hovering, setHovering]   = useState(false)
  const [confirm,  setConfirm]    = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [editing,  setEditing]    = useState(false)
  const [saving,   setSaving]     = useState(false)
  const [editErr,  setEditErr]    = useState<string | null>(null)
  const [editForm, setEditForm]   = useState({ caption: photo.caption ?? '', term: photo.term ?? '', category: photo.category ?? 'classroom' })

  const catLabel = photo.category ? (CATEGORY_LABELS[photo.category] ?? photo.category) : null
  const tag      = [photo.term, catLabel].filter(Boolean).join(' · ')
  const clickable = !!photo.publicUrl

  function openEdit() { setEditForm({ caption: photo.caption ?? '', term: photo.term ?? '', category: photo.category ?? 'classroom' }); setEditErr(null); setEditing(true) }
  function closeEdit() { setEditing(false); setEditErr(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setEditErr(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/photos/${photo.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editForm.caption || null, term: editForm.term || null, category: editForm.category }),
      })
      if (!res.ok) { const j = await res.json(); setEditErr(j.error ?? 'Save failed.'); return }
      closeEdit(); router.refresh()
    } catch { setEditErr('Network error.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/dashboard/students/${studentId}/photos/${photo.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <figure
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setConfirm(false) }}
        onClick={() => { if (clickable) onExpand() }}
        style={{ margin: 0, border: '1px solid var(--rule)', background: 'var(--parchment)', cursor: clickable ? 'zoom-in' : 'default', overflow: 'hidden', position: 'relative' }}
      >
        {photo.publicUrl
          ? (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
              <Image
                src={photo.publicUrl}
                alt={photo.caption ?? 'Portfolio photo'}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )
          : <PhotoPlaceholder caption={photo.caption ?? ''} />
        }
        {(photo.caption || tag) && (
          <figcaption style={{ padding: '0.6rem 0.75rem' }}>
            {photo.caption && <p style={{ fontFamily: 'var(--font-body)', fontSize: '.8rem', color: 'var(--ink-mid)', margin: '0 0 .2rem', lineHeight: 1.4 }}>{photo.caption}</p>}
            {tag && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.58rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{tag}</span>}
          </figcaption>
        )}

        {canEdit && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: hovering ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            {confirm ? (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'var(--parchment)', padding: '2px 4px', border: '1px solid var(--rule)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--ink-mid)' }}>Delete?</span>
                <button style={actionBtn(true)}  onClick={handleDelete}>{deleting ? '…' : 'Yes'}</button>
                <button style={actionBtn(false)} onClick={() => setConfirm(false)}>No</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--parchment)', padding: '2px 4px', border: '1px solid var(--rule)' }}>
                <button style={actionBtn(false)} onClick={openEdit}>Edit</button>
                <button style={actionBtn(true)}  onClick={() => setConfirm(true)}>Delete</button>
              </div>
            )}
          </div>
        )}
      </figure>

      {editing && (
        <div style={MODAL_OVERLAY} onClick={closeEdit}>
          <div style={modalPanel(440)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Edit Photo</span>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
              {editErr && <div style={{ padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>{editErr}</div>}
              <form onSubmit={handleSave}>
                <div style={fld}><span style={lbl}>Caption</span><input style={inp} type="text" value={editForm.caption} placeholder="What's in this photo?" onChange={(e) => setEditForm((f) => ({ ...f, caption: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={fld}>
                    <span style={lbl}>Term</span>
                    <select style={inp} value={editForm.term} onChange={(e) => setEditForm((f) => ({ ...f, term: e.target.value }))}>
                      <option value="">Select term…</option>
                      {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Category</span>
                    <select style={inp} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={saving} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', padding: '7px 20px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Save Changes'}
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
