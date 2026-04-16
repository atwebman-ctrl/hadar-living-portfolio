'use client'

// ============================================================
// components/portfolio/InlineTeacherNoteForm.tsx
//
// "+ Add Note" modal inside Teacher Notes section.
// Admin/teacher only (caller gates).
//
// Three grouped sections:
//   1. Context   — section category, term, date
//   2. Narrative — note text, highlight quote
//   3. Visibility — visible_to_parents toggle
//
// POSTs to /api/dashboard/students/[studentId]/teacher-notes
// and calls router.refresh() on success.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERM_OPTIONS } from '@/lib/constants'
import { MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, modalPanel } from '@/lib/modalStyles'

interface Props { studentId: string }

// ⚠️ `value` strings are DB-stored section_category values — do NOT rename.
// Only `label` is UI-facing. English is the one new-style value here because
// it had no legacy counterpart (Math + English used to share intellectual_arc).
const SECTION_CATEGORIES = [
  { value: 'intellectual_arc',   label: 'Math' },
  { value: 'english',            label: 'English' },
  { value: 'immersion_engine',   label: 'Hebrew' },
  { value: 'the_canon',          label: 'The Canon' },
  { value: 'creative_evolution', label: 'Composition' },
  { value: 'character_arc',      label: 'Soulcraft' },
  { value: 'general',            label: 'General' },
] as const

// ── Styles ────────────────────────────────────────────────────

const toggleBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '10px 16px', minHeight: 44, cursor: 'pointer',
}
const sectionHead: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--rule)',
  paddingBottom: '0.35rem', marginBottom: '0.75rem', marginTop: '1.1rem',
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
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }
const submitBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', background: 'var(--navy)', color: 'var(--gold-pale)',
  border: 'none', padding: '12px 24px', minHeight: 44, cursor: 'pointer', marginTop: '0.25rem',
}
const statusBar = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '0.4rem 0.75rem', marginBottom: '0.75rem',
  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em',
  color:      type === 'success' ? '#166534' : '#991b1b',
  background: type === 'success' ? '#f0fdf4' : '#fef2f2',
  border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
})

// ── Component ─────────────────────────────────────────────────

const EMPTY = { noteText: '', sectionCategory: 'general', term: '', date: '', highlightQuote: '' }

export default function InlineTeacherNoteForm({ studentId }: Props) {
  const router = useRouter()
  const [open,             setOpen]             = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [status,           setStatus]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form,             setForm]             = useState({ ...EMPTY })
  const [visibleToParents, setVisibleToParents] = useState(true)

  function close() { setOpen(false); setStatus(null); setForm({ ...EMPTY }); setVisibleToParents(true) }
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setStatus(null)
    try {
      const body: Record<string, unknown> = {
        noteText:         form.noteText,
        sectionCategory:  form.sectionCategory,
        visibleToParents,
      }
      if (form.term)           body.term           = form.term
      if (form.date)           body.date           = form.date
      if (form.highlightQuote) body.highlightQuote = form.highlightQuote

      const res  = await fetch(`/api/dashboard/students/${studentId}/teacher-notes`, {
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

  return (
    <>
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <button style={toggleBtn} onClick={() => { setOpen(true); setStatus(null) }}>
          + Add Note
        </button>
      </div>

      {open && (
        <div style={MODAL_OVERLAY} onClick={close}>
          <div style={modalPanel(520)} onClick={(e) => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Add Teacher Note
              </span>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }} aria-label="Close">✕</button>
            </div>
            <div style={MODAL_BODY}>
              {status && <div style={statusBar(status.type)}>{status.msg}</div>}

              <form onSubmit={handleSubmit}>

                {/* ── Section 1: Context ── */}
                <div style={sectionHead}>1 — Context</div>
                <div style={twoCol}>
                  <div style={fieldWrap}>
                    <span style={lbl}>Section</span>
                    <select style={inp} value={form.sectionCategory} onChange={(e) => update('sectionCategory', e.target.value)}>
                      {SECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div style={fieldWrap}>
                    <span style={lbl}>Term</span>
                    <select style={inp} value={form.term} onChange={(e) => update('term', e.target.value)}>
                      <option value="">Select term…</option>
                      {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={fieldWrap}>
                  <span style={lbl}>Date (optional)</span>
                  <input style={inp} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
                </div>

                {/* ── Section 2: The Narrative ── */}
                <div style={sectionHead}>2 — The Narrative</div>
                <div style={fieldWrap}>
                  <span style={lbl}>Note</span>
                  <textarea style={{ ...inp, minHeight: '8rem', resize: 'vertical' }} required
                    value={form.noteText}
                    placeholder="What did you observe about this student today? A moment of insight, a struggle, a breakthrough…"
                    onChange={(e) => update('noteText', e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <span style={lbl}>Pull Quote (optional)</span>
                  <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical' }}
                    value={form.highlightQuote}
                    placeholder="One sentence to highlight — the kind of thing you'd share with a parent."
                    onChange={(e) => update('highlightQuote', e.target.value)} />
                </div>

                {/* ── Section 3: Visibility ── */}
                <div style={sectionHead}>3 — Visibility</div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <input type="checkbox" checked={visibleToParents} onChange={(e) => setVisibleToParents(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--navy)', width: 14, height: 14 }} />
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                      Visible to parents
                    </span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                      Uncheck to keep this note internal (visible only to teachers and admin).
                    </p>
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button style={{ ...submitBtn, opacity: saving ? 0.6 : 1 }} type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Note'}
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
