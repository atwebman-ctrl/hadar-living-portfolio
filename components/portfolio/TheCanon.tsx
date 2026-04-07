import type { Reading, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import InlineReadingForm from '@/components/portfolio/InlineReadingForm'

interface Props {
  readings?:      Reading[]
  studentId?:     string
  studentName?:   string
  role?:          UserRole
  existingDraft?: AiDraft
}

// Cycled palette — same colours as the demo spines, in order
const SPINE_PALETTE = [
  { color: '#1B3A6B', text: '#E8EDF5' },
  { color: '#8B4A2D', text: '#F5EDE8' },
  { color: '#2E4A3B', text: '#E8F0EC' },
  { color: '#5E7FA0', text: '#EBF0F5' },
  { color: '#7B5EA0', text: '#F0EBF5' },
  { color: '#4A7A5E', text: '#E8F2ED' },
  { color: '#A07B3E', text: '#F5EEE0' },
  { color: '#6B2D2D', text: '#F5E8E8' },
  { color: '#4A6B8A', text: '#E8EFF5' },
  { color: '#8A8074', text: '#F5F3F0' },
]

// Heights alternate slightly so the shelf looks natural
const SPINE_HEIGHTS = [160, 150, 155, 148, 158, 144, 152, 162, 156, 145]

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_BOOKS = [
  { title: 'Alice in Wonderland',          done: true  },
  { title: "Grimm's Fairy Tales",          done: true  },
  { title: 'Black Beauty',                 done: true  },
  { title: 'The Snow Queen',               done: true  },
  { title: 'Charlie & the Choc. Factory',  done: true  },
  { title: 'The Jungle Book',              done: true  },
  { title: 'Homer Price',                  done: true  },
  { title: 'Tales from Shakespeare',       done: true  },
  { title: 'Aladdin & Arabian Nights',     done: true  },
  { title: 'Guns for Gen. Washington',     done: false },
]

function buildDraftContext(readings: Reading[], studentFirstName: string | null): Record<string, unknown> {
  return {
    studentFirstName,
    completedCount: readings.filter((r) => r.completed).length,
    totalCount: readings.length,
    books: readings.map((r) => ({
      title: r.title,
      author: r.author,
      completed: r.completed,
      whyChosen: r.whyChosen,
    })),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TheCanon({ readings, studentId, studentName, role, existingDraft }: Props) {
  const hasData = !!readings && readings.length > 0

  const books = hasData
    ? readings!.map((r) => ({ title: r.title, done: r.completed }))
    : DEMO_BOOKS

  const completedCount = books.filter((b) => b.done).length
  const description = hasData
    ? `${completedCount} of ${books.length} title${books.length !== 1 ? 's' : ''} completed.`
    : "Athena\u2019s Grade 3 reading list. Nine of ten titles completed \u2014 from Lewis Carroll to Charles and Mary Lamb\u2019s Tales from Shakespeare."

  const draftContext = (studentId && role && role !== 'parent' && hasData)
    ? buildDraftContext(readings!, studentName ?? null)
    : null

  return (
    <section id="canon">
      <div className="section-header reveal">
        <span className="section-num">03</span>
        <h2 className="section-title">The Canon</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {description}
      </p>

      <div className="bookshelf reveal">
        <div className="books-row">
          {books.map((b, i) => {
            const palette = SPINE_PALETTE[i % SPINE_PALETTE.length]
            const h = SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]
            return (
              <div
                key={`${b.title}-${i}`}
                className={`book ${b.done ? 'done' : 'pending'}`}
                style={{ background: palette.color, color: palette.text, height: h, width: 36 }}
              >
                <span className="book-title">{b.title}</span>
                <span className="book-done">{b.done ? '\u2713' : '\u2026'}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        Hover to browse\u00a0·\u00a0Faded spine = upcoming
      </div>

      {/* AI narrative panel */}
      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="reading_bookshelf"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}

      {/* Inline data entry for admin/teacher */}
      {studentId && role && role !== 'parent' && (
        <InlineReadingForm studentId={studentId} />
      )}
    </section>
  )
}
