'use client'

// ============================================================
// app/dashboard/settings/SettingsUI.tsx
//
// Client UI for the admin settings page. Shows current school
// logo + name, drives the logo upload form, and updates the
// preview optimistically after a successful upload.
// ============================================================

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const MAX_LOGO_BYTES = 2 * 1024 * 1024

interface Props {
  schoolId:       string
  schoolName:     string
  initialLogoUrl: string | null
}

export default function SettingsUI({ schoolName, initialLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Logo must be an image file.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo exceeds the 2 MB limit.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/dashboard/settings/logo', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as { logoUrl?: string; error?: string }
      if (!res.ok || !body.logoUrl) {
        setError(body.error ?? 'Upload failed.')
        return
      }
      setLogoUrl(body.logoUrl)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--navy)',
          borderBottom: '2px solid var(--gold)',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
            Admin · Settings
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--gold-pale)', margin: 0 }}>
            School Settings
          </h1>
        </div>
        <Link
          href="/dashboard"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            border: '1px solid rgba(196,154,42,0.5)',
            padding: '0.4rem 0.8rem',
          }}
        >
          ← Dashboard
        </Link>
      </header>

      <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
        {/* School Identity */}
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHeading>School Identity</SectionHeading>
          <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Logo preview */}
              <div style={{ flexShrink: 0 }}>
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${schoolName} logo`}
                    width={240}
                    height={120}
                    style={{ height: 'auto', maxHeight: 120, width: 'auto', maxWidth: 240, display: 'block' }}
                  />
                ) : (
                  <div
                    aria-label="No logo uploaded"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      border: '1px solid var(--rule)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '2.5rem',
                      color: 'var(--ink-faint)',
                      background: 'var(--cream)',
                    }}
                  >
                    {schoolName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <FieldLabel>Logo</FieldLabel>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-light)', margin: '0 0 0.9rem', lineHeight: 1.5 }}>
                  PNG, JPG, WEBP, GIF, or SVG — 2 MB max. Shown below the portfolio hub cards.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleFile(f)
                  }}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '0.55rem 1rem',
                    background: 'var(--navy)',
                    color: 'var(--gold-pale)',
                    border: '1px solid var(--gold)',
                    cursor: uploading ? 'wait' : 'pointer',
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload Logo'}
                </button>
                {error && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#a33', margin: '0.75rem 0 0' }}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* School Name */}
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHeading>School Name</SectionHeading>
          <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', padding: '1.5rem' }}>
            <FieldLabel>Name</FieldLabel>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--ink)', margin: '0 0 0.75rem' }}>
              {schoolName}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', margin: 0 }}>
              Renaming a school affects every portfolio and cached page. Contact support to change the school name.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.1rem',
        color: 'var(--navy)',
        margin: '0 0 0.75rem',
        paddingBottom: '0.4rem',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      {children}
    </h2>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--ink-light)',
        margin: '0 0 0.4rem',
      }}
    >
      {children}
    </p>
  )
}
