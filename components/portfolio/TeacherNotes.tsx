import type { TeacherNote, UserRole } from '@/lib/types'
import InlineTeacherNoteForm from './InlineTeacherNoteForm'

interface Props {
  notes?:     TeacherNote[]
  role?:      UserRole
  studentId?: string
}

// Maps section_type / category strings to display labels.
// Covers both legacy SectionType values and new category values
// added by InlineTeacherNoteForm.
const SECTION_LABELS: Record<string, string> = {
  // Legacy section types (pre-existing teacher notes)
  academic_scores:    'Intellectual Arc',
  reading_bookshelf:  'The Canon',
  writing:            'Creative Evolution',
  rhetoric:           'Rhetoric Room',
  virtue_badges:      'Character Arc',
  handwriting:        'Handwriting',
  scope_sequence:     'Scope & Sequence',
  // Inline form categories (0-indexed teacher note categories)
  academic_progress:  'Academic Progress',
  social_development: 'Social Development',
  behavioral:         'Behavioral',
  participation:      'Participation',
  general:            'General',
}

const DEMO_NOTES: Array<{ id: string; section: string; author: string; text: string }> = [
  {
    id: '1',
    section: 'academic_scores',
    author: 'Mrs. Sarah Klein',
    text: 'Athena continues to demonstrate exceptional mathematical intuition, particularly in pattern recognition. Her MAPS growth of 14 RIT points this year places her in the top 2% nationally for third-grade progress. She benefits most from open-ended challenge problems.',
  },
  {
    id: '2',
    section: 'writing',
    author: 'Mr. David Ofer',
    text: 'The voice in Athena\'s writing is unusually mature and consistent. She has moved from narrating events to exploring motivation and consequence — a hallmark of a developing literary mind. Her Hebrew composition is equally impressive, showing transfer of craft across languages.',
  },
  {
    id: '3',
    section: 'virtue_badges',
    author: 'Mrs. Rachel Stern',
    text: 'Ometz — courage — is not merely an award for Athena; it is a lived practice. She consistently volunteers to present first, advocates for quieter classmates, and accepts correction with genuine grace.',
  },
]

export default function TeacherNotes({ notes, role, studentId }: Props) {
  const hasData = !!notes && notes.length > 0
  const canEdit = (role === 'admin' || role === 'teacher') && !!studentId

  const items = hasData
    ? notes!.map((n) => ({
        id:      n.id,
        section: SECTION_LABELS[n.sectionType] ?? n.sectionType,
        author:  n.authorName,
        text:    n.text,
        date:    new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      }))
    : DEMO_NOTES.map((n) => ({
        id:      n.id,
        section: SECTION_LABELS[n.section] ?? n.section,
        author:  n.author,
        text:    n.text,
        date:    null as string | null,
      }))

  return (
    <section id="teacher-notes">
      <div className="section-header reveal">
        <span className="section-num">10</span>
        <h2 className="section-title">Teacher Narratives</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {hasData
          ? `${items.length} teacher narrative${items.length !== 1 ? 's' : ''} — section-by-section observations from the instructional team.`
          : 'Three teacher narratives — qualitative observations from the instructional team, written for parents and the lasting record.'}
      </p>

      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.map((n) => (
          <blockquote key={n.id} style={{ margin: 0, background: 'var(--parchment)', border: '1px solid var(--rule)', borderLeft: '3px solid var(--gold)', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {n.section}
              </span>
              {n.date && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.08em', color: 'var(--ink-faint)' }}>
                  {n.date}
                </span>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '.95rem', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 .75rem', fontStyle: 'italic' }}>
              &ldquo;{n.text}&rdquo;
            </p>
            <footer style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
              — {n.author}
            </footer>
          </blockquote>
        ))}
      </div>

      {canEdit && <InlineTeacherNoteForm studentId={studentId!} />}
    </section>
  )
}
