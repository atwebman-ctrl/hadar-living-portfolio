'use client'

// Stubbed upload affordance. No drag/click handlers, no input element.
// Renders the visual contract for "you'll be able to drop files here";
// real upload wires in a later phase.

import type { CSSProperties } from 'react'

type Props = { label?: string }

export default function UploadDropZone({
  label = 'Drop files here, or click to upload',
}: Props) {
  return (
    <div style={ZONE}>
      <div style={LABEL}>{label} · coming soon</div>
      <div style={SUB}>Upload not yet enabled</div>
    </div>
  )
}

const ZONE: CSSProperties = {
  border: '1.5px dashed rgba(196, 154, 42, 0.45)',
  borderRadius: 6,
  background: 'rgba(196, 154, 42, 0.04)',
  padding: '32px 24px',
  textAlign: 'center',
}
const LABEL: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
  color: 'var(--ink-mid)', letterSpacing: '0.08em',
  textTransform: 'uppercase',
}
const SUB: CSSProperties = {
  marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 12,
  color: 'var(--ink-faint)', fontStyle: 'italic',
}
