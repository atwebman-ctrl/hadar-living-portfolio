'use client'

import { useState } from 'react'
import type { CharacterAward, AiDraft, TeacherNote, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import InlineCharacterForm from '@/components/portfolio/InlineCharacterForm'
import InlineSectionComment from '@/components/shared/InlineSectionComment'
import s from './sections.module.css'

const addAwardBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--navy)', background: 'none',
  border: '1px solid var(--navy)', padding: '4px 12px', cursor: 'pointer',
}

const placeholderBtn: React.CSSProperties = {
  font: 'inherit', color: 'inherit', textAlign: 'center',
  cursor: 'pointer', opacity: 0.4, borderStyle: 'dashed',
  transition: 'opacity .2s, transform .2s, box-shadow .2s',
}

interface Props {
  characterAwards?: CharacterAward[]
  teacherNotes?:    TeacherNote[]
  studentId?:       string
  studentName?:     string
  role?:            UserRole
  existingDraft?:   AiDraft
}

// Background tints for badge icons — cycled when there are more awards than colours
const ICON_BG_PALETTE = [
  'rgba(27,58,107,.08)',
  'rgba(184,150,62,.1)',
  'rgba(46,125,94,.1)',
  'rgba(100,50,150,.1)',
  'rgba(180,80,40,.1)',
]

function fmtDate(dateStr: string): string {
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_BADGES = [
  {
    id: '1',
    icon: '\uD83E\uDD81', // 🦁
    iconBg: ICON_BG_PALETTE[0],
    heb: '\u05E2\u05B9\u05DE\u05B6\u05E5',
    transliteration: 'Ometz',
    english: 'Courage',
    date: 'Dec 19, 2025',
    description: null as string | null,
  },
  {
    id: '2',
    icon: '\uD83D\uDD4A\uFE0F', // 🕊️
    iconBg: ICON_BG_PALETTE[1],
    heb: '\u05D7\u05B5\u05E8\u05D5\u05BC\u05EA',
    transliteration: 'Herut',
    english: 'Freedom',
    date: 'Apr 4, 2025',
    description: null as string | null,
  },
  {
    id: '3',
    icon: '\u2696\uFE0F', // ⚖️
    iconBg: ICON_BG_PALETTE[2],
    heb: '\u05D0\u05B7\u05D7\u05B0\u05E8\u05B8\u05D9\u05D5\u05BC\u05EA',
    transliteration: 'Achrayut',
    english: 'Responsibility',
    date: 'Feb 21, 2025',
    description: null as string | null,
  },
]

function buildDraftContext(characterAwards: CharacterAward[], studentFirstName: string | null): Record<string, unknown> {
  return {
    studentFirstName,
    virtueCount: characterAwards.length,
    virtues: characterAwards.map((a) => ({
      virtueHebrew: a.virtueHebrew,
      virtueTransliteration: a.virtueTransliteration,
      virtueEnglish: a.virtueEnglish,
      description: a.description,
      awardDate: a.awardDate,
    })),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CharacterArc({ characterAwards, teacherNotes, studentId, studentName, role, existingDraft }: Props) {
  const hasData = !!characterAwards && characterAwards.length > 0
  const canEdit = !!studentId && (role === 'admin' || role === 'teacher')
  const [modalOpen, setModalOpen] = useState(false)

  const badges = hasData
    ? characterAwards!.map((a, i) => ({
        id: a.id,
        icon: '\u2726', // ✦ — generic decorative mark for DB-sourced awards
        iconBg: ICON_BG_PALETTE[i % ICON_BG_PALETTE.length],
        heb: a.virtueHebrew,
        transliteration: a.virtueTransliteration,
        english: a.virtueEnglish,
        date: fmtDate(a.awardDate),
        description: a.description,
      }))
    : DEMO_BADGES

  const introText = hasData
    ? `${badges.length} character virtue${badges.length !== 1 ? 's' : ''} awarded — recognized for embodying core middot.`
    : 'Torah Im Derech Eretz \u2014 Athena was recognized as Student Exemplar of the Week on three separate occasions for embodying core character virtues.'

  const draftContext = (studentId && role && role !== 'parent' && hasData)
    ? buildDraftContext(characterAwards!, studentName ?? null)
    : null

  return (
    <section id="character">
      <div className={`${s.sectionHeader} reveal`}>
        <span className={s.sectionNum}>06</span>
        <h2 className={s.sectionTitle}>Soulcraft</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {introText}
      </p>

      <div className={`${s.badgesRow} reveal`}>
        {badges.map((b) => (
          <div key={b.id} className={s.badgeCard}>
            <div className={s.badgeIcon} style={{ background: b.iconBg }}>{b.icon}</div>
            <div className={s.badgeHeb}>{b.heb}</div>
            <div className={s.badgeEn}>{b.transliteration}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
              {b.english}
            </div>
            <div className={s.badgeDate}>{b.date}</div>
            {b.description && (
              <div style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.25rem', lineHeight: 1.4 }}>
                {b.description}
              </div>
            )}
          </div>
        ))}

        {/* Placeholder — next virtue to be earned. Doubles as an alternate
            entry point to the Add Award modal when the viewer can edit. */}
        {canEdit ? (
          <button
            type="button"
            className={s.badgeCard}
            style={placeholderBtn}
            onClick={() => setModalOpen(true)}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4' }}
            aria-label="Add character award"
          >
            <div className={s.badgeIcon} style={{ background: 'var(--cream-dark)', fontSize: 22 }}>+</div>
            <div className={s.badgeHeb} style={{ color: 'var(--ink-faint)' }}>???</div>
            <div className={s.badgeEn}>Next Virtue</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
              To be earned
            </div>
            <div className={s.badgeDate} style={{ color: 'transparent' }}>&mdash;</div>
          </button>
        ) : (
          <div className={s.badgeCard} style={{ opacity: 0.4, borderStyle: 'dashed' }}>
            <div className={s.badgeIcon} style={{ background: 'var(--cream-dark)', fontSize: 22 }}>+</div>
            <div className={s.badgeHeb} style={{ color: 'var(--ink-faint)' }}>???</div>
            <div className={s.badgeEn}>Next Virtue</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
              To be earned
            </div>
            <div className={s.badgeDate} style={{ color: 'transparent' }}>&mdash;</div>
          </div>
        )}
      </div>

      {/* AI narrative panel */}
      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="virtue_badges"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}

      {studentId && (
        <InlineSectionComment
          studentId={studentId}
          sectionCategory="character_arc"
          sectionAnchor="soulcraft"
          canEdit={canEdit}
          notes={teacherNotes}
          role={role}
        />
      )}

      {/* Inline data entry — admin/teacher only. Two triggers (placeholder
          card above + button here) share one controlled modal. */}
      {canEdit && studentId && (
        <>
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
            <button style={addAwardBtn} onClick={() => setModalOpen(true)}>
              + Add Award
            </button>
          </div>
          <InlineCharacterForm
            studentId={studentId}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </>
      )}
    </section>
  )
}
