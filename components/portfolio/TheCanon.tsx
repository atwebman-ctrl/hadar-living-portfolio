const books = [
  { title: 'Alice in Wonderland',           done: true,  color: '#1B3A6B', text: '#E8EDF5', h: 160 },
  { title: "Grimm's Fairy Tales",           done: true,  color: '#8B4A2D', text: '#F5EDE8', h: 150 },
  { title: 'Black Beauty',                  done: true,  color: '#2E4A3B', text: '#E8F0EC', h: 155 },
  { title: 'The Snow Queen',               done: true,  color: '#5E7FA0', text: '#EBF0F5', h: 148 },
  { title: 'Charlie & the Choc. Factory',  done: true,  color: '#7B5EA0', text: '#F0EBF5', h: 158 },
  { title: 'The Jungle Book',              done: true,  color: '#4A7A5E', text: '#E8F2ED', h: 144 },
  { title: 'Homer Price',                  done: true,  color: '#A07B3E', text: '#F5EEE0', h: 152 },
  { title: 'Tales from Shakespeare',       done: true,  color: '#6B2D2D', text: '#F5E8E8', h: 162 },
  { title: 'Aladdin & Arabian Nights',     done: true,  color: '#4A6B8A', text: '#E8EFF5', h: 156 },
  { title: 'Guns for Gen. Washington',     done: false, color: '#8A8074', text: '#F5F3F0', h: 145 },
]

export default function TheCanon() {
  return (
    <section id="canon">
      <div className="section-header reveal">
        <span className="section-num">03</span>
        <h2 className="section-title">The Canon</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        Athena&apos;s Grade 3 reading list. Nine of ten titles completed — from Lewis Carroll to
        Charles and Mary Lamb&apos;s Tales from Shakespeare.
      </p>

      <div className="bookshelf reveal">
        <div className="books-row">
          {books.map((b) => (
            <div
              key={b.title}
              className={`book ${b.done ? 'done' : 'pending'}`}
              style={{ background: b.color, color: b.text, height: b.h, width: 36 }}
            >
              <span className="book-title">{b.title}</span>
              <span className="book-done">{b.done ? '✓' : '…'}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        Hover to browse · Faded spine = upcoming
      </div>
    </section>
  )
}
