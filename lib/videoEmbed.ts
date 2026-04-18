// ============================================================
// lib/videoEmbed.ts
//
// Single-source video URL parser. Maps a watch/share link from
// YouTube, Vimeo, or Google Drive into the iframe-ready embed
// URL plus a provider tag. Returns embedUrl: null for hosts we
// don't recognise so callers can render a fallback link-out.
//
// Three older copies of this logic live in:
//   components/portfolio/RhetoricRoom.tsx
//   components/portfolio/EnglishVideoTab.tsx
//   components/portfolio/HebrewVideoTab.tsx
// They will be migrated to this helper in a follow-up commit.
// ============================================================

export type VideoProvider = 'youtube' | 'vimeo' | 'google_drive' | 'unknown'

export interface EmbedInfo {
  provider:    VideoProvider
  embedUrl:    string | null
  originalUrl: string
}

const DRIVE_FILE_ID = /\/file\/d\/([^/]+)/

export function parseVideoUrl(url: string): EmbedInfo {
  const fallback: EmbedInfo = { provider: 'unknown', embedUrl: null, originalUrl: url }
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return fallback
  }

  const host = u.hostname.toLowerCase()

  // ── YouTube ────────────────────────────────────────────────
  if (host.endsWith('youtube.com') || host === 'youtu.be') {
    let id: string | null = null
    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('?')[0] || null
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.slice('/shorts/'.length).split('/')[0] || null
    } else {
      id = u.searchParams.get('v')
    }
    return {
      provider:    'youtube',
      embedUrl:    id ? `https://www.youtube.com/embed/${id}` : null,
      originalUrl: url,
    }
  }

  // ── Vimeo ──────────────────────────────────────────────────
  if (host.endsWith('vimeo.com')) {
    const id = u.pathname.replace(/^\//, '').split('/')[0] || null
    return {
      provider:    'vimeo',
      embedUrl:    id ? `https://player.vimeo.com/video/${id}` : null,
      originalUrl: url,
    }
  }

  // ── Google Drive ───────────────────────────────────────────
  if (host.endsWith('drive.google.com')) {
    const m = u.pathname.match(DRIVE_FILE_ID)
    const id = m ? m[1] : null
    return {
      provider:    'google_drive',
      embedUrl:    id ? `https://drive.google.com/file/d/${id}/preview` : null,
      originalUrl: url,
    }
  }

  return fallback
}
