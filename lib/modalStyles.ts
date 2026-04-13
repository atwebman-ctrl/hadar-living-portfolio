// ============================================================
// lib/modalStyles.ts
// Shared inline-style constants for modal overlays.
// Import MODAL_OVERLAY, MODAL_HEADER, MODAL_BODY, and modalPanel()
// wherever a fixed-overlay modal is needed.
//
// Rule: every modal panel must use:
//   • modalPanel()  — overflow: hidden keeps children from escaping maxHeight
//   • MODAL_BODY    — flex: 1 + minHeight: 0 + overflowY: auto constrains
//                     the scroll area to the space left after the header
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

/**
 * Standard scrollable content area inside a modal panel.
 * Must be a direct flex child of modalPanel() — gives it the
 * remaining height after the header and allows it to scroll.
 */
export const MODAL_BODY: CSSProperties = {
  flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.25rem',
}

/** Returns the modal panel style. Pass maxWidth/maxHeight to override defaults. */
export function modalPanel(maxWidth = 560, maxHeight = '88vh'): CSSProperties {
  return {
    position: 'relative', zIndex: 501,
    background: 'var(--cream)', border: '1px solid var(--navy)',
    width: '100%', maxWidth, maxHeight, display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }
}
