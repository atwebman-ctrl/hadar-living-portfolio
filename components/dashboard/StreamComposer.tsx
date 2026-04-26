'use client'

// ============================================================
// components/dashboard/StreamComposer.tsx
//
// Unified entry composer — Note / Score / Photo via a single
// row. Phase 1 scaffold: only Note actually saves; Score and
// Photo render UI but log + alert. Not wired into WorkbenchView
// yet — integration lands in Phase 4.
// ============================================================

import {
  useCallback, useRef, useState,
  type CSSProperties, type JSX,
} from 'react'
import type { FeedEntry, Student, TeacherNote } from '@/lib/types'
import StudentAutocomplete from './StudentAutocomplete'
import ComposerNoteBody from './ComposerNoteBody'
import ComposerScoreBody from './ComposerScoreBody'
import ComposerPhotoBody from './ComposerPhotoBody'
import ComposerOptionsRow from './ComposerOptionsRow'

interface Props {
  students: Student[]
  onSaved:  (entry: FeedEntry) => void
}

type EntryType = 'note' | 'score' | 'photo'

// ── Inline icons ─────────────────────────────────────────────
const ICON_PROPS = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}
const PencilIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
)
const BarsIcon = () => (
  <svg {...ICON_PROPS}>
    <line x1="6"  y1="20" x2="6"  y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="18" y1="20" x2="18" y2="14" />
  </svg>
)
const CameraIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M3 7h4l2-3h6l2 3h4v12H3z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

const TYPES: { key: EntryType; label: string; Icon: () => JSX.Element }[] = [
  { key: 'note',  label: 'Note',  Icon: PencilIcon },
  { key: 'score', label: 'Score', Icon: BarsIcon },
  { key: 'photo', label: 'Photo', Icon: CameraIcon },
]

// ── Styles ───────────────────────────────────────────────────
const SHELL: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: 16,
  maxWidth: 1200,
}
const COMPOSER_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  marginBottom: 10,
}
const MAIN_ROW: CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'flex-start',
}
const TYPE_GROUP: CSSProperties = {
  display: 'inline-flex', border: '1px solid var(--rule)', borderRadius: 6,
  overflow: 'hidden', flexShrink: 0,
}
const TYPE_BTN_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 44, padding: '0 12px',
  background: 'transparent', color: 'var(--ink-mid)',
  border: 'none', borderRight: '1px solid var(--rule)',
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  cursor: 'pointer', outline: 'none',
}
const TYPE_BTN_ACTIVE: CSSProperties = {
  ...TYPE_BTN_BASE, background: 'var(--navy)', color: 'var(--white)',
}
const PICKER_WRAP: CSSProperties = { width: 200, flexShrink: 0 }
const SAVE_COL: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  flexShrink: 0,
}
const SAVE_BTN: CSSProperties = {
  height: 44, minWidth: 90, padding: '0 18px',
  background: 'var(--navy)', color: 'var(--white)', border: 'none',
  borderRadius: 6, cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
const SHORTCUT_HINT: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)',
}

// ── Component ────────────────────────────────────────────────
export default function StreamComposer({ students, onSaved }: Props) {
  const [entryType, setEntryType] = useState<EntryType>('note')
  const [selected,  setSelected]  = useState<{ id: string; name: string } | null>(null)
  const [alsoTagged, setAlsoTagged] = useState<{ id: string; name: string }[]>([])
  const [text,     setText]     = useState('')
  const [category, setCategory] = useState('general')
  const [term,     setTerm]     = useState('Spring 2026')
  const [visibleToParents, setVisibleToParents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [flash,  setFlash]  = useState(false)

  // Score state
  const [assessment, setAssessment] = useState('MAP Math')
  const [rit,        setRit]        = useState('')
  const [percentile, setPercentile] = useState('')

  // Photo state
  const [caption, setCaption] = useState('')

  const noteRef = useRef<HTMLTextAreaElement>(null)

  // ── Save: Note (only kind wired in Phase 1) ────────────────
  const saveNote = useCallback(async () => {
    if (!selected || !text.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/students/${selected.id}/teacher-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText:         text.trim(),
          sectionCategory:  category,
          visibleToParents,
          term:             term || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? 'Failed to save note.')
      }
      const note = await res.json() as TeacherNote
      onSaved({ kind: 'note', note, studentName: selected.name, savedAt: new Date().toISOString() })
      setText('')
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
      requestAnimationFrame(() => noteRef.current?.focus())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }, [selected, text, category, term, visibleToParents, onSaved])

  const saveScore = useCallback(() => {
    alert('Score save — Phase 4')
  }, [selected, assessment, rit, percentile, term])

  const savePhoto = useCallback(() => {
    alert('Photo save — Phase 4')
  }, [selected, caption, category, term])

  const handleSave = useCallback(() => {
    if (entryType === 'note')  return void saveNote()
    if (entryType === 'score') return saveScore()
    return savePhoto()
  }, [entryType, saveNote, saveScore, savePhoto])

  const onShellKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const canSave =
    !!selected && !saving &&
    (entryType !== 'note' || !!text.trim())

  const onPhotoFiles = (_files: File[]) => {
    // Phase 1 placeholder — real upload wires in Phase 4
  }

  const removeTag = (id: string) =>
    setAlsoTagged((tags) => tags.filter((t) => t.id !== id))

  const onTagAnother = () => {
    // Phase 1 placeholder — real picker wires in Phase 4
  }

  return (
    <div style={SHELL} onKeyDown={onShellKeyDown}>
      <div style={COMPOSER_LABEL}>Log an entry</div>

      <div style={MAIN_ROW}>
        {/* Type toggle */}
        <div style={TYPE_GROUP} role="tablist">
          {TYPES.map((t, i) => {
            const active = entryType === t.key
            const isLast = i === TYPES.length - 1
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                style={{
                  ...(active ? TYPE_BTN_ACTIVE : TYPE_BTN_BASE),
                  borderRight: isLast ? 'none' : '1px solid var(--rule)',
                }}
                onClick={() => setEntryType(t.key)}
              >
                <t.Icon />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Student picker */}
        <div style={PICKER_WRAP}>
          <StudentAutocomplete
            students={students}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Body */}
        {entryType === 'note' && (
          <ComposerNoteBody
            text={text} setText={setText}
            category={category} setCategory={setCategory}
            onCmdEnter={handleSave} noteRef={noteRef}
          />
        )}
        {entryType === 'score' && (
          <ComposerScoreBody
            rit={rit} setRit={setRit}
            percentile={percentile} setPercentile={setPercentile}
            onAttachPdf={() => { /* Phase 1 placeholder — real upload wires in Phase 4 */ }}
          />
        )}
        {entryType === 'photo' && (
          <ComposerPhotoBody onFilesSelected={onPhotoFiles} />
        )}

        {/* Save column */}
        <div style={SAVE_COL}>
          <button
            type="button"
            style={{
              ...SAVE_BTN,
              opacity: canSave ? 1 : 0.45,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
            disabled={!canSave}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : flash ? 'Saved ✓' : 'Save'}
          </button>
          <span style={SHORTCUT_HINT}>⌘ + Enter</span>
        </div>
      </div>

      <ComposerOptionsRow
        entryType={entryType}
        category={category} setCategory={setCategory}
        term={term} setTerm={setTerm}
        assessment={assessment} setAssessment={setAssessment}
        caption={caption} setCaption={setCaption}
        visibleToParents={visibleToParents} setVisibleToParents={setVisibleToParents}
        alsoTagged={alsoTagged} onRemoveTag={removeTag}
        onTagAnother={onTagAnother}
        onOpenBulkEntry={() => { /* Phase 4 */ }}
      />
    </div>
  )
}
