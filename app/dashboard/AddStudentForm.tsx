'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Shared style tokens
const S = {
  input: {
    width: '100%', padding: '0.5rem 0.75rem',
    fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--ink)', background: 'var(--white)',
    border: '1px solid var(--rule)', outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--ink-light)', marginBottom: '0.35rem',
  } as React.CSSProperties,
  btn: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '0.55rem 1.25rem', cursor: 'pointer',
  } as React.CSSProperties,
}

type Fields = { firstName: string; lastName: string; gradeLevel: string; academicYear: string }
const EMPTY: Fields = { firstName: '', lastName: '', gradeLevel: '', academicYear: '' }

export default function AddStudentForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fields, setFields] = useState<Fields>(EMPTY)

  const handleClose = () => { setOpen(false); setApiError(null); setFields(EMPTY) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/dashboard/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const body: { error?: string } = await res.json()
        throw new Error(body.error ?? 'Failed to create student.')
      }
      handleClose()
      router.refresh()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ ...S.btn, color: 'var(--gold-pale)', background: 'transparent', border: '1px solid var(--gold)' }}
      >
        + Add Student
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(21, 42, 71, 0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', width: '100%', maxWidth: '480px', margin: '1rem' }}>

            {/* Modal header */}
            <div style={{ background: 'var(--navy)', borderBottom: '2px solid var(--gold)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 id="add-student-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-pale)', margin: 0 }}>
                Add Student
              </h2>
              <button type="button" onClick={handleClose} aria-label="Close"
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0.2rem 0.4rem' }}>
                ×
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <Field label="First Name" htmlFor="firstName">
                  <input id="firstName" name="firstName" type="text" required autoComplete="given-name"
                    value={fields.firstName} onChange={handleChange} style={S.input} />
                </Field>
                <Field label="Last Name" htmlFor="lastName">
                  <input id="lastName" name="lastName" type="text" required autoComplete="family-name"
                    value={fields.lastName} onChange={handleChange} style={S.input} />
                </Field>
              </div>

              <Field label="Grade Level" htmlFor="gradeLevel">
                <input id="gradeLevel" name="gradeLevel" type="text" required placeholder="e.g. 3rd Grade"
                  value={fields.gradeLevel} onChange={handleChange} style={S.input} />
              </Field>

              <Field label="Academic Year" htmlFor="academicYear">
                <input id="academicYear" name="academicYear" type="text" required
                  placeholder="e.g. 2025-2026" pattern="\d{4}-\d{4}" title="Format: YYYY-YYYY"
                  value={fields.academicYear} onChange={handleChange} style={S.input} />
              </Field>

              {apiError && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--crimson)', margin: '0 0 1rem' }}>
                  {apiError}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleClose}
                  style={{ ...S.btn, color: 'var(--ink-mid)', background: 'transparent', border: '1px solid var(--rule)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ ...S.btn, color: loading ? 'var(--ink-light)' : 'var(--gold-pale)', background: loading ? 'var(--navy-deep)' : 'var(--navy)', border: '1px solid var(--gold)', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving…' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={htmlFor} style={S.label}>{label}</label>
      {children}
    </div>
  )
}
