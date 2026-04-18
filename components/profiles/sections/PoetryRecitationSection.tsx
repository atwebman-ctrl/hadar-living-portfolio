'use client'

// ============================================================
// components/profiles/sections/PoetryRecitationSection.tsx
//
// Body for the Rhetoric · Poetry Recitation section editor.
// Accepts a video URL (YouTube / Vimeo / Google Drive), embeds
// the recognised provider in an iframe, and pairs it with the
// standard narrative editor.
// ============================================================

import { useState, type CSSProperties } from 'react'
import { parseVideoUrl, type VideoProvider } from '@/lib/videoEmbed'
import UploadDropZone from './UploadDropZone'

type Props = {
  videoUrl:          string | null
  title:             string | null
  narrative:         string
  onNarrativeChange: (next: string) => void
  onVideoUrlSave:    (next: string) => void
  isGenerating:      boolean
  onGenerateDraft:   () => void
  isSavingVideo:     boolean
  videoSaveMessage:  string | null
}

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube:      'YouTube',
  vimeo:        'Vimeo',
  google_drive: 'Google Drive',
  unknown:      'Unrecognised host',
}

function VideoEmbedBlock({ url }: { url: string }) {
  const info = parseVideoUrl(url)
  if (!info.embedUrl) {
    return (
      <div style={FALLBACK}>
        <div style={FALLBACK_HEAD}>
          Video link set, but the platform isn&apos;t supported for embed preview.
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={FALLBACK_LINK}>
          Open link →
        </a>
      </div>
    )
  }
  return (
    <div style={EMBED_WRAP}>
      <iframe
        src={info.embedUrl}
        title="Poetry recitation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={IFRAME}
      />
      <div style={PROVIDER_NOTE}>Provider: {PROVIDER_LABEL[info.provider]}</div>
    </div>
  )
}

export default function PoetryRecitationSection({
  videoUrl, title, narrative,
  onNarrativeChange, onVideoUrlSave,
  isGenerating, onGenerateDraft,
  isSavingVideo, videoSaveMessage,
}: Props) {
  const [urlInput, setUrlInput] = useState<string>(videoUrl ?? '')
  const dirtyUrl = urlInput.trim() !== (videoUrl ?? '').trim()

  return (
    <>
      <div style={SECTION_LABEL}>Poetry Recitation</div>

      <div style={URL_BLOCK}>
        <div style={SUB_LABEL}>Recitation video</div>
        <div style={URL_ROW}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube, Vimeo, or Google Drive link"
            style={URL_INPUT}
          />
          <button
            type="button"
            onClick={() => onVideoUrlSave(urlInput.trim())}
            disabled={isSavingVideo || !dirtyUrl || urlInput.trim().length === 0}
            style={{
              ...SAVE_BTN,
              opacity: isSavingVideo || !dirtyUrl || urlInput.trim().length === 0 ? 0.5 : 1,
            }}
          >
            {isSavingVideo ? 'Saving…' : 'Save video URL'}
          </button>
        </div>
        <div style={HELPER}>
          If using Google Drive, set sharing to &ldquo;Anyone with the link can view.&rdquo;
        </div>
        {videoSaveMessage && <div style={SAVE_MSG}>{videoSaveMessage}</div>}
      </div>

      {videoUrl ? (
        <VideoEmbedBlock url={videoUrl} />
      ) : (
        <div style={EMPTY_VIDEO}>No video saved yet for this term.</div>
      )}

      {title && <div style={TITLE_LINE}>{title}</div>}

      <div style={DROPZONE_WRAP}>
        <UploadDropZone label="Upload photo with bronze medal" />
      </div>

      <div style={NARRATIVE_BLOCK}>
        <div style={NARRATIVE_HEADER}>
          <div style={SECTION_LABEL}>Narrative</div>
          <button
            type="button"
            onClick={onGenerateDraft}
            disabled={isGenerating}
            style={{ ...DRAFT_BTN, opacity: isGenerating ? 0.6 : 1 }}
          >
            {isGenerating ? 'Drafting…' : 'Generate draft'}
          </button>
        </div>
        <textarea
          value={narrative}
          onChange={(e) => onNarrativeChange(e.target.value)}
          placeholder="Write the poetry recitation narrative, or use Generate draft to start with a Quire-drafted paragraph you can edit."
          style={TEXTAREA}
        />
        <div style={CHAR_COUNT}>{narrative.length} / 10000</div>
      </div>
    </>
  )
}

// ── styles ────────────────────────────────────────────────────

const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 8,
}
const SUB_LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--ink-faint)', marginBottom: 6,
}
const URL_BLOCK: CSSProperties = { marginBottom: 20 }
const URL_ROW: CSSProperties = { display: 'flex', gap: 10, alignItems: 'stretch' }
const URL_INPUT: CSSProperties = {
  flex: 1, padding: '10px 12px',
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 4,
  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)',
  outline: 'none',
}
const SAVE_BTN: CSSProperties = {
  padding: '0 16px', background: 'var(--gold)', color: 'var(--white)',
  border: 'none', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}
const HELPER: CSSProperties = {
  marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 12,
  fontStyle: 'italic', color: 'var(--ink-faint)',
}
const SAVE_MSG: CSSProperties = {
  marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
  color: 'var(--teal)', letterSpacing: '0.06em',
}
const EMBED_WRAP: CSSProperties = { marginBottom: 16 }
const IFRAME: CSSProperties = {
  width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 6,
  background: 'var(--ink)',
}
const PROVIDER_NOTE: CSSProperties = {
  marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}
const FALLBACK: CSSProperties = {
  marginBottom: 16, padding: 16,
  border: '1px solid var(--rule)', borderRadius: 6, background: 'var(--cream)',
}
const FALLBACK_HEAD: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-mid)',
  marginBottom: 6,
}
const FALLBACK_LINK: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const EMPTY_VIDEO: CSSProperties = {
  marginBottom: 16, padding: '20px 16px', textAlign: 'center',
  border: '1px dashed var(--rule)', borderRadius: 6,
  fontFamily: 'var(--font-body)', fontSize: 13, fontStyle: 'italic',
  color: 'var(--ink-faint)',
}
const TITLE_LINE: CSSProperties = {
  marginBottom: 16,
  fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--navy)',
}
const DROPZONE_WRAP: CSSProperties = { marginTop: 20 }
const NARRATIVE_BLOCK: CSSProperties = { marginTop: 28 }
const NARRATIVE_HEADER: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 8,
}
const DRAFT_BTN: CSSProperties = {
  height: 32, padding: '0 14px', background: 'transparent', color: 'var(--gold)',
  border: '1px solid var(--gold)', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
}
const TEXTAREA: CSSProperties = {
  width: '100%', minHeight: 220, padding: 14,
  background: 'var(--cream)', border: '1px solid var(--rule)', borderRadius: 6,
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
  color: 'var(--ink)', resize: 'vertical', outline: 'none',
}
const CHAR_COUNT: CSSProperties = {
  marginTop: 6, textAlign: 'right',
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
}
