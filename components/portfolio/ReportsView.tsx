'use client'

// ============================================================
// components/portfolio/ReportsView.tsx
//
// Historical report card / assessment document list + uploader.
// Rendered on /portfolio/[studentId]/full as the "Reports" page.
//
// Teachers and admins can upload report cards from any school —
// including years that predate the student's enrollment here —
// so academic_year / term / grade_level are descriptive, not FKs.
// ============================================================

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ReportCard, UserRole } from '@/lib/types'
import { ACADEMIC_YEAR_OPTIONS, TERM_OPTIONS, GRADE_SELECT_OPTIONS } from '@/lib/constants'
import s from './sections.module.css'

interface Props {
  reportCards:         ReportCard[]
  studentId:           string
  role:                UserRole
  academicYear?:       string
  gradeLevel?:         string
  scrollingPortfolio?: React.ReactNode
}

// ── Helpers ───────────────────────────────────────────────────

const TERM_ORDER: Record<string, number> = { Fall: 0, Winter: 1, Spring: 2 }
function termOrdinal(term: string | null | undefined): number {
  if (!term) return -1
  const key = term.split(' ')[0]
  return TERM_ORDER[key] ?? -1
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Styles (inline to keep CSS co-located with the one component) ──

const label: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }
const inp:   React.CSSProperties = { padding: '6px 10px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)' }
const sel:   React.CSSProperties = { ...inp, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', cursor: 'pointer' }
const btn:   React.CSSProperties = { padding: '12px 22px', minHeight: 44, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream)', background: 'var(--navy)', border: '1px solid var(--navy)', cursor: 'pointer' }
const tag:   React.CSSProperties = { display: 'inline-block', padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-light)', background: 'var(--cream)', border: '1px solid var(--rule)', marginRight: '0.4rem' }

// ── Component ─────────────────────────────────────────────────

export default function ReportsView({
  reportCards, studentId, role, academicYear = '', gradeLevel = '', scrollingPortfolio,
}: Props) {
  const router = useRouter()
  const isStaff = role === 'admin' || role === 'teacher'

  const [title,    setTitle]    = useState('')
  const [descText, setDescText] = useState('')
  const [year,     setYear]     = useState<string>(academicYear && ACADEMIC_YEAR_OPTIONS.includes(academicYear as typeof ACADEMIC_YEAR_OPTIONS[number]) ? academicYear : '')
  const [term,     setTerm]     = useState('')
  const [grade,    setGrade]    = useState<string>(gradeLevel || '')
  const [file,     setFile]     = useState<File | null>(null)
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState<string | null>(null)
  const [showScrolling, setShowScrolling] = useState(false)

  const sorted = useMemo(() => {
    return [...reportCards].sort((a, b) => {
      const y = (b.academicYear ?? '').localeCompare(a.academicYear ?? '')
      if (y !== 0) return y
      return termOrdinal(b.term) - termOrdinal(a.term)
    })
  }, [reportCards])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!title.trim()) return setErr('Title is required.')
    if (!year)         return setErr('Academic year is required.')
    if (!file)         return setErr('Please choose a file.')

    setBusy(true)
    const fd = new FormData()
    fd.set('title', title.trim())
    if (descText.trim()) fd.set('description', descText.trim())
    fd.set('academicYear', year)
    if (term)  fd.set('term', term)
    if (grade) fd.set('gradeLevel', grade)
    fd.set('file', file)

    try {
      const res = await fetch(`/api/dashboard/students/${studentId}/report-cards`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Upload failed.')
      }
      setTitle(''); setDescText(''); setTerm(''); setFile(null)
      const fileInput = document.getElementById('report-card-file') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      router.refresh()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="reports">
      <div className={`${s.sectionHeader} reveal`}>
        <h2 className={s.sectionTitle}>Reports</h2>
        <div className={s.sectionRule} />
      </div>
      <p className="reveal" style={{ fontSize: '13px', color: 'var(--ink-light)', marginBottom: '2rem', maxWidth: 560, lineHeight: 1.55 }}>
        Historical report cards and assessment documents. Teachers can upload report cards from any school — even years before the student enrolled here.
      </p>

      {isStaff && (
        <form onSubmit={onSubmit} className="reveal" style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem 1.25rem', maxWidth: 760 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <span style={label}>Title *</span>
              <input style={inp} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fall 2024 Progress Report" maxLength={200} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={label}>Academic Year *</span>
              <select style={sel} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Select year…</option>
                {ACADEMIC_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={label}>Term</span>
              <select style={sel} value={term} onChange={(e) => setTerm(e.target.value)}>
                <option value="">—</option>
                {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={label}>Grade Level</span>
              <select style={sel} value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">—</option>
                {GRADE_SELECT_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <span style={label}>Description</span>
              <textarea style={{ ...inp, fontFamily: 'var(--font-body)', resize: 'vertical' }} rows={2} value={descText} onChange={(e) => setDescText(e.target.value)} placeholder="Optional notes about this report…" maxLength={1000} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <span style={label}>File (PDF or image)</span>
              <input id="report-card-file" type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }} />
            </div>
          </div>
          {err && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#b23' }}>{err}</p>}
          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Uploading…' : 'Upload Report Card'}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="reveal" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          No report cards uploaded yet.
        </p>
      ) : (
        <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sorted.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1.5rem', padding: '1rem 1.25rem', border: '1px solid var(--rule)', background: 'var(--cream)' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.35rem' }}>{r.title}</div>
                <div style={{ marginBottom: r.description ? '0.4rem' : 0 }}>
                  <span style={tag}>{r.academicYear}</span>
                  {r.term       && <span style={tag}>{r.term}</span>}
                  {r.gradeLevel && <span style={tag}>Gr {r.gradeLevel}</span>}
                </div>
                {r.description && (
                  <div style={{ fontSize: '13px', color: 'var(--ink-light)', lineHeight: 1.5 }}>{r.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                  {fmtDate(r.createdAt)}
                </div>
                {r.publicUrl && (
                  <a href={r.publicUrl} target="_blank" rel="noopener noreferrer" download style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--navy)', background: 'transparent' }}>
                    ↓ Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {scrollingPortfolio && (
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--rule)' }}>
          <button
            type="button"
            onClick={() => setShowScrolling((s) => !s)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showScrolling ? '× Hide all sections' : 'View all sections →'}
          </button>
          {showScrolling && <div style={{ marginTop: '1.5rem' }}>{scrollingPortfolio}</div>}
        </div>
      )}
    </section>
  )
}
