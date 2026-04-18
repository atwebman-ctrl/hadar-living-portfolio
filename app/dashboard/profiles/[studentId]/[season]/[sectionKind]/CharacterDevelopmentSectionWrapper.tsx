'use client'

// ============================================================
// CharacterDevelopmentSectionWrapper.tsx
//
// Client wrapper around <SectionEditorShell> + <CharacterDevelopmentSection>.
// Mirrors MAPSSectionWrapper.
// ============================================================

import { useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  PROFILE_SECTION_KIND_LABELS,
  type ProfileSectionStatus,
} from '@/lib/types/profileBuilder'
import type { CharacterAward } from '@/lib/types'
import SectionEditorShell from '@/components/profiles/sections/SectionEditorShell'
import CharacterDevelopmentSection from '@/components/profiles/sections/CharacterDevelopmentSection'

const ATHENA_CHARACTER_DRAFT =
  "Athena has demonstrated middot tovot — good character — on three occasions this year, receiving awards for Ometz (courage), Herut (freedom), and Achrayut (responsibility). Her teachers and Dr. Worth recognize in her the quiet persistence that classical formation aims to cultivate. These are not merely certificates; they are markers of a child coming to love what is good and to practice it in the company of others."

type Props = {
  profileId:        string
  sectionId:        string
  initialNarrative: string
  initialStatus:    ProfileSectionStatus
  studentName:      string
  gradeLabel:       string
  termLabel:        string
  backHref:         string
  awards:           CharacterAward[]
}

export default function CharacterDevelopmentSectionWrapper({
  profileId, sectionId, initialNarrative, initialStatus,
  studentName, gradeLabel, termLabel, backHref, awards,
}: Props) {
  const router = useRouter()
  const [narrative, setNarrative]       = useState<string>(initialNarrative)
  const [status, setStatus]             = useState<ProfileSectionStatus>(initialStatus)
  const [isSaving, startSavingTransition] = useTransition()
  const [saveMessage, setSaveMessage]   = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const dirty = narrative !== initialNarrative || status !== initialStatus

  async function patchSection(payload: {
    narrativeText?:  string | null
    narrativeDraft?: string | null
    status?:         ProfileSectionStatus
  }) {
    setErrorMessage(null)
    const res = await fetch(
      `/api/dashboard/profiles/${profileId}/sections/${sectionId}`,
      {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(payload),
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

  function handleGenerateDraft() {
    setIsGenerating(true)
    setTimeout(() => {
      setNarrative(ATHENA_CHARACTER_DRAFT)
      setIsGenerating(false)
    }, 600)
  }

  return (
    <SectionEditorShell
      studentName={studentName}
      gradeLabel={gradeLabel}
      termLabel={termLabel}
      sectionTitle={PROFILE_SECTION_KIND_LABELS.character_middot}
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
      <CharacterDevelopmentSection
        awards={awards}
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
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)',
  letterSpacing: '0.06em',
}

const MSG_ERR: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--crimson)',
  letterSpacing: '0.06em',
}
