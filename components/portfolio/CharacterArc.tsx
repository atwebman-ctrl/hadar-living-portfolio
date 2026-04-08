import type { CharacterAward, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'
import InlineCharacterForm from '@/components/portfolio/InlineCharacterForm'

interface Props {
  characterAwards?: CharacterAward[]
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

export default function CharacterArc({ characterAwards, studentId, studentName, role, existingDraft }: Props) {
  const hasData = !!characterAwards && characterAwards.length > 0

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
      <div className="section-header reveal">
        <span className="section-num">06</span>
        <h2 className="section-title">The Character Arc</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.75rem', maxWidth: 560 }}>
        {introText}
      </p>

      <div className="badges-row reveal">
        {badges.map((b) => (
          <div key={b.id} className="badge-card">
            <div className="badge-icon" style={{ background: b.iconBg }}>{b.icon}</div>
            <div className="badge-heb">{b.heb}</div>
            <div className="badge-en">{b.transliteration}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
              {b.english}
            </div>
            <div className="badge-date">{b.date}</div>
            {b.description && (
              <div style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.25rem', lineHeight: 1.4 }}>
                {b.description}
              </div>
            )}
          </div>
        ))}

        {/* Placeholder — next virtue to be earned */}
        <div className="badge-card" style={{ opacity: 0.4, borderStyle: 'dashed' }}>
          <div className="badge-icon" style={{ background: 'var(--cream-dark)', fontSize: 22 }}>+</div>
          <div className="badge-heb" style={{ color: 'var(--ink-faint)' }}>???</div>
          <div className="badge-en">Next Virtue</div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', lineHeight: 1.4, margin: '.2rem 0' }}>
            To be earned
          </div>
          <div className="badge-date" style={{ color: 'transparent' }}>&mdash;</div>
        </div>
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

      {/* Inline data entry — admin/teacher only */}
      {(role === 'admin' || role === 'teacher') && studentId && (
        <InlineCharacterForm studentId={studentId} />
      )}
    </section>
  )
}
