'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'
import { TERM_OPTIONS } from '@/lib/constants'

const CATEGORIES = [
  { value: 'art_craft',     label: 'Art / Craft' },
  { value: 'home_project',  label: 'Home Project' },
  { value: 'recording',     label: 'Recording' },
  { value: 'certificate',   label: 'Certificate' },
  { value: 'photo',         label: 'Photo' },
  { value: 'other',         label: 'Other' },
] as const

export interface UploadCardItem {
  id:          string
  title:       string
  category:    string
  description: string | null
  label:       string
  icon:        string
  date:        string | null
  gradeLevel:  string
  publicUrl:   string | null
  storagePath: string | null
  showImg:     boolean
}

interface Props {
  item:      UploadCardItem
  studentId: string
  canEdit:   boolean
  onExpand?: () => void
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

export default function ParentUploadCard({ item, studentId, canEdit, onExpand }: Props) {
  const router = useRouter()
  const [hovering, setHovering] = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [editErr,  setEditErr]  = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: item.title, category: item.category, description: item.description ?? '' })

  function openEdit() { setEditForm({ title: item.title, category: item.category, description: item.description ?? '' }); setEditErr(null); setEditing(true) }
  function closeEdit() { setEditing(false); setEditErr(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setEditErr(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/parent-uploads/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editForm.title, category: editForm.category, description: editForm.description || null }),
      })
      if (!res.ok) { const j = await res.json(); setEditErr(j.error ?? 'Save failed.'); return }
      closeEdit(); router.refresh()
    } catch { setEditErr('Network error.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/dashboard/students/${studentId}/parent-uploads/${item.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const tag = [item.label, item.date].filter(Boolean).join(' · ')

  return (
    <>
      <figure
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setConfirm(false) }}
        onClick={() => { if (item.showImg && onExpand) onExpand() }}
        style={{ margin: 0, border: '1px solid var(--rule)', background: 'var(--parchment)', cursor: (item.showImg && onExpand) ? 'zoom-in' : 'default', overflow: 'hidden', position: 'relative' }}
      >
        {/* Visual area — image or icon placeholder */}
        {item.showImg ? (
          <img src={item.publicUrl!} alt={item.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ aspectRatio: '4/3', background: 'var(--cream-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--rule)', gap: '0.4rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden>{item.icon}</span>
            {item.publicUrl && (
              <a
                href={item.publicUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'underline' }}
              >
                View ↗
              </a>
            )}
          </div>
        )}

        {/* Caption */}
        <figcaption style={{ padding: '0.6rem 0.75rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '.8rem', color: 'var(--ink-mid)', margin: '0 0 .2rem', lineHeight: 1.4, fontWeight: 500 }}>{item.title}</p>
          {tag && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.58rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: item.description ? '.25rem' : 0 }}>{tag}</span>}
          {item.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '.75rem', color: 'var(--ink-faint)', margin: 0, lineHeight: 1.4 }}>{item.description}</p>}
        </figcaption>

        {/* Hover-revealed edit/delete */}
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
          <div style={modalPanel(480)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Edit Upload</span>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
              {editErr && <div style={{ padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>{editErr}</div>}
              <form onSubmit={handleSave}>
                <div style={fld}><span style={lbl}>Title</span><input style={inp} type="text" required value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={fld}>
                    <span style={lbl}>Category</span>
                    <select style={inp} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Term (display only)</span>
                    <select style={{ ...inp, opacity: 0.5 }} disabled><option>{TERM_OPTIONS[0]}</option></select>
                  </div>
                </div>
                <div style={fld}><span style={lbl}>Description (optional)</span><textarea style={{ ...inp, minHeight: '4rem', resize: 'vertical' }} value={editForm.description} placeholder="Tell us about this…" onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={saving} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', padding: '7px 20px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
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
