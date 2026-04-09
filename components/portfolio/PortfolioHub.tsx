'use client'

// ============================================================
// components/portfolio/PortfolioHub.tsx
//
// Hub overview: 11 section cards in a 3-column grid.
// Each card links to /portfolio/[studentId]/section/[slug].
// Bottom row: "View Full Portfolio →" link.
// ============================================================

import Link from 'next/link'
import type { PortfolioData } from '@/lib/types'

interface Props {
  portfolio:  PortfolioData
  studentId:  string
}

// ── Section card definitions ──────────────────────────────────

interface SectionCard {
  num:   number
  title: string
  slug:  string
  stat:  (p: PortfolioData) => string
}

const SECTIONS: SectionCard[] = [
  {
    num:   1,
    title: 'Intellectual Arc',
    slug:  'intellectual-arc',
    stat:  (p) => {
      const math = p.assessments.filter((a) => a.assessmentType === 'maps_math').length
      const ela  = p.assessments.filter((a) => a.assessmentType === 'maps_english').length
      return math + ela > 0 ? `${math + ela} MAP scores recorded` : 'No scores yet'
    },
  },
  {
    num:   2,
    title: 'Immersion Engine',
    slug:  'immersion-engine',
    stat:  (p) => {
      const avant = p.assessments.filter((a) => a.assessmentType.startsWith('avant')).length
      return avant > 0 ? `${avant} AVANT score${avant !== 1 ? 's' : ''} recorded` : 'No scores yet'
    },
  },
  {
    num:   3,
    title: 'The Canon',
    slug:  'the-canon',
    stat:  (p) => {
      const n = p.readings.length
      return n > 0 ? `${n} book${n !== 1 ? 's' : ''} read` : 'No readings yet'
    },
  },
  {
    num:   4,
    title: 'Creative Evolution',
    slug:  'creative-evolution',
    stat:  (p) => {
      const n = p.writingSamples.length
      return n > 0 ? `${n} writing sample${n !== 1 ? 's' : ''}` : 'No samples yet'
    },
  },
  {
    num:   5,
    title: 'Rhetoric Room',
    slug:  'rhetoric-room',
    stat:  (p) => {
      const n = p.studentVideos.length + p.videos.length
      return n > 0 ? `${n} video${n !== 1 ? 's' : ''} archived` : 'No videos yet'
    },
  },
  {
    num:   6,
    title: 'Character Arc',
    slug:  'character-arc',
    stat:  (p) => {
      const n = p.characterAwards.length
      return n > 0 ? `${n} virtue award${n !== 1 ? 's' : ''}` : 'No awards yet'
    },
  },
  {
    num:   7,
    title: 'Scope & Sequence',
    slug:  'scope-and-sequence',
    stat:  (p) => {
      const n = p.scopeAndSequence.length
      return n > 0 ? `${n} subject${n !== 1 ? 's' : ''} tracked` : 'Curriculum pending'
    },
  },
  {
    num:   8,
    title: 'Handwriting',
    slug:  'handwriting',
    stat:  (p) => {
      const n = p.handwritingSamples.length
      return n > 0 ? `${n} sample${n !== 1 ? 's' : ''} uploaded` : 'No samples yet'
    },
  },
  {
    num:   9,
    title: 'Photo Gallery',
    slug:  'photo-gallery',
    stat:  (p) => {
      const n = p.photos.length
      return n > 0 ? `${n} photo${n !== 1 ? 's' : ''}` : 'No photos yet'
    },
  },
  {
    num:   10,
    title: 'Teacher Notes',
    slug:  'teacher-notes',
    stat:  (p) => {
      const n = p.teacherNotes.length
      return n > 0 ? `${n} note${n !== 1 ? 's' : ''} from teachers` : 'No notes yet'
    },
  },
  {
    num:   11,
    title: 'Parent Uploads',
    slug:  'parent-uploads',
    stat:  (p) => {
      const n = p.parentUploads.length
      return n > 0 ? `${n} item${n !== 1 ? 's' : ''} shared` : 'No uploads yet'
    },
  },
]

// ── Component ─────────────────────────────────────────────────

export default function PortfolioHub({ portfolio, studentId }: Props) {
  return (
    <div style={{ padding: '2rem 2.5rem 3rem' }}>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '1.25rem',
      }}
        className="hub-grid"
      >
        {SECTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/portfolio/${studentId}/section/${s.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="hub-card reveal">
              <div className="hub-card-num">{String(s.num).padStart(2, '0')}</div>
              <h3 className="hub-card-title">{s.title}</h3>
              <p className="hub-card-stat">{s.stat(portfolio)}</p>
              <span className="hub-card-cta">View →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Full portfolio link */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link
          href={`/portfolio/${studentId}/full`}
          style={{
            fontFamily:     'var(--font-heading)',
            fontStyle:      'italic',
            fontSize:       '1.05rem',
            color:          'var(--navy)',
            textDecoration: 'none',
            letterSpacing:  '0.03em',
            borderBottom:   '1px solid var(--gold)',
            paddingBottom:  '2px',
            transition:     'opacity 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          View Full Portfolio →
        </Link>
      </div>

      <style>{`
        .hub-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 900px) {
          .hub-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hub-grid { grid-template-columns: 1fr; }
        }
        .hub-card {
          background:    url('/images/parchmant-paper.jpeg') center/cover no-repeat;
          border-top:    2px solid #B8A050;
          padding:       1.25rem 1.4rem 1.1rem;
          cursor:        pointer;
          transition:    transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow:    0 1px 3px rgba(0,0,0,0.06);
          min-height:    130px;
          display:       flex;
          flex-direction: column;
          gap:           0.3rem;
        }
        .hub-card:hover {
          transform:  translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .hub-card-num {
          font-family:   var(--font-mono);
          font-size:     0.6rem;
          letter-spacing: 0.12em;
          color:         var(--ink-faint);
          margin-bottom: 0.1rem;
        }
        .hub-card-title {
          font-family: var(--font-heading);
          font-size:   1.1rem;
          color:       var(--navy);
          margin:      0;
          line-height: 1.2;
        }
        .hub-card-stat {
          font-family: var(--font-body);
          font-size:   0.78rem;
          color:       var(--ink-mid);
          margin:      0.2rem 0 0;
          flex:        1;
        }
        .hub-card-cta {
          font-family:   var(--font-mono);
          font-size:     0.62rem;
          letter-spacing: 0.08em;
          color:         #B8A050;
          text-transform: uppercase;
          margin-top:    0.4rem;
        }
      `}</style>
    </div>
  )
}
