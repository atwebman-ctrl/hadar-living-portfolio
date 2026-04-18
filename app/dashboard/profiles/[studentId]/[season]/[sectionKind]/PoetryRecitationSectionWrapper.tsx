'use client'

// ============================================================
// PoetryRecitationSectionWrapper.tsx
//
// Client wrapper. Owns local state for:
//   - the narrative editor (PATCHed to profile_sections)
//   - the video URL (POSTed to student_videos via the upsert
//     endpoint at /api/dashboard/students/[studentId]/videos)
// ============================================================

import { useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  PROFILE_SECTION_KIND_LABELS,
  type ProfileSectionStatus,
} from '@/lib/types/profileBuilder'
import SectionEditorShell from '@/components/profiles/sections/SectionEditorShell'
import PoetryRecitationSection from '@/components/profiles/sections/PoetryRecitationSection'

const ATHENA_POETRY_DRAFT =
  "Athena memorized and recited ten bronze-level poems this year, standing before the school to share them aloud. Classical education begins the long work of rhetoric not with argument but with recitation — the child's first contribution to the tradition is to lend her voice to words already worth hearing. Her willingness to stand and speak them is the beginning of her formation as a speaker, and as a witness to what is excellent."

type Props = {
  profileId:         string
  sectionId:         string
  studentId:         string
  initialNarrative:  string
  initialStatus:     ProfileSectionStatus
  studentName:       string
  gradeLabel:        string
  termLabel:         string
  backHref:          string
  initialVideoUrl:   string | null
  initialVideoTitle: string | null
}

export default function PoetryRecitationSectionWrapper({
  profileId, sectionId, studentId,
  initialNarrative, initialStatus,
  studentName, gradeLabel, termLabel, backHref,
  initialVideoUrl, initialVideoTitle,
}: Props) {
  const router = useRouter()
  const [narrative, setNarrative]       = useState<string>(initialNarrative)
  const [status, setStatus]             = useState<ProfileSectionStatus>(initialStatus)
  const [isSaving, startSavingTransition] = useTransition()
  const [saveMessage, setSaveMessage]   = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl)
  const [isSavingVideo, setIsSavingVideo] = useState(false)
  const [videoSaveMessage, setVideoSaveMessage] = useState<string | null>(null)

  const dirty = narrative !== initialNarrative || status !== initialStatus

  async function patchSection(payload: {
    narrativeText?:  string | null
    narrativeDraft?: string | null
    status?:         ProfileSectionStatus
  }) {
    setErrorMessage(null)
    const res = await fetch(
      `/api/dashboard/profiles/${profileId}/sections/${sectionId}`,
      { method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload) },
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
        await patchSection({ narrativeText: narrative, status: 'complete' })
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
      setNarrative(ATHENA_POETRY_DRAFT)
      setIsGenerating(false)
    }, 600)
  }

  async function handleVideoUrlSave(next: string) {
    setIsSavingVideo(true)
    setVideoSaveMessage(null)
    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/videos`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category:   'poetry_recitation',
          videoUrl:   next,
          title:      initialVideoTitle ?? 'Poetry recitation',
          term:       termLabel,
          gradeLevel: gradeLabel.replace(/^Grade\s+/i, '').trim() || gradeLabel,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Save failed.')
      }
      setVideoUrl(next)
      setVideoSaveMessage('Saved.')
      router.refresh()
    } catch (err) {
      setVideoSaveMessage(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setIsSavingVideo(false)
    }
  }

  return (
    <SectionEditorShell
      studentName={studentName}
      gradeLabel={gradeLabel}
      termLabel={termLabel}
      sectionTitle={PROFILE_SECTION_KIND_LABELS.poetry_recitation}
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
      <PoetryRecitationSection
        videoUrl={videoUrl}
        title={initialVideoTitle}
        narrative={narrative}
        onNarrativeChange={(next) => {
          setNarrative(next)
          setSaveMessage(null)
        }}
        onVideoUrlSave={handleVideoUrlSave}
        isGenerating={isGenerating}
        onGenerateDraft={handleGenerateDraft}
        isSavingVideo={isSavingVideo}
        videoSaveMessage={videoSaveMessage}
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
