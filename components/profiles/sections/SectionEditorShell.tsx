'use client'

// ============================================================
// components/profiles/sections/SectionEditorShell.tsx
//
// Shared visual frame for every per-section editor in the
// Profile Builder. Polymorphic: each section kind supplies its
// own body via the `children` slot, plus optional narrative
// and footer slots.
// ============================================================

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { ProfileSectionStatus } from '@/lib/types/profileBuilder'

type Props = {
  studentName:    string
  gradeLabel:     string
  termLabel:      string
  sectionTitle:   string
  sectionStatus:  ProfileSectionStatus
  backHref:       string
  children:       ReactNode
  narrativeArea?: ReactNode
  footerActions?: ReactNode
}

const STATUS_LABEL: Record<ProfileSectionStatus, string> = {
  not_started:     'Not started',
  in_progress:     'In progress',
  awaiting_review: 'Awaiting your narrative',
  complete:        'Complete',
}

// Status pill colors — gold for active states, teal for done.
const STATUS_PILL: Record<ProfileSectionStatus, CSSProperties> = {
  not_started:     { background: 'var(--cream-dark)', color: 'var(--ink-faint)' },
  in_progress:     { background: 'rgba(196,154,42,0.12)', color: 'var(--gold)' },
  awaiting_review: { background: 'rgba(196,154,42,0.18)', color: 'var(--gold)' },
  complete:        { background: 'rgba(45,106,106,0.12)', color: 'var(--teal, #2d6a6a)' },
}

export default function SectionEditorShell({
  studentName, gradeLabel, termLabel,
  sectionTitle, sectionStatus, backHref,
  children, narrativeArea, footerActions,
}: Props) {
  return (
    <div style={PAGE}>
      <div style={SHELL}>
        <Link href={backHref} style={BACK_LINK}>
          ← Back to profile overview
        </Link>

        <div style={HEADER}>
          <div style={EYEBROW}>
            {studentName} · {gradeLabel} · {termLabel}
          </div>
          <div style={HEADER_ROW}>
            <h1 style={TITLE}>{sectionTitle}</h1>
            <span style={{ ...STATUS_PILL_BASE, ...STATUS_PILL[sectionStatus] }}>
              {STATUS_LABEL[sectionStatus]}
            </span>
          </div>
        </div>

        <div style={BODY_CARD}>{children}</div>

        {narrativeArea && (
          <div style={NARRATIVE_CARD}>{narrativeArea}</div>
        )}

        {footerActions && (
          <div style={FOOTER}>{footerActions}</div>
        )}
      </div>
    </div>
  )
}

// ── styles ────────────────────────────────────────────────────

const PAGE: CSSProperties = {
  minHeight: '100vh', background: 'var(--cream)',
  padding: '40px 32px', display: 'flex', justifyContent: 'center',
}
const SHELL: CSSProperties = { width: '100%', maxWidth: 1040 }

const BACK_LINK: CSSProperties = {
  display: 'inline-block',
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--ink-mid)', textDecoration: 'none',
  marginBottom: 20,
}

const HEADER: CSSProperties = { marginBottom: 24 }

const EYEBROW: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 10,
}

const HEADER_ROW: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
}

const TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500,
  color: 'var(--navy)', margin: 0, flex: '1 1 auto',
}

const STATUS_PILL_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  height: 24, padding: '0 12px', borderRadius: 12,
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

const BODY_CARD: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: 24, marginBottom: 20,
}

const NARRATIVE_CARD: CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--rule)',
  borderRadius: 8, padding: 24, marginBottom: 20,
}

const FOOTER: CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center',
}
