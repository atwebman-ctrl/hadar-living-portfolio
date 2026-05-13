'use client'

// ============================================================
// LexileSectionWrapper.tsx
//
// Client wrapper around <SectionEditorShell> + <LexileSection>.
// Owns local narrative state, dispatches PATCH calls, and
// supplies the AI draft stub. Routing/data fetching live in
// the sibling page.tsx; this file only handles interaction.
// ============================================================

import { useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/lib/types'
import { formatGrade } from '@/lib/gradeLevel'
import {
  PROFILE_SECTION_KIND_LABELS,
  type ProfileSection,
  type ProfileSectionStatus,
} from '@/lib/types/profileBuilder'
import SectionEditorShell from '@/components/profiles/sections/SectionEditorShell'
import LexileSection from '@/components/profiles/sections/LexileSection'

type Band = {
  label: string
  rangeMinL: number
  rangeMaxL: number
  termLabel: string
  notes: string | null
}

type Props = {
  profileId: string
  section:   ProfileSection
  student:   Student
  termLabel: string
  backHref:  string
  band:      Band | null
}

export default function LexileSectionWrapper({
  profileId, section, student, termLabel, backHref, band,
}: Props) {
  const router = useRouter()
  const [narrative, setNarrative] = useState<string>(
    section.narrativeText ?? section.narrativeDraft ?? '',
  )
  const [status, setStatus] = useState<ProfileSectionStatus>(section.status)
  const [isSaving, startSavingTransition] = useTransition()
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const dirty =
    narrative !== (section.narrativeText ?? section.narrativeDraft ?? '') ||
    status !== section.status

  async function patchSection(payload: {
    narrativeText?: string | null
    narrativeDraft?: string | null
    status?: ProfileSectionStatus
  }) {
    setErrorMessage(null)
    const res = await fetch(
      `/api/dashboard/profiles/${profileId}/sections/${section.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Save failed.')
    }
    return res.json()
  }

  function handleSaveDraft() {
    startSavingTransition(async () => {
      try {
        await patchSection({
          narrativeDraft: narrative.length === 0 ? null : narrative,
          status:         narrative.length === 0 ? 'not_started' : 'in_progress',
        })
        setStatus(narrative.length === 0 ? 'not_started' : 'in_progress')
        setSaveMessage('Draft saved.')
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Save failed.')
      }
    })
  }

  function handleMarkComplete() {
    if (narrative.trim().length === 0) {
      setErrorMessage('Add a narrative before marking complete.')
      return
    }
    startSavingTransition(async () => {
      try {
        await patchSection({
          narrativeText: narrative,
          status:        'complete',
        })
        setStatus('complete')
        setSaveMessage('Marked complete.')
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Save failed.')
      }
    })
  }

  async function handleGenerateDraft() {
    setIsGenerating(true)
    setErrorMessage(null)
    setSaveMessage(null)
    try {
      const res = await fetch(
        `/api/dashboard/profiles/${profileId}/sections/${section.id}/generate`,
        { method: 'POST' },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Draft generation failed.')
      setNarrative(body.text as string)
      setStatus('in_progress')
      setSaveMessage('Draft generated.')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Draft generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <SectionEditorShell
      studentName={`${student.firstName} ${student.lastName}`}
      gradeLabel={formatGrade(student.gradeLevel)}
      termLabel={termLabel}
      sectionTitle={PROFILE_SECTION_KIND_LABELS.lexile}
      sectionStatus={status}
      backHref={backHref}
      footerActions={
        <>
          {saveMessage && <span style={MSG_OK}>{saveMessage}</span>}
          {errorMessage && <span style={MSG_ERR}>{errorMessage}</span>}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || !dirty}
            style={{ ...SECONDARY_BTN, opacity: isSaving || !dirty ? 0.5 : 1 }}
          >
            {isSaving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={isSaving || narrative.trim().length === 0}
            style={{
              ...PRIMARY_BTN,
              opacity: isSaving || narrative.trim().length === 0 ? 0.5 : 1,
            }}
          >
            Mark complete
          </button>
        </>
      }
    >
      <LexileSection
        band={band}
        narrative={narrative}
        onNarrativeChange={(next) => {
          setNarrative(next)
          setSaveMessage(null)
        }}
        isGenerating={isGenerating}
        onGenerateDraft={handleGenerateDraft}
      />
    </SectionEditorShell>
  )
}

const PRIMARY_BTN: CSSProperties = {
  height: 40, padding: '0 22px',
  background: 'var(--navy)', color: 'var(--white)',
  border: 'none', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}

const SECONDARY_BTN: CSSProperties = {
  height: 40, padding: '0 18px',
  background: 'transparent', color: 'var(--ink-mid)',
  border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}

const MSG_OK: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal, #2d6a6a)',
  letterSpacing: '0.06em',
}

const MSG_ERR: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: '#B0413E',
  letterSpacing: '0.06em',
}
