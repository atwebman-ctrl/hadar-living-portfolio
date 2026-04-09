// ============================================================
// lib/modalStyles.ts
// Shared inline-style constants for modal overlays.
// Import MODAL_OVERLAY, MODAL_HEADER, and modalPanel() wherever
// a fixed-overlay modal is needed.
// ============================================================

import type { CSSProperties } from 'react'

export const MODAL_OVERLAY: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}

export const MODAL_HEADER: CSSProperties = {
  background: 'var(--navy)', padding: '0.6rem 1.25rem',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
}

/** Returns the modal panel style. Pass maxWidth/maxHeight to override defaults. */
export function modalPanel(maxWidth = 560, maxHeight = '88vh'): CSSProperties {
  return {
    background: 'var(--cream)', border: '1px solid var(--navy)',
    width: '100%', maxWidth, maxHeight, display: 'flex', flexDirection: 'column',
  }
}
