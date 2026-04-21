// ============================================================
// components/portfolio/published/PublishedSectionRenderer.tsx
//
// Read-only renderer for a single published profile section.
// Switch on section_kind. Layout: section header → narrative
// (blockquote, Lora 16) → data block. Single column, printable.
// ============================================================

import type { ProfileSectionKind } from '@/lib/types/profileBuilder'
import type { Reading, CharacterAward } from '@/lib/types'
import type { AVANTAssessment } from '@/lib/avantHelpers'
import type { MAPSAssessment } from '@/lib/mapsHelpers'
import {
  HEBREW_GRADE_AVERAGES, HEBREW_SKILLS,
  type HebrewSkillAverages, type HebrewSkill,
} from '@/lib/hebrewComparisonNorms'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'
import { percentileColor } from '@/lib/percentileColor'
import * as S from './publishedStyles'

export type PublishedSectionData =
  | { kind: 'maps_scores';         assessments: MAPSAssessment[] }
  | { kind: 'lexile';               band: { label: string; rangeMinL: number; rangeMaxL: number; termLabel: string; notes: string | null } | null }
  | { kind: 'avant_hebrew';         assessments: AVANTAssessment[] }
  | { kind: 'hebrew_comparison';    athenaScores: HebrewSkillAverages; firstName: string }
  | { kind: 'canon_reading';        readings: Reading[] }
  | { kind: 'english_composition';  samples: CompositionSample[] }
  | { kind: 'hebrew_composition';   samples: CompositionSample[] }
  | { kind: 'character_middot';     awards: CharacterAward[] }
  | { kind: 'poetry_recitation';    videoUrl: string | null; title: string | null }
  | { kind: 'placeholder' }

const SECTION_TITLES: Record<ProfileSectionKind, string> = {
  maps_scores:         'Standardized Measures',
  lexile:              'Reading Level',
  avant_hebrew:        'Hebrew Proficiency',
  hebrew_comparison:   'Hebrew · National Comparison',
  canon_reading:       'The Canon · Books Read',
  english_composition: 'English Composition',
  hebrew_composition:  'Hebrew Composition',
  character_middot:    'Middot · Character Development',
  poetry_recitation:   'Rhetoric · Poetry Recitation',
  art_projects:        'Art Projects',
  field_trips:         'Field Trips',
  custom:              'Highlight',
}

const SECTION_DESCRIPTORS: Record<ProfileSectionKind, string> = {
  maps_scores:         'NWEA MAP Growth · math & english',
  lexile:              'Independent reading band',
  avant_hebrew:        'AVANT STAMP · four skills over time',
  hebrew_comparison:   'Latest scores against grade-level benchmarks',
  canon_reading:       'Books read this year',
  english_composition: 'Selected writing samples',
  hebrew_composition:  'Selected writing samples · Hebrew',
  character_middot:    'Virtues recognized this term',
  poetry_recitation:   'Recitation video',
  art_projects:        'Studio work',
  field_trips:         'Excursions and visits',
  custom:              '',
}

type Props = {
  sectionKind: ProfileSectionKind
  narrative:   string | null
  data:        PublishedSectionData
}

function ordinal(n: number | null): string {
  if (n == null) return '—'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PublishedSectionRenderer({ sectionKind, narrative, data }: Props) {
  return (
    <section style={S.SECTION}>
      <header style={S.HEADER}>
        <h2 style={S.TITLE}>{SECTION_TITLES[sectionKind]}</h2>
        {SECTION_DESCRIPTORS[sectionKind] && (
          <div style={S.DESCRIPTOR}>{SECTION_DESCRIPTORS[sectionKind]}</div>
        )}
      </header>

      {narrative && narrative.trim().length > 0 ? (
        <blockquote style={S.NARRATIVE}>
          {narrative.split('\n\n').map((para, i) => (
            <p key={i} style={S.NARRATIVE_PARA}>{para}</p>
          ))}
        </blockquote>
      ) : (
        <div style={S.NO_NARRATIVE}>No narrative recorded for this section.</div>
      )}

      <div style={S.DATA_BLOCK}>{renderData(data)}</div>
    </section>
  )
}

function renderData(data: PublishedSectionData) {
  switch (data.kind) {
    case 'maps_scores':         return <MapsBlock assessments={data.assessments} />
    case 'lexile':               return <LexileBlock band={data.band} />
    case 'avant_hebrew':         return <AvantBlock assessments={data.assessments} />
    case 'hebrew_comparison':    return <HebrewComparisonBlock {...data} />
    case 'canon_reading':        return <ReadingsBlock readings={data.readings} />
    case 'english_composition':
    case 'hebrew_composition':   return <CompositionBlock samples={data.samples} />
    case 'character_middot':     return <CharacterBlock awards={data.awards} />
    case 'poetry_recitation':    return <PoetryBlock videoUrl={data.videoUrl} title={data.title} />
    case 'placeholder':          return <Empty>This section is not yet wired into the published view.</Empty>
  }
}

// ── Blocks ────────────────────────────────────────────────────

function MapsBlock({ assessments }: { assessments: MAPSAssessment[] }) {
  if (assessments.length === 0) return <Empty>No MAP administrations captured.</Empty>
  return (
    <table style={S.TABLE}>
      <thead>
        <tr>
          <th style={S.TH}>Term</th>
          <th style={S.TH}>Math RIT</th>
          <th style={S.TH}>Math %ile</th>
          <th style={S.TH}>English RIT</th>
          <th style={S.TH}>English %ile</th>
        </tr>
      </thead>
      <tbody>
        {assessments.map((a) => (
          <tr key={a.id}>
            <td style={S.TD}>{a.term}</td>
            <td style={S.TD}>{a.mathRIT ?? '—'}</td>
            <td style={{ ...S.TD, color: percentileColor(a.mathPercentile), fontWeight: 600 }}>{ordinal(a.mathPercentile)}</td>
            <td style={S.TD}>{a.engRIT ?? '—'}</td>
            <td style={{ ...S.TD, color: percentileColor(a.engPercentile), fontWeight: 600 }}>{ordinal(a.engPercentile)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LexileBlock({ band }: { band: { label: string; termLabel: string; notes: string | null } | null }) {
  if (!band) return <Empty>No Lexile measure captured.</Empty>
  return (
    <dl style={S.DEFLIST}>
      <Pair label="Latest measure" value={band.label} />
      <Pair label="Term"            value={band.termLabel} />
      {band.notes && <Pair label="Notes" value={band.notes} />}
    </dl>
  )
}

function AvantBlock({ assessments }: { assessments: AVANTAssessment[] }) {
  if (assessments.length === 0) return <Empty>No AVANT administrations captured.</Empty>
  return (
    <table style={S.TABLE}>
      <thead>
        <tr>
          <th style={S.TH}>Term</th>
          <th style={S.TH}>Listening</th>
          <th style={S.TH}>Reading</th>
          <th style={S.TH}>Speaking</th>
          <th style={S.TH}>Writing</th>
        </tr>
      </thead>
      <tbody>
        {assessments.map((a) => (
          <tr key={a.id}>
            <td style={S.TD}>{a.term}</td>
            <td style={S.TD}>{a.listening ?? '—'}</td>
            <td style={S.TD}>{a.reading   ?? '—'}</td>
            <td style={S.TD}>{a.speaking  ?? '—'}</td>
            <td style={S.TD}>{a.writing   ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const HEBREW_LABEL: Record<HebrewSkill, string> = {
  reading: 'Reading', writing: 'Writing', listening: 'Listening',
  speaking: 'Speaking', composite: 'Composite',
}

function HebrewComparisonBlock({ athenaScores, firstName }:
  { athenaScores: HebrewSkillAverages; firstName: string }) {
  return (
    <table style={S.TABLE}>
      <thead>
        <tr>
          <th style={S.TH}>Skill</th>
          <th style={S.TH}>{firstName}</th>
          <th style={S.TH}>Grade 3 avg</th>
          <th style={S.TH}>Grade 4 avg</th>
          <th style={S.TH}>Grade 5 avg</th>
          <th style={S.TH}>Grade 6 avg</th>
        </tr>
      </thead>
      <tbody>
        {HEBREW_SKILLS.map((skill) => (
          <tr key={skill}>
            <td style={S.TD}>{HEBREW_LABEL[skill]}</td>
            <td style={{ ...S.TD, color: 'var(--gold)', fontWeight: 600 }}>
              {athenaScores[skill].toFixed(2)}
            </td>
            <td style={S.TD}>{HEBREW_GRADE_AVERAGES[3][skill].toFixed(2)}</td>
            <td style={S.TD}>{HEBREW_GRADE_AVERAGES[4][skill].toFixed(2)}</td>
            <td style={S.TD}>{HEBREW_GRADE_AVERAGES[5][skill].toFixed(2)}</td>
            <td style={S.TD}>{HEBREW_GRADE_AVERAGES[6][skill].toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReadingsBlock({ readings }: { readings: Reading[] }) {
  if (readings.length === 0) return <Empty>No books captured.</Empty>
  return (
    <ol style={S.READING_LIST}>
      {readings.map((r, i) => (
        <li key={r.id} style={S.READING_ROW}>
          <span style={S.READING_NUM}>{String(i + 1).padStart(2, '0')}</span>
          <span style={S.READING_TITLE}>{r.title}</span>
          {r.author && <span style={S.READING_AUTHOR}> by {r.author}</span>}
          {!r.completed && <span style={S.READING_TAG}> · currently reading</span>}
        </li>
      ))}
    </ol>
  )
}

function CompositionBlock({ samples }: { samples: CompositionSample[] }) {
  if (samples.length === 0) return <Empty>No compositions captured.</Empty>
  return (
    <div style={S.CARD_STACK}>
      {samples.map((s) => (
        <article key={s.id} style={S.SAMPLE_CARD}>
          <div style={S.SAMPLE_HEAD}>
            <h3 style={S.SAMPLE_TITLE}>{s.title ?? 'Untitled composition'}</h3>
            <div style={S.SAMPLE_META}>Grade {s.gradeLevel} · {s.academicYear}</div>
          </div>
          {s.imagePublicUrl && (
            <img src={s.imagePublicUrl} alt={s.title ?? 'Composition'} style={S.SAMPLE_IMG} />
          )}
          {s.body && <p style={S.SAMPLE_BODY}>{s.body}</p>}
        </article>
      ))}
    </div>
  )
}

function CharacterBlock({ awards }: { awards: CharacterAward[] }) {
  if (awards.length === 0) return <Empty>No character awards recorded.</Empty>
  return (
    <div style={S.CARD_STACK}>
      {awards.map((a) => (
        <article key={a.id} style={S.SAMPLE_CARD}>
          <div style={S.AWARD_TOP}>
            <span style={S.AWARD_HEBREW} dir="rtl">{a.virtueHebrew}</span>
            <span style={S.AWARD_TRANSLIT}>{a.virtueTransliteration}</span>
          </div>
          <div style={S.AWARD_ENGLISH}>{a.virtueEnglish}</div>
          <div style={S.AWARD_DATE}>Awarded {fmtDate(a.awardDate)}</div>
          {a.description && <blockquote style={S.AWARD_CITATION}>{a.description}</blockquote>}
        </article>
      ))}
    </div>
  )
}

function PoetryBlock({ videoUrl, title }: { videoUrl: string | null; title: string | null }) {
  if (!videoUrl) return <Empty>No recitation video saved.</Empty>
  return (
    <div>
      {title && <div style={S.POETRY_TITLE}>{title}</div>}
      <a href={videoUrl} target="_blank" rel="noreferrer" style={S.POETRY_LINK}>
        Watch recitation →
      </a>
    </div>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={S.DT}>{label}</dt>
      <dd style={S.DD}>{value}</dd>
    </>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={S.EMPTY}>{children}</div>
}
