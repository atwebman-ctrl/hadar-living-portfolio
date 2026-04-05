'use client'

// ============================================================
// components/shared/InviteParentButton.tsx
//
// Gold-outlined "Invite Parent" button that opens a modal with
// an email input. POSTs to the invite-parent API route on submit.
// Shows inline success or error feedback. No page refresh needed.
//
// Props
//   studentId — the student whose portfolio the parent will access
// ============================================================

import { useRef, useState } from 'react'

interface Props {
  studentId: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

// ── Styles ────────────────────────────────────────────────────

const S = {
  triggerBtn: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color:         'var(--gold)',
    background:    'transparent',
    border:        '1px solid var(--gold)',
    padding:       '0.45rem 0.9rem',
    cursor:        'pointer',
  } as React.CSSProperties,

  overlay: {
    position:        'fixed' as const,
    inset:           0,
    background:      'rgba(0,0,0,0.45)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
    padding:         '1rem',
  } as React.CSSProperties,

  modal: {
    background:  'var(--parchment)',
    border:      '1px solid var(--rule)',
    padding:     '2rem 2.25rem',
    width:       '100%',
    maxWidth:    '26rem',
  } as React.CSSProperties,

  eyebrow: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.6rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color:         'var(--ink-faint)',
    margin:        '0 0 0.5rem',
  } as React.CSSProperties,

  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize:   '1.25rem',
    color:      'var(--navy)',
    margin:     '0 0 1.25rem',
  } as React.CSSProperties,

  label: {
    display:       'block',
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.62rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color:         'var(--ink-light)',
    marginBottom:  '0.4rem',
  } as React.CSSProperties,

  input: {
    width:       '100%',
    fontFamily:  'var(--font-body)',
    fontSize:    '0.9rem',
    color:       'var(--ink)',
    background:  'var(--cream)',
    border:      '1px solid var(--rule)',
    padding:     '0.5rem 0.65rem',
    outline:     'none',
    boxSizing:   'border-box' as const,
    marginBottom: '1rem',
  } as React.CSSProperties,

  actions: {
    display: 'flex',
    gap:     '0.6rem',
  } as React.CSSProperties,

  btn: (variant: 'primary' | 'ghost', disabled: boolean) => ({
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding:       '0.45rem 1rem',
    border:        '1px solid',
    background:    'transparent',
    cursor:        disabled ? 'default' : 'pointer',
    opacity:       disabled ? 0.5 : 1,
    borderColor:   variant === 'primary' ? 'var(--navy)' : 'var(--rule)',
    color:         variant === 'primary' ? 'var(--navy)' : 'var(--ink-light)',
  } as React.CSSProperties),

  success: {
    fontFamily:  'var(--font-mono)',
    fontSize:    '0.72rem',
    color:       '#4A7C59',
    marginTop:   '0.75rem',
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  error: {
    fontFamily:  'var(--font-mono)',
    fontSize:    '0.72rem',
    color:       '#8B2020',
    marginTop:   '0.75rem',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────

export default function InviteParentButton({ studentId }: Props) {
  const [open,    setOpen]    = useState(false)
  const [email,   setEmail]   = useState('')
  const [state,   setState]   = useState<SubmitState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function openModal() {
    setEmail('')
    setState('idle')
    setMessage(null)
    setOpen(true)
    // Focus input after paint
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeModal() {
    if (state === 'loading') return
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'loading') return

    setState('loading')
    setMessage(null)

    try {
      const res = await fetch(
        `/api/dashboard/students/${studentId}/invite-parent`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email.trim() }),
        },
      )
      const data = await res.json().catch(() => ({})) as { error?: string }

      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setState('success')
      setMessage(`Invitation sent to ${email.trim()}.`)
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <>
      <button style={S.triggerBtn} onClick={openModal} type="button">
        Invite Parent
      </button>

      {open && (
        /* Backdrop */
        <div style={S.overlay} onClick={closeModal} role="dialog" aria-modal="true" aria-label="Invite parent">
          {/* Modal — stop click propagation so backdrop click doesn't close from inside */}
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <p style={S.eyebrow}>Portfolio Access</p>
            <h2 style={S.heading}>Invite a Parent</h2>

            {state === 'success' ? (
              <>
                <p style={S.success}>{message}</p>
                <div style={{ marginTop: '1.25rem', ...S.actions }}>
                  <button
                    style={S.btn('ghost', false)}
                    type="button"
                    onClick={() => { setOpen(false) }}
                  >
                    Close
                  </button>
                  <button
                    style={S.btn('primary', false)}
                    type="button"
                    onClick={() => { setEmail(''); setState('idle'); setMessage(null) }}
                  >
                    Invite Another
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="invite-email" style={S.label}>
                  Parent email address
                </label>
                <input
                  ref={inputRef}
                  id="invite-email"
                  type="email"
                  required
                  style={S.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  disabled={state === 'loading'}
                  autoComplete="email"
                />

                {state === 'error' && message && (
                  <p style={S.error}>{message}</p>
                )}

                <div style={{ marginTop: state === 'error' ? '0.75rem' : 0, ...S.actions }}>
                  <button
                    type="submit"
                    style={S.btn('primary', state === 'loading' || !email.trim())}
                    disabled={state === 'loading' || !email.trim()}
                  >
                    {state === 'loading' ? 'Sending…' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    style={S.btn('ghost', state === 'loading')}
                    disabled={state === 'loading'}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
