'use client'

import { useState } from 'react'
import type { WritingSample, AiDraft, UserRole } from '@/lib/types'
import AiNarrativePanel from '@/components/portfolio/AiNarrativePanel'

interface Props {
  writingSamples?: WritingSample[]
  studentId?:      string
  studentName?:    string
  role?:           UserRole
  existingDraft?:  AiDraft
}

// Internal display shape — same whether source is DB or demo fallback
interface Sample {
  id: string
  tab: string      // button label
  date: string     // header line inside the pane
  text: string     // body excerpt
  note?: string    // optional teacher annotation
  growth?: string  // optional growth marker
}

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_SAMPLES: Sample[] = [
  {
    id: '1',
    tab: 'Grade 1 · 2024',
    date: 'June 2024 · Animal Research · Age 6',
    text: '"fox. There are foxis at my School too babys and a moms. whet will hapin too them the babys plad neer the chikin Koop so that is hoo has bin diping the holin the prawnd but the foxis wor so cute Gabex Kold Artameood and Oameeams. thaeechast the mommy fox in srcols arawnd the Scool"',
    note: 'Age 6 · Phonetic spelling, strong phonemic awareness, beginning sentence structure, genuine curiosity and narrative intent. MAPS English: 90th–94th percentile.',
    growth: '→ Novice composition',
  },
  {
    id: '2',
    tab: 'Grade 2 · 2025',
    date: 'May 13, 2025 · Personal Narrative · Age 7',
    text: '"One day I went to the animal care center with my Aunty Rutty. We met a small cat named Buddy, he was very playful. He was light orange with dark orange stripes and he had white and green eyes and a pink nose. He jumped into my lap, we played for a long time. Then we had to go have dinner at Aunty Rutty\'s house. We watched a movie and did a sleepover. I\'m looking forward to it. I\'m also looking forward to going to Cape Cod — I\'ve told myself I\'ll catch a fiddler crab."',
    note: 'Age 7 · Controlled narrative structure, specific sensory detail, temporal transitions, forward-looking conclusion. Grade 2 English MAPS: 98th–99th percentile.',
    growth: '→ Emerging voice',
  },
  {
    id: '3',
    tab: 'Grade 3 · 2025',
    date: 'November 17, 2025 · Literary Retelling — "A Good Idea" · Age 8',
    text: '"In the Hundred Acre Woods it rained miserably for many days, so there was a flood. Piglet was in his tree. He was miserable because he was lonely. He sent a bottle message: \'Help! Piglet needs help on one side and Piglet needs help fast on the other side.\' Pooh was still in his house when he woke up. He found out that his house was flooded. So he took his ten honey pots one at a time and sat on a tree branch above the water. Just then he saw Piglet\'s bottle — and thought it was a jar of honey."',
    note: 'Age 8 · Complex sentence variety, embedded dialogue, cause-and-effect reasoning, ironic ending preserved. Grade 3 English MAPS: 95th–98th percentile.',
    growth: '→ Literary craft emerging',
  },
]

// ── Data transformation ───────────────────────────────────────────────────────

function mapToSamples(writingSamples: WritingSample[]): Sample[] {
  const sorted = [...writingSamples].sort((a, b) => a.academicYear.localeCompare(b.academicYear))
  return sorted.map((s) => ({
    id: s.id,
    tab: `${s.gradeLevel} · ${s.academicYear}`,
    date: s.title,
    text: s.body ?? s.ocrText ?? '',
    note: s.body && s.ocrText ? s.ocrText : undefined,
  }))
}

function buildDraftContext(writingSamples: WritingSample[], studentFirstName: string | null): Record<string, unknown> {
  const sorted = [...writingSamples].sort((a, b) => a.academicYear.localeCompare(b.academicYear))
  return {
    studentFirstName,
    sampleCount: sorted.length,
    samples: sorted.map((s) => ({
      title: s.title,
      gradeLevel: s.gradeLevel,
      academicYear: s.academicYear,
      excerpt: (s.body ?? s.ocrText ?? '').slice(0, 300) || null,
    })),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreativeEvolution({ writingSamples, studentId, studentName, role, existingDraft }: Props) {
  const hasData = !!writingSamples && writingSamples.length > 0
  const samples = hasData ? mapToSamples(writingSamples!) : DEMO_SAMPLES

  const [activeId, setActiveId] = useState<string>(samples[0]?.id ?? '')
  const current = samples.find((s) => s.id === activeId) ?? samples[0]

  const draftContext = (studentId && role && role !== 'parent' && hasData)
    ? buildDraftContext(writingSamples!, studentName ?? null)
    : null

  return (
    <section id="writing">
      <div className="section-header reveal">
        <span className="section-num">04</span>
        <h2 className="section-title">Creative Evolution</h2>
        <div className="section-rule" />
      </div>
      <p className="reveal" style={{ fontSize: '.9rem', color: 'var(--ink-light)', marginBottom: '1.5rem', maxWidth: 560 }}>
        {hasData
          ? `${samples.length} writing sample${samples.length !== 1 ? 's' : ''} — trace the evolution of written composition over time.`
          : 'Three years of written composition — from phonetic invention in Grade 1 to nuanced literary retelling in Grade 3.'}
      </p>

      <div className="reveal">
        <div className="flip-tabs">
          {samples.map((s) => (
            <button
              key={s.id}
              className={`flip-tab${activeId === s.id ? ' active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              {s.tab}
            </button>
          ))}
        </div>
        {current && (
          <div className="flip-pane active">
            <div className="flip-date">{current.date}</div>
            <div className="flip-text">{current.text}</div>
            {current.note && <div className="flip-note">{current.note}</div>}
            {current.growth && <span className="flip-growth">{current.growth}</span>}
          </div>
        )}
      </div>

      {/* AI narrative panel */}
      {studentId && role && (draftContext || role === 'parent') && (
        <AiNarrativePanel
          studentId={studentId}
          role={role}
          sectionType="writing"
          existingDraft={existingDraft}
          draftContext={draftContext ?? {}}
        />
      )}
    </section>
  )
}
