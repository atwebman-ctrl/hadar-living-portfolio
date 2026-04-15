import type { TeacherNote, UserRole } from '@/lib/types'
import InlineTeacherNoteForm from './InlineTeacherNoteForm'
import s from './sections.module.css'

interface Props {
  notes?:     TeacherNote[]
  role?:      UserRole
  studentId?: string
}

// Maps section_category / legacy section_type values to display labels.
// ⚠️ Keys are DB-stored enum values — do NOT rename. Values are UI display labels.
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

const DEMO_NOTES: TeacherNote[] = [
  {
    id: '1', schoolId: '', studentId: '',
    sectionType: 'academic_scores' as never, sectionCategory: 'intellectual_arc',
    authorName: 'Mrs. Sarah Klein', term: null, highlightQuote: 'Her MAPS growth of 14 RIT points places her in the top 2% nationally for third-grade progress.',
    visibleToParents: true, createdAt: '',
    text: 'Athena continues to demonstrate exceptional mathematical intuition, particularly in pattern recognition. Her MAPS growth of 14 RIT points this year places her in the top 2% nationally for third-grade progress. She benefits most from open-ended challenge problems.',
  },
  {
    id: '2', schoolId: '', studentId: '',
    sectionType: 'writing' as never, sectionCategory: 'creative_evolution',
    authorName: 'Mr. David Ofer', term: null, highlightQuote: null,
    visibleToParents: true, createdAt: '',
    text: 'The voice in Athena\'s writing is unusually mature and consistent. She has moved from narrating events to exploring motivation and consequence — a hallmark of a developing literary mind.',
  },
  {
    id: '3', schoolId: '', studentId: '',
    sectionType: 'virtue_badges' as never, sectionCategory: 'character_arc',
    authorName: 'Mrs. Rachel Stern', term: null, highlightQuote: null,
    visibleToParents: false, createdAt: '',
    text: 'Internal note: Athena is being considered for the Ometz leadership cohort next year. This is a preliminary observation — not yet shared with the family.',
  },
]

export default function TeacherNotes({ notes, role, studentId }: Props) {
  const isDemo   = !studentId
  const hasData  = !!notes && notes.length > 0
  const canEdit  = (role === 'admin' || role === 'teacher') && !!studentId
  const isParent = role === 'parent'

  // Demo route: no studentId → show sample notes.
  // Real route with no notes yet → show empty state (not demo data).
  const allNotes = isDemo ? DEMO_NOTES : (notes ?? [])

  // Parents only see notes marked visible_to_parents = true
  const visibleNotes = isParent
    ? allNotes.filter((n) => n.visibleToParents)
    : allNotes

  const items = visibleNotes.map((n) => ({
    id:               n.id,
    section:          SECTION_LABELS[n.sectionCategory] ?? SECTION_LABELS[n.sectionType] ?? n.sectionCategory,
    author:           n.authorName,
    text:             n.text,
    highlightQuote:   n.highlightQuote,
    visibleToParents: n.visibleToParents,
    date:             n.createdAt
      ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null,
    term: n.term ?? null,
  }))

  return (
    <section id="teacher-notes">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>10</span>
        <h2 className={s.sectionTitle}>Teacher Narratives</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${items.length} teacher narrative${items.length !== 1 ? 's' : ''} — section-by-section observations from the instructional team.`
          : isDemo
            ? 'Three teacher narratives — qualitative observations from the instructional team, written for parents and the lasting record.'
            : null}
      </p>

      {!isDemo && !hasData ? (
        <p className="reveal" style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink-faint)', fontStyle: 'italic', margin: '0 0 1.5rem' }}>
          No teacher narratives yet.
        </p>
      ) : (
      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.map((n) => (
          <blockquote key={n.id} style={{ margin: 0, background: 'var(--parchment)', border: '1px solid var(--rule)', borderLeft: '3px solid var(--gold)', padding: '1.25rem 1.5rem' }}>
            {/* Header row: section label + internal badge + date/term */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  {n.section}
                </span>
                {!n.visibleToParents && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.5rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream)', background: 'var(--navy)', padding: '1px 5px' }}>
                    Internal
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                {n.term && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', color: 'var(--ink-faint)' }}>
                    {n.term}
                  </span>
                )}
                {n.date && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', color: 'var(--ink-faint)' }}>
                    {n.date}
                  </span>
                )}
              </div>
            </div>

            {/* Highlight pull quote */}
            {n.highlightQuote && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.6, margin: '0 0 .75rem', fontStyle: 'italic', borderLeft: 'none' }}>
                &ldquo;{n.highlightQuote}&rdquo;
              </p>
            )}

            {/* Full note body */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.9rem', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 .75rem', fontStyle: n.highlightQuote ? 'normal' : 'italic' }}>
              {n.highlightQuote ? n.text : <>&ldquo;{n.text}&rdquo;</>}
            </p>

            <footer style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
              — {n.author}
            </footer>
          </blockquote>
        ))}
      </div>
      )}

      {canEdit && <InlineTeacherNoteForm studentId={studentId!} />}
    </section>
  )
}
