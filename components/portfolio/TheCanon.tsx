'use client'

import { useState } from 'react'
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

// ── Demo fallback data ────────────────────────────────────────

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

// ── Book cover image ──────────────────────────────────────────

function BookCoverImage({ title }: { title: string }) {
  const [failed, setFailed] = useState(false)
  const src = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`

  if (failed) {
    return (
      <div style={{
        width: 60, height: 80, flexShrink: 0,
        background: 'var(--rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
      }}>
        📖
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={60}
      height={80}
      onError={() => setFailed(true)}
      style={{ width: 60, height: 80, objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  )
}

// ── Book detail panel ─────────────────────────────────────────

function BookDetail({ reading, spineColor }: { reading: Reading; spineColor: string }) {
  return (
    <div style={{
      borderLeft:   `3px solid ${spineColor}`,
      background:   'var(--cream)',
      borderTop:    '1px solid var(--rule)',
      borderRight:  '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
      padding:      '1.1rem 1.4rem',
      marginTop:    '1rem',
      display:      'flex',
      gap:          '1.25rem',
      alignItems:   'flex-start',
    }}>
      <BookCoverImage title={reading.title} />
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap:                 '0.75rem 1.5rem',
        flex:                1,
      }}>
        {reading.author && (
          <DetailField label="Author" value={reading.author} />
        )}
        <DetailField label="Academic Year" value={reading.academicYear} />
        <DetailField
          label="Status"
          value={reading.completed ? 'Completed' : 'In Progress'}
          valueStyle={{ color: reading.completed ? '#2E4A3B' : '#8B4A2D' }}
        />
        {reading.pageCount != null && (
          <DetailField label="Pages" value={String(reading.pageCount)} />
        )}
        {reading.whyChosen && (
          <DetailField label="Why Chosen" value={reading.whyChosen} wide />
        )}
        {reading.valuesSkills && (
          <DetailField label="Values & Skills" value={reading.valuesSkills} wide />
        )}
      </div>
    </div>
  )
}

function DetailField({
  label,
  value,
  wide,
  valueStyle,
}: {
  label: string
  value: string
  wide?: boolean
  valueStyle?: React.CSSProperties
}) {
  return (
    <div style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '0.58rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'var(--ink-faint)',
        marginBottom:  '0.2rem',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:  'var(--font-body)',
        fontSize:    '0.82rem',
        color:       'var(--ink-dark)',
        lineHeight:  1.45,
        ...valueStyle,
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function TheCanon({ readings, studentId, studentName, role, existingDraft }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

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

  const openReading = hasData && openId
    ? readings!.find((r) => r.id === openId) ?? null
    : null

  const openIndex = hasData && openId
    ? readings!.findIndex((r) => r.id === openId)
    : -1

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
            const palette  = SPINE_PALETTE[i % SPINE_PALETTE.length]
            const h        = SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]
            const readingId = hasData ? readings![i]?.id : null
            const isOpen   = readingId !== null && openId === readingId
            return (
              <div
                key={`${b.title}-${i}`}
                className={`book ${b.done ? 'done' : 'pending'}`}
                style={{
                  background: palette.color,
                  color:      palette.text,
                  height:     h,
                  width:      36,
                  cursor:     hasData ? 'pointer' : 'default',
                  outline:    isOpen ? `2px solid #B8A050` : 'none',
                  outlineOffset: '2px',
                  transition: 'outline 0.15s ease, opacity 0.15s ease',
                }}
                onClick={() => {
                  if (!readingId) return
                  setOpenId(openId === readingId ? null : readingId)
                }}
                title={hasData ? `${b.title} — click for details` : undefined}
                role={hasData ? 'button' : undefined}
                aria-expanded={isOpen}
              >
                <span className="book-title">{b.title}</span>
                <span className="book-done">{b.done ? '\u2713' : '\u2026'}</span>
              </div>
            )
          })}
        </div>

        {/* Accordion detail panel */}
        {openReading && openIndex >= 0 && (
          <BookDetail
            reading={openReading}
            spineColor={SPINE_PALETTE[openIndex % SPINE_PALETTE.length].color}
          />
        )}
      </div>

      <div style={{ marginTop: '1rem', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        {hasData
          ? 'Click a spine to see details\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming'
          : 'Hover to browse\u00a0·\u00a0Faded spine\u00a0=\u00a0upcoming'}
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
