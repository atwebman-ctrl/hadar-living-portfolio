// ============================================================
// components/portfolio/published/PublishedProfile.tsx
//
// Document wrapper for a published Learning Profile. Renders
// header (school + term + student + published date), the
// 9 canonical sections in order, and a footer crediting
// the Head of School. Single-column, printable.
// ============================================================

import type { CSSProperties } from 'react'
import type { Student, SchoolConfig } from '@/lib/types'
import type { Profile, ProfileSection, ProfileSectionKind } from '@/lib/types/profileBuilder'
import PublishedSectionRenderer, {
  type PublishedSectionData,
} from './PublishedSectionRenderer'

const CANONICAL_ORDER: ProfileSectionKind[] = [
  'maps_scores',
  'lexile',
  'avant_hebrew',
  'hebrew_comparison',
  'canon_reading',
  'english_composition',
  'hebrew_composition',
  'character_middot',
  'poetry_recitation',
]

export type SectionPayload = {
  section: ProfileSection
  data:    PublishedSectionData
}

type Props = {
  school:     SchoolConfig
  student:    Student
  profile:    Profile
  payloads:   SectionPayload[]
}

function fmtPublishedDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PublishedProfile({ school, student, profile, payloads }: Props) {
  const byKind = new Map<ProfileSectionKind, SectionPayload>()
  for (const p of payloads) byKind.set(p.section.sectionKind, p)

  const ordered = CANONICAL_ORDER
    .map((k) => byKind.get(k))
    .filter((p): p is SectionPayload => p != null)

  return (
    <article style={DOC}>
      <header style={HEADER}>
        <div style={EYEBROW}>{school.name} · Learning Profile</div>
        <h1 style={STUDENT_NAME}>
          {student.firstName} {student.lastName}
        </h1>
        <div style={META_LINE}>
          {profile.term} · Grade {student.gradeLevel}
        </div>
        {profile.publishedAt && (
          <div style={PUBLISHED_LINE}>
            Published {fmtPublishedDate(profile.publishedAt)}
          </div>
        )}
      </header>

      <div style={BODY}>
        {ordered.map((p) => (
          <PublishedSectionRenderer
            key={p.section.id}
            sectionKind={p.section.sectionKind}
            narrative={p.section.narrativeText}
            data={p.data}
          />
        ))}
      </div>

      <footer style={FOOTER}>
        <div style={FOOTER_LINE}>Reviewed and approved by</div>
        <div style={FOOTER_NAME}>Dr. Liliana Worth</div>
        <div style={FOOTER_TITLE}>Head of School · {school.name}</div>
      </footer>
    </article>
  )
}

// ── Styles ────────────────────────────────────────────────────

const DOC: CSSProperties = {
  maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px',
  background: 'var(--cream)',
}
const HEADER: CSSProperties = {
  paddingBottom: 28, marginBottom: 8,
  borderBottom: '2px solid var(--gold)',
  textAlign: 'center',
}
const EYEBROW: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 12,
}
const STUDENT_NAME: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-heading)', fontSize: 40,
  fontWeight: 600, color: 'var(--navy)', lineHeight: 1.1,
}
const META_LINE: CSSProperties = {
  marginTop: 10, fontFamily: 'var(--font-body)', fontSize: 15,
  color: 'var(--ink-mid)',
}
const PUBLISHED_LINE: CSSProperties = {
  marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
const BODY: CSSProperties = { marginTop: 8 }
const FOOTER: CSSProperties = {
  marginTop: 48, paddingTop: 28,
  borderTop: '2px solid var(--gold)', textAlign: 'center',
}
const FOOTER_LINE: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}
const FOOTER_NAME: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 22, fontStyle: 'italic',
  color: 'var(--navy)',
}
const FOOTER_TITLE: CSSProperties = {
  marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 13,
  color: 'var(--ink-mid)',
}
