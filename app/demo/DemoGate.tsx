'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/demo/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '3rem 2.5rem',
        border: '1px solid var(--rule)',
        background: 'var(--parchment)',
      }}>
        <p style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '9px',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-light)',
          marginBottom: '1.5rem',
        }}>
          Demo Access
        </p>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.5rem',
          color: 'var(--navy)',
          marginBottom: '0.5rem',
          fontWeight: 400,
        }}>
          Student Portfolio Preview
        </h1>

        <p style={{
          fontFamily: 'Lora, serif',
          fontSize: '0.9rem',
          color: 'var(--ink-mid)',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}>
          Enter the demo password to view a sample student portfolio.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              border: '1px solid var(--rule)',
              background: 'var(--cream)',
              fontFamily: 'Lora, serif',
              fontSize: '0.9rem',
              color: 'var(--ink)',
              marginBottom: '1rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />

          {error && (
            <p style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.75rem',
              color: '#8B1A1A',
              marginBottom: '1rem',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem',
              background: 'var(--navy)',
              color: 'var(--cream)',
              fontFamily: 'DM Mono, monospace',
              fontSize: '9px',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
