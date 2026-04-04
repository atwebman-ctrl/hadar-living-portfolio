import type { Reading } from '@/lib/types'

interface Props {
  readings?: Reading[]
}

// Same palette as TheCanon — kept in sync intentionally
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
const SPINE_HEIGHTS = [160, 150, 155, 148, 158, 144, 152, 162, 156, 145]

// Demo fallback — includes rich metadata shown in the enhanced view
const DEMO_BOOKS: Array<{ title: string; author: string; done: boolean; why: string | null }> = [
  { title: 'Alice in Wonderland',         author: 'Lewis Carroll',      done: true,  why: 'Explores logic, language, and imagination — core to our rhetoric curriculum.' },
  { title: "Grimm's Fairy Tales",         author: 'Brothers Grimm',     done: true,  why: 'Moral structure and archetype study; pairs with character development.' },
  { title: 'Black Beauty',                author: 'Anna Sewell',        done: true,  why: 'Empathy and perspective-taking through animal narration.' },
  { title: 'The Snow Queen',              author: 'Hans Christian Andersen', done: true, why: null },
  { title: 'Charlie & the Choc. Factory', author: 'Roald Dahl',        done: true,  why: 'Virtue and consequence — a modern fable.' },
  { title: 'The Jungle Book',             author: 'Rudyard Kipling',    done: true,  why: null },
  { title: 'Homer Price',                 author: 'Robert McCloskey',   done: true,  why: null },
  { title: 'Tales from Shakespeare',      author: 'Charles & Mary Lamb',done: true,  why: 'Foundation for rhetoric and dramatic analysis in upper grades.' },
  { title: 'Aladdin & Arabian Nights',    author: 'Anon.',              done: true,  why: null },
  { title: 'Guns for Gen. Washington',    author: 'S. Reit',            done: false, why: null },
]

export default function BookshelfAnimation({ readings }: Props) {
  const hasData = !!readings && readings.length > 0

  const books = hasData
    ? readings!.map((r) => ({ title: r.title, author: r.author ?? '', done: r.completed, why: r.whyChosen }))
    : DEMO_BOOKS

  const completedCount = books.filter((b) => b.done).length

  const description = hasData
    ? `${completedCount} of ${books.length} title${books.length !== 1 ? 's' : ''} completed — hover a spine for context.`
    : `Athena's Grade 3 reading list — ${completedCount} of ${books.length} titles completed. Hover a spine for selection notes.`

  return (
    <section id="bookshelf-anim">
      <div className="section-header reveal">
        <span className="section-num">12</span>
        <h2 className="section-title">Bookshelf</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {description}
      </p>

      {/* Enhanced bookshelf with tooltip-style metadata on hover */}
      <div className="bookshelf reveal">
        <div className="books-row">
          {books.map((b, i) => {
            const palette = SPINE_PALETTE[i % SPINE_PALETTE.length]
            const h       = SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]
            return (
              <div
                key={`${b.title}-${i}`}
                className={`book ${b.done ? 'done' : 'pending'}`}
                style={{ background: palette.color, color: palette.text, height: h, width: 36, position: 'relative' }}
                title={b.author ? `${b.title} — ${b.author}${b.why ? `\n\n${b.why}` : ''}` : b.title}
              >
                <span className="book-title">{b.title}</span>
                <span className="book-done">{b.done ? '✓' : '…'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metadata list — shown below the shelf */}
      <div className="reveal" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {books.filter((b) => b.why).map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.65rem', letterSpacing: '.06em', color: 'var(--gold)', flexShrink: 0, minWidth: '14rem' }}>
              {b.title}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--ink-light)', lineHeight: 1.5 }}>
              {b.why}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        Hover a spine for author · Faded spine = upcoming
      </div>
    </section>
  )
}
