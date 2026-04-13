'use client'

// ============================================================
// components/portfolio/PortfolioHub.tsx
//
// Hub overview: 3 elegant group cards (Academics, Student Work,
// Gallery). Each links to /portfolio/[studentId]/group/[slug].
// ============================================================

import Link from 'next/link'
import type { PortfolioData, Assessment } from '@/lib/types'
import { ordinal, latestAssessment } from '@/lib/utils'
import styles from './PortfolioHub.module.css'

interface Props {
  portfolio:    PortfolioData
  studentId:    string
  selectedYear: string
}

// ── Summary builders ──────────────────────────────────────────

function buildAcademicsSummary(p: PortfolioData) {
  const stats: string[] = []
  let filled = 0
  const total = 3

  const m = latestAssessment(p.assessments, 'maps_math')
  const e = latestAssessment(p.assessments, 'maps_english')
  if (m || e) {
    const fmt = (a: Assessment | null) =>
      a?.percentile != null ? ordinal(Math.round(a.percentile)) : '—'
    stats.push(`Math: ${fmt(m)} · English: ${fmt(e)}`)
    filled++
  }

  const avantScores = (
    ['avant_speaking','avant_reading','avant_listening','avant_writing'] as const
  ).map((t) => latestAssessment(p.assessments, t))
   .filter((a): a is Assessment => a?.score != null)

  if (avantScores.length) {
    const avg = avantScores.map((a) => a.score!).reduce((s,n) => s+n, 0) / avantScores.length
    stats.push(`Hebrew: ${avg.toFixed(2)} composite`)
    filled++
  }

  if (p.scopeAndSequence.length) {
    stats.push(`${p.scopeAndSequence.length} subject${p.scopeAndSequence.length !== 1 ? 's' : ''} tracked`)
    filled++
  }

  return { stats, filled, total }
}

function buildStudentWorkSummary(p: PortfolioData) {
  const stats: string[] = []
  let filled = 0
  const total = 6

  if (p.readings.length)           { stats.push(`${p.readings.length} book${p.readings.length !== 1 ? 's' : ''}`);                           filled++ }
  if (p.writingSamples.length)     { stats.push(`${p.writingSamples.length} writing sample${p.writingSamples.length !== 1 ? 's' : ''}`);       filled++ }
  const vids = p.studentVideos.length + p.videos.length
  if (vids)                        { stats.push(`${vids} video${vids !== 1 ? 's' : ''}`);                                                     filled++ }
  if (p.handwritingSamples.length) { stats.push(`${p.handwritingSamples.length} handwriting sample${p.handwritingSamples.length !== 1 ? 's' : ''}`); filled++ }
  if (p.teacherNotes.length)       { stats.push(`${p.teacherNotes.length} teacher note${p.teacherNotes.length !== 1 ? 's' : ''}`);             filled++ }
  if (p.characterAwards.length)    { stats.push(`${p.characterAwards.length} character award${p.characterAwards.length !== 1 ? 's' : ''}`);   filled++ }

  return { stats, filled, total }
}

function buildGallerySummary(p: PortfolioData) {
  const stats: string[] = []
  let filled = 0
  const total = 2

  if (p.photos.length)        { stats.push(`${p.photos.length} photo${p.photos.length !== 1 ? 's' : ''}`);                    filled++ }
  if (p.parentUploads.length) { stats.push(`${p.parentUploads.length} parent upload${p.parentUploads.length !== 1 ? 's' : ''}`); filled++ }

  const thumbUrl = p.photos[0]?.publicUrl ?? undefined
  return { stats, filled, total, thumbUrl }
}

// ── Dynamic subtitle builders ─────────────────────────────────

function academicsSubtitle(p: PortfolioData): string | null {
  const parts: string[] = []
  const m = latestAssessment(p.assessments, 'maps_math')
  if (m?.percentile != null) parts.push(`Math ${ordinal(Math.round(m.percentile))} percentile`)
  const avantTypes = ['avant_speaking','avant_reading','avant_listening','avant_writing'] as const
  const scores = avantTypes
    .map((t) => latestAssessment(p.assessments, t))
    .filter((a): a is Assessment => a?.score != null)
    .map((a) => a.score!)
  if (scores.length) {
    const avg = scores.reduce((s, n) => s + n, 0) / scores.length
    parts.push(`Hebrew ${avg.toFixed(2)} composite`)
  }
  return parts.length ? `Latest: ${parts.join(' · ')}` : null
}

function studentWorkSubtitle(p: PortfolioData): string | null {
  const parts: string[] = []
  if (p.readings.length) {
    const latest = [...p.readings].sort((a, b) => {
      const da = a.dateFinished ?? a.createdAt
      const db = b.dateFinished ?? b.createdAt
      return db.localeCompare(da)
    })[0]
    if (latest) parts.push(`Latest book: ${latest.title}`)
  }
  if (p.teacherNotes.length) {
    parts.push(`${p.teacherNotes.length} teacher note${p.teacherNotes.length !== 1 ? 's' : ''}`)
  }
  return parts.length ? parts.join(' · ') : null
}

function gallerySubtitle(p: PortfolioData): string | null {
  const parts: string[] = []
  if (p.photos.length) parts.push(`${p.photos.length} photo${p.photos.length !== 1 ? 's' : ''}`)
  if (p.parentUploads.length) parts.push(`${p.parentUploads.length} parent upload${p.parentUploads.length !== 1 ? 's' : ''}`)
  return parts.length ? parts.join(' · ') : null
}

// ── GroupCard ─────────────────────────────────────────────────

interface GroupCardProps {
  title:     string
  subtitle:  string
  groupSlug: string
  stats:     string[]
  filled:    number
  total:     number
  studentId: string
  thumbUrl?: string
}

function GroupCard({ title, subtitle, groupSlug, stats, filled, total, studentId, thumbUrl }: GroupCardProps) {
  const hasData = filled > 0
  const bg = thumbUrl
    ? `linear-gradient(rgba(247,244,238,0.82),rgba(247,244,238,0.82)),url(${thumbUrl}) center/cover no-repeat`
    : `url('/images/parchmant-paper.jpeg') center/cover no-repeat`

  return (
    <Link href={`/portfolio/${studentId}/group/${groupSlug}`} style={{ textDecoration: 'none' }}>
      <div className={`${styles.hubGroupCard} reveal`} style={{ background: bg }}>
        <div className={styles.hubGroupCardInner}>
          <div className={styles.hubGroupCardHeader}>
            <h2 className={styles.hubGroupCardTitle}>{title}</h2>
            <span className={styles.hubGroupCardCount}>{filled}/{total}</span>
          </div>
          <p className={styles.hubGroupCardSubtitle}>{subtitle}</p>

          {hasData ? (
            <div className={styles.hubGroupCardStats}>
              {stats.map((s, i) => (
                <span key={i} className={styles.hubGroupCardChip}>{s}</span>
              ))}
            </div>
          ) : (
            <p className={styles.hubGroupCardEmpty}>Add first entry →</p>
          )}
        </div>
        <span className={styles.hubGroupCardCta}>Explore →</span>
      </div>
    </Link>
  )
}

// ── Hub ───────────────────────────────────────────────────────

export default function PortfolioHub({ portfolio, studentId }: Props) {
  const academics = buildAcademicsSummary(portfolio)
  const work      = buildStudentWorkSummary(portfolio)
  const gallery   = buildGallerySummary(portfolio)

  const academicsSub = academicsSubtitle(portfolio) ?? 'Test scores, Hebrew immersion, and curriculum progress'
  const workSub      = studentWorkSubtitle(portfolio) ?? 'Books, writing, speeches, handwriting, notes, and character'
  const gallerySub   = gallerySubtitle(portfolio) ?? 'Photos and uploads from school and home'

  return (
    <div style={{ padding: '1.5rem 2.5rem 3rem' }}>

      {portfolio.student.summary && (
        <div className={styles.hubAiSummary}>
          <span className={styles.hubAiSummaryLabel}>Summary</span>
          <p>{portfolio.student.summary}</p>
        </div>
      )}

      <div className={styles.hubGroupGrid}>
        <GroupCard
          title="Academics"
          subtitle={academicsSub}
          groupSlug="academics"
          stats={academics.stats}
          filled={academics.filled}
          total={academics.total}
          studentId={studentId}
        />
        <GroupCard
          title="Student Work"
          subtitle={workSub}
          groupSlug="student-work"
          stats={work.stats}
          filled={work.filled}
          total={work.total}
          studentId={studentId}
        />
        <GroupCard
          title="Gallery"
          subtitle={gallerySub}
          groupSlug="gallery"
          stats={gallery.stats}
          filled={gallery.filled}
          total={gallery.total}
          studentId={studentId}
          thumbUrl={gallery.thumbUrl}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link href={`/portfolio/${studentId}/full`} className={styles.hubFullBtn}>
          View Full Portfolio →
        </Link>
      </div>

      <div style={{ textAlign: 'center', padding: '4rem 2rem 3rem', opacity: 0.25 }}>
        {portfolio.school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portfolio.school.logoUrl}
            alt={portfolio.school.name}
            style={{ maxHeight: 80, marginBottom: '1rem', opacity: 0.6 }}
          />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
            border: '1px solid var(--rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--ink-faint)',
          }}>
            {portfolio.school.name.charAt(0)}
          </div>
        )}
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.1rem',
          fontStyle: 'italic',
          color: 'var(--ink-faint)',
          margin: '0 0 0.25rem',
        }}>
          {portfolio.school.name}
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}>
          Living Portfolio
        </p>
      </div>
    </div>
  )
}
