'use client'

import { useState, useMemo } from 'react'
import type { TeacherNote, UserRole } from '@/lib/types'
import groupStyles from '@/components/portfolio/GroupDetail.module.css'
import s from './sections.module.css'

interface Props {
  notes:      TeacherNote[]
  role:       UserRole
  studentId?: string
}

// ⚠️ Keys are DB-stored enum values — do NOT rename. Values are UI display labels.
// Copied from TeacherNotes.tsx so the two stay in lockstep until TeacherNotes is retired.
const SECTION_LABELS: Record<string, string> = {
  // New section_category values
  intellectual_arc:   'Math',
  immersion_engine:   'Hebrew',
  the_canon:          'The Canon',
  creative_evolution: 'Composition',
  rhetoric_room:      'Rhetoric Room',
  character_arc:      'Soulcraft',
  general:            'General',
  // Legacy section_type values (pre-migration notes)
  academic_scores:    'Math',
  reading_bookshelf:  'The Canon',
  writing:            'Composition',
  rhetoric:           'Rhetoric Room',
  virtue_badges:      'Soulcraft',
  handwriting:        'Handwriting',
  scope_sequence:     'Knowledge',
  academic_progress:  'Academic Progress',
  social_development: 'Social Development',
  behavioral:         'Behavioral',
  participation:      'Participation',
}

const ALL_SECTIONS = '__all__' as const
type FilterValue = typeof ALL_SECTIONS | string

// Map a note's sectionCategory to the tab slug used by /group/portfolio?tab=...
// Returns null when the category has no matching tab (inert link).
const CATEGORY_TO_TAB: Record<string, string> = {
  intellectual_arc:   'math',
  immersion_engine:   'hebrew',
  the_canon:          'the-canon',
  creative_evolution: 'composition',
  character_arc:      'soulcraft',
  math:               'math',
  english:            'english',
  hebrew:             'hebrew',
  composition:        'composition',
  soulcraft:          'soulcraft',
}

function tabSlugFor(n: TeacherNote): string | null {
  return CATEGORY_TO_TAB[n.sectionCategory] ?? null
}

// ── Helpers ───────────────────────────────────────────────────

function noteSection(n: TeacherNote): string {
  return SECTION_LABELS[n.sectionCategory] ?? SECTION_LABELS[n.sectionType] ?? n.sectionCategory
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function sortByDateDesc(notes: TeacherNote[]): TeacherNote[] {
  return [...notes].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

// ── Sub-components ────────────────────────────────────────────

function NoteCard({ note, studentId }: { note: TeacherNote; studentId?: string }) {
  const section = noteSection(note)
  const date    = formatDate(note.createdAt)
  const tab     = tabSlugFor(note)
  const anchor  = note.sectionAnchor ?? null
  const href    = (studentId && tab && anchor)
    ? `/portfolio/${studentId}/group/portfolio?tab=${tab}#${anchor}`
    : null
  return (
    <blockquote style={{ margin: 0, background: 'var(--parchment)', border: '1px solid var(--rule)', borderLeft: '3px solid var(--gold)', padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--gold)',
            border: '1px solid var(--gold)', padding: '2px 7px',
          }}>
            {section}
          </span>
          {!note.visibleToParents && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.5rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream)', background: 'var(--navy)', padding: '1px 5px' }}>
              Internal
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
          {note.term && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', color: 'var(--ink-faint)' }}>
              {note.term}
            </span>
          )}
          {date && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', color: 'var(--ink-faint)' }}>
              {date}
            </span>
          )}
        </div>
      </div>

      {note.highlightQuote && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.6, margin: '0 0 .75rem', fontStyle: 'italic' }}>
          &ldquo;{note.highlightQuote}&rdquo;
        </p>
      )}

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 .75rem', fontStyle: note.highlightQuote ? 'normal' : 'italic' }}>
        {note.highlightQuote ? note.text : <>&ldquo;{note.text}&rdquo;</>}
      </p>

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
          — {note.authorName}
        </span>
        {href ? (
          <a
            href={href}
            style={{ fontSize: 12, color: 'var(--ink-light)', textDecoration: 'none' }}
          >
            View in context →
          </a>
        ) : (
          <span
            aria-disabled="true"
            style={{ fontSize: 12, color: 'var(--ink-faint)', cursor: 'default' }}
          >
            View in context →
          </span>
        )}
      </footer>
    </blockquote>
  )
}

function SectionGroup({ label, notes, studentId }: { label: string; notes: TeacherNote[]; studentId?: string }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        paddingBottom: '0.4rem', marginBottom: '1rem',
        borderBottom: '1px solid var(--rule)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--navy)', margin: 0 }}>{label}</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {notes.map((n) => <NoteCard key={n.id} note={n} studentId={studentId} />)}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function TeacherJournal({ notes, role, studentId }: Props) {
  const [filter, setFilter] = useState<FilterValue>(ALL_SECTIONS)

  // Parents only see notes marked visible_to_parents = true
  const visibleNotes = useMemo(
    () => (role === 'parent' ? notes.filter((n) => n.visibleToParents) : notes),
    [notes, role],
  )

  // Unique section labels present in the visible notes, alphabetized for stable pill order.
  const availableSections = useMemo(
    () => [...new Set(visibleNotes.map(noteSection))].sort((a, b) => a.localeCompare(b)),
    [visibleNotes],
  )

  const filteredNotes = filter === ALL_SECTIONS
    ? visibleNotes
    : visibleNotes.filter((n) => noteSection(n) === filter)
  const sorted = sortByDateDesc(filteredNotes)

  // Group by section when viewing "all"; flat list otherwise.
  const grouped = useMemo(() => {
    if (filter !== ALL_SECTIONS) return null
    const map = new Map<string, TeacherNote[]>()
    for (const n of sorted) {
      const key = noteSection(n)
      const list = map.get(key) ?? []
      list.push(n)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [sorted, filter])

  return (
    <section id="teacher-journal">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>10</span>
        <h2 className={s.sectionTitle}>Teacher journal</h2>
        <div className={s.sectionRule} />
      </div>

      {/* ── Filter pills ─────────────────────────────────────── */}
      <div className={groupStyles.groupTabBar} style={{ marginBottom: '1.5rem' }}>
        <button
          className={`${groupStyles.groupTab}${filter === ALL_SECTIONS ? ` ${groupStyles.groupTabActive}` : ''}`}
          onClick={() => setFilter(ALL_SECTIONS)}
        >
          All sections
        </button>
        {availableSections.map((label) => (
          <button
            key={label}
            className={`${groupStyles.groupTab}${filter === label ? ` ${groupStyles.groupTabActive}` : ''}`}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Empty state / notes list ─────────────────────────── */}
      {visibleNotes.length === 0 ? (
        <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', fontStyle: 'italic', maxWidth: 560 }}>
          No teacher notes yet. Teachers can add notes inline throughout the portfolio — they&rsquo;ll appear here automatically.
        </p>
      ) : sorted.length === 0 ? (
        <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
          No notes in {filter}.
        </p>
      ) : grouped ? (
        <div className="reveal">
          {grouped.map(([label, list]) => (
            <SectionGroup key={label} label={label} notes={list} studentId={studentId} />
          ))}
        </div>
      ) : (
        <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sorted.map((n) => <NoteCard key={n.id} note={n} studentId={studentId} />)}
        </div>
      )}
    </section>
  )
}
