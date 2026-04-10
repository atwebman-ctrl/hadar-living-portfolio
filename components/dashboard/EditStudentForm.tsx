'use client'

// ============================================================
// components/dashboard/EditStudentForm.tsx
//
// "Edit" trigger button + pre-populated modal for updating a
// student record. Visible to admin/teacher only (caller gates).
// PATCHes /api/dashboard/students/[id] and calls router.refresh()
// on success. Mirrors AddStudentForm field layout.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/lib/types'
import {
  GRADE_SELECT_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  GENDER_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
} from '@/lib/constants'
import ProfilePhotoUpload from '@/components/dashboard/ProfilePhotoUpload'

interface Props { student: Student }

// ── Style tokens ──────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={htmlFor} style={S.label}>{label}</label>
      {children}
    </div>
  )
}

function toFields(s: Student) {
  return {
    firstName:        s.firstName,
    lastName:         s.lastName,
    gradeLevel:       s.gradeLevel       ?? '',
    academicYear:     s.academicYear     ?? '',
    gender:           s.gender           ?? '',
    dateOfBirth:      s.dateOfBirth      ?? '',
    enrollmentStatus: s.enrollmentStatus ?? 'active',
  }
}

// ── Component ─────────────────────────────────────────────────

export default function EditStudentForm({ student }: Props) {
  const router    = useRouter()
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fields,   setFields]   = useState(() => toFields(student))

  const handleOpen  = () => { setFields(toFields(student)); setApiError(null); setOpen(true) }
  const handleClose = () => { setOpen(false); setApiError(null) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)
    try {
      const body = {
        ...fields,
        gender:      fields.gender      || null,
        dateOfBirth: fields.dateOfBirth || null,
      }
      const res = await fetch(`/api/dashboard/students/${student.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json()
        throw new Error(data.error ?? 'Failed to update student.')
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
        onClick={(e) => { e.preventDefault(); handleOpen() }}
        className="db-edit-btn"
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(139,115,85,0.6)', background: 'none',
          border: 'none', padding: 0, cursor: 'pointer',
        }}
        title="Edit student"
      >
        ✎ Edit
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-student-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(21,42,71,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div style={{ background: 'var(--parchment)', border: '1px solid var(--rule)', width: '100%', maxWidth: '480px', margin: '1rem' }}>

            <div style={{ background: 'var(--navy)', borderBottom: '2px solid var(--gold)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 id="edit-student-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-pale)', margin: 0 }}>
                Edit Student
              </h2>
              <button type="button" onClick={handleClose} aria-label="Close"
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0.2rem 0.4rem' }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              {/* Profile photo */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ProfilePhotoUpload
                  studentId={student.id}
                  profilePhotoPath={student.profilePhotoPath ?? null}
                  firstName={student.firstName}
                  lastName={student.lastName}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <Field label="First Name" htmlFor="edit-firstName">
                  <input id="edit-firstName" name="firstName" type="text" required autoComplete="given-name"
                    value={fields.firstName} onChange={handleChange} style={S.input} />
                </Field>
                <Field label="Last Name" htmlFor="edit-lastName">
                  <input id="edit-lastName" name="lastName" type="text" required autoComplete="family-name"
                    value={fields.lastName} onChange={handleChange} style={S.input} />
                </Field>
              </div>

              <Field label="Grade Level" htmlFor="edit-gradeLevel">
                <select id="edit-gradeLevel" name="gradeLevel" required
                  value={fields.gradeLevel} onChange={handleChange}
                  style={{ ...S.input, appearance: 'auto' }}>
                  <option value="">Select grade…</option>
                  {GRADE_SELECT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Academic Year" htmlFor="edit-academicYear">
                <select id="edit-academicYear" name="academicYear" required
                  value={fields.academicYear} onChange={handleChange}
                  style={{ ...S.input, appearance: 'auto' }}>
                  <option value="">Select year…</option>
                  {ACADEMIC_YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <Field label="Gender" htmlFor="edit-gender">
                  <select id="edit-gender" name="gender"
                    value={fields.gender} onChange={handleChange}
                    style={{ ...S.input, appearance: 'auto' }}>
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date of Birth" htmlFor="edit-dateOfBirth">
                  <input id="edit-dateOfBirth" name="dateOfBirth" type="date"
                    value={fields.dateOfBirth} onChange={handleChange} style={S.input} />
                </Field>
              </div>

              <Field label="Enrollment Status" htmlFor="edit-enrollmentStatus">
                <select id="edit-enrollmentStatus" name="enrollmentStatus"
                  value={fields.enrollmentStatus} onChange={handleChange}
                  style={{ ...S.input, appearance: 'auto' }}>
                  {ENROLLMENT_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
