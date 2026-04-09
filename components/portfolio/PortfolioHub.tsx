'use client'

// ============================================================
// components/portfolio/PortfolioHub.tsx
//
// Hub overview: 11 section cards in a 3-column grid.
// Each card links to /portfolio/[studentId]/section/[slug].
// CSS lives in portfolio.css (.hub-card, .hub-grid, etc.).
// ============================================================

import Link from 'next/link'
import type { PortfolioData, Assessment } from '@/lib/types'

interface Props {
  portfolio:    PortfolioData
  studentId:    string
  selectedYear: string
}

// ── Helpers ───────────────────────────────────────────────────

function latestA(assessments: Assessment[], type: string): Assessment | null {
  return assessments
    .filter((a) => a.assessmentType === type)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0] ?? null
}

function ord(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ── Section card definitions ──────────────────────────────────

interface CardResult { text: string; hasData: boolean; thumbUrl?: string }

interface CardDef {
  num:   number
  title: string
  slug:  string
  cta:   string
  build: (p: PortfolioData) => CardResult
}

const SECTIONS: CardDef[] = [
  { num: 1, title: 'Intellectual Arc',   slug: 'intellectual-arc',   cta: 'See scores',
    build: (p) => {
      const m = latestA(p.assessments, 'maps_math'), e = latestA(p.assessments, 'maps_english')
      if (!m && !e) return { text: '', hasData: false }
      const fmt = (a: Assessment | null) => a?.percentile != null ? ord(Math.round(a.percentile)) : '—'
      return { text: `Math: ${fmt(m)} · English: ${fmt(e)}`, hasData: true }
    } },
  { num: 2, title: 'Immersion Engine',   slug: 'immersion-engine',   cta: 'See scores',
    build: (p) => {
      const scores = (['avant_speaking','avant_reading','avant_listening','avant_writing'] as const)
        .map((t) => latestA(p.assessments, t)).filter((a): a is Assessment => a?.score != null).map((a) => a.score!)
      if (!scores.length) return { text: '', hasData: false }
      return { text: `Hebrew: ${(scores.reduce((s,n) => s+n,0)/scores.length).toFixed(2)} composite`, hasData: true }
    } },
  { num: 3, title: 'The Canon',          slug: 'the-canon',          cta: 'See books',
    build: (p) => {
      if (!p.readings.length) return { text: '', hasData: false }
      const latest = [...p.readings].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
      return { text: `${p.readings.length} book${p.readings.length !== 1 ? 's' : ''} · latest: ${latest.title}`, hasData: true }
    } },
  { num: 4, title: 'Creative Evolution', slug: 'creative-evolution', cta: 'See writing',
    build: (p) => {
      if (!p.writingSamples.length) return { text: '', hasData: false }
      const latest = [...p.writingSamples].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
      return { text: `${p.writingSamples.length} sample${p.writingSamples.length !== 1 ? 's' : ''} · latest: ${latest.title}`, hasData: true }
    } },
  { num: 5, title: 'Rhetoric Room',      slug: 'rhetoric-room',      cta: 'See videos',
    build: (p) => {
      const n = p.studentVideos.length + p.videos.length
      return n > 0 ? { text: `${n} video${n !== 1 ? 's' : ''} archived`, hasData: true } : { text: '', hasData: false }
    } },
  { num: 6, title: 'Character Arc',      slug: 'character-arc',      cta: 'See awards',
    build: (p) => {
      if (!p.characterAwards.length) return { text: '', hasData: false }
      const latest = [...p.characterAwards].sort((a,b) => b.awardDate.localeCompare(a.awardDate))[0]
      return { text: `${p.characterAwards.length} award${p.characterAwards.length !== 1 ? 's' : ''} · latest: ${latest.virtueEnglish}`, hasData: true }
    } },
  { num: 7, title: 'Scope & Sequence',   slug: 'scope-and-sequence', cta: 'See curriculum',
    build: (p) => {
      if (!p.scopeAndSequence.length) return { text: '', hasData: false }
      return { text: `${p.scopeAndSequence.length} subject${p.scopeAndSequence.length !== 1 ? 's' : ''} tracked`, hasData: true }
    } },
  { num: 8, title: 'Handwriting',        slug: 'handwriting',        cta: 'See samples',
    build: (p) => {
      if (!p.handwritingSamples.length) return { text: '', hasData: false }
      return { text: `${p.handwritingSamples.length} sample${p.handwritingSamples.length !== 1 ? 's' : ''} uploaded`, hasData: true }
    } },
  { num: 9, title: 'Photo Gallery',      slug: 'photo-gallery',      cta: 'See photos',
    build: (p) => {
      if (!p.photos.length) return { text: '', hasData: false }
      const thumb = p.photos[0].publicUrl ?? undefined
      return { text: `${p.photos.length} photo${p.photos.length !== 1 ? 's' : ''}`, hasData: true, thumbUrl: thumb }
    } },
  { num: 10, title: 'Teacher Notes',     slug: 'teacher-notes',      cta: 'See notes',
    build: (p) => {
      if (!p.teacherNotes.length) return { text: '', hasData: false }
      const latest = [...p.teacherNotes].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
      return { text: `${p.teacherNotes.length} note${p.teacherNotes.length !== 1 ? 's' : ''} · latest: ${shortDate(latest.createdAt)}`, hasData: true }
    } },
  { num: 11, title: 'Parent Uploads',    slug: 'parent-uploads',     cta: 'See uploads',
    build: (p) => {
      if (!p.parentUploads.length) return { text: '', hasData: false }
      return { text: `${p.parentUploads.length} upload${p.parentUploads.length !== 1 ? 's' : ''}`, hasData: true }
    } },
]

// ── Component ─────────────────────────────────────────────────

export default function PortfolioHub({ portfolio, studentId, selectedYear }: Props) {
  return (
    <div style={{ padding: '1.5rem 2.5rem 3rem' }}>
      <div className="hub-grid">
        {SECTIONS.map((s) => {
          const { text, hasData, thumbUrl } = s.build(portfolio)
          const emptyText = selectedYear !== 'all'
            ? `No entries for ${selectedYear}`
            : 'Awaiting first entry'
          const bg = thumbUrl
            ? `linear-gradient(rgba(247,244,238,0.88),rgba(247,244,238,0.88)),url(${thumbUrl}) center/cover no-repeat`
            : `url('/images/parchmant-paper.jpeg') center/cover no-repeat`

          return (
            <Link key={s.slug} href={`/portfolio/${studentId}/section/${s.slug}`} style={{ textDecoration: 'none' }}>
              <div
                className="hub-card reveal"
                style={{
                  background:  bg,
                  borderLeft:  hasData ? '3px solid #B8A050' : undefined,
                  opacity:     hasData ? 1 : 0.7,
                }}
              >
                <span className="hub-card-num">{String(s.num).padStart(2, '0')}</span>
                <h3 className="hub-card-title">{s.title}</h3>
                <p className="hub-card-stat">
                  {hasData
                    ? text
                    : <em style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.75rem' }}>{emptyText}</em>
                  }
                </p>
                <span className="hub-card-cta">{s.cta} →</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link href={`/portfolio/${studentId}/full`} className="hub-full-btn">
          View Full Portfolio →
        </Link>
      </div>
    </div>
  )
}
