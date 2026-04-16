'use client'

// ============================================================
// components/dashboard/QuickNotesMode.tsx
//
// Stream-style note entry for the Teacher Workbench.
// Student autocomplete → textarea → category → save.
// Saved notes accumulate in a session feed below the input.
// ============================================================

import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { Student, TeacherNote } from '@/lib/types'
import StudentAutocomplete from './StudentAutocomplete'

interface Props { students: Student[] }

const CATEGORIES = [
  { value: 'general',            label: 'Auto' },
  { value: 'intellectual_arc',   label: 'Math' },
  { value: 'english',            label: 'English' },
  { value: 'immersion_engine',   label: 'Hebrew' },
  { value: 'the_canon',          label: 'The Canon' },
  { value: 'creative_evolution', label: 'Composition' },
  { value: 'character_arc',      label: 'Soulcraft' },
] as const

// Map DB section_category → portfolio tab slug for "View in portfolio" links
function categoryToTab(cat: string): string {
  switch (cat) {
    case 'intellectual_arc': return 'math'
    case 'english':          return 'english'
    case 'immersion_engine': return 'hebrew'
    case 'the_canon':        return 'the-canon'
    case 'creative_evolution': return 'composition'
    case 'character_arc':    return 'soulcraft'
    default:                 return 'the-canon'
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60)  return `${mins} min ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ── Styles ────────────────────────────────────────────────────

const ROW: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
}

const INPUT: CSSProperties = {
  border: '1px solid var(--rule)', borderRadius: 6,
  padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)',
  color: 'var(--ink)', background: 'var(--white)', boxSizing: 'border-box' as const,
}

const NOTE_INPUT: CSSProperties = {
  ...INPUT, flex: 1, minHeight: 44, resize: 'vertical' as const,
  lineHeight: '1.5',
}

const CAT_SELECT: CSSProperties = {
  ...INPUT, width: 130, fontFamily: 'var(--font-mono)', fontSize: 12,
  letterSpacing: '0.06em', minHeight: 44,
}

const SAVE_BTN: CSSProperties = {
  minWidth: 80, minHeight: 44, padding: '10px 20px',
  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, background: 'var(--navy)',
  color: 'var(--cream)', border: 'none', borderRadius: 6, cursor: 'pointer',
}

const FEED_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
  margin: '2rem 0 0.75rem',
}

const FEED_ROW: CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 12px',
  borderBottom: '1px solid var(--rule)', borderLeft: '3px solid var(--gold)',
  fontSize: 13,
}

const BADGE: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
  background: 'var(--cream)', border: '1px solid var(--rule)',
  padding: '1px 6px', borderRadius: 3, whiteSpace: 'nowrap' as const,
}

const EMPTY: CSSProperties = {
  fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13,
  color: 'var(--ink-faint)', padding: '2rem 0',
}

// ── Saved note with timestamp for local feed ─────────────────

interface FeedNote {
  note:        TeacherNote
  studentName: string
  savedAt:     string // ISO timestamp
}

// ── Component ─────────────────────────────────────────────────

export default function QuickNotesMode({ students }: Props) {
  const [selected,  setSelected]  = useState<{ id: string; name: string } | null>(null)
  const [text,      setText]      = useState('')
  const [category,  setCategory]  = useState('general')
  const [saving,    setSaving]    = useState(false)
  const [flash,     setFlash]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [feed,      setFeed]      = useState<FeedNote[]>([])
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const handleSave = useCallback(async () => {
    if (!selected || !text.trim()) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/students/${selected.id}/teacher-notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText:         text.trim(),
          sectionCategory:  category,
          visibleToParents: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? 'Failed to save note.')
      }
      const note = await res.json() as TeacherNote
      setFeed((f) => [{ note, studentName: selected.name, savedAt: new Date().toISOString() }, ...f])
      setText('')
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
      requestAnimationFrame(() => noteRef.current?.focus())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }, [selected, text, category])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSave() }
  }

  const canSave = !!selected && !!text.trim() && !saving

  const catLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val

  return (
    <div>
      {/* ── Input group ── */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', borderRadius: 8, padding: 16 }}>
      {/* ── Primary input row ── */}
      <div style={ROW}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <StudentAutocomplete
            students={students}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <textarea
          ref={noteRef}
          style={NOTE_INPUT}
          placeholder="What did you notice about this student today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />

        <select
          style={CAT_SELECT}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {/* TODO: "Auto" mode will use Claude to auto-categorize — for now defaults to general */}
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <button
          type="button"
          style={{ ...SAVE_BTN, opacity: canSave ? 1 : 0.45 }}
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : flash ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: '#991b1b', marginTop: 8 }}>{error}</div>}

      {/* ── Dimmed second row hint ── */}
      <div style={{ ...ROW, opacity: 0.4, marginTop: 8, pointerEvents: 'none' }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ ...INPUT, width: '100%', color: 'var(--ink-faint)' }}>Student…</div>
        </div>
        <div style={{ ...NOTE_INPUT, color: 'var(--ink-faint)' }}>Next observation…</div>
      </div>
      </div>{/* close input group */}

      {/* ── Feed ── */}
      <div style={FEED_LABEL}>Saved today</div>

      {feed.length === 0 ? (
        <div style={EMPTY}>No notes yet today. Start logging observations above.</div>
      ) : (
        <div>
          {feed.map((f, i) => (
            <div key={f.note.id ?? i} style={FEED_ROW}>
              <span style={{ fontWeight: 600, color: 'var(--navy)', minWidth: 100, flexShrink: 0 }}>
                {f.studentName}
              </span>
              <span style={{ flex: 1, color: 'var(--ink)' }}>{f.note.text}</span>
              <span style={BADGE}>{catLabel(f.note.sectionCategory)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                {timeAgo(f.savedAt)}
              </span>
              <a
                href={`/portfolio/${f.note.studentId}/group/portfolio?tab=${categoryToTab(f.note.sectionCategory)}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                View →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
