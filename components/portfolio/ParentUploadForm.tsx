'use client'

// ============================================================
// components/portfolio/ParentUploadForm.tsx
//
// "Upload from Home" inline form for the Parent Uploads section.
// Always visible — no modal. Matches PhotoGallery's inline pattern.
// ============================================================

import { useState } from 'react'
import UploadButton from '@/components/shared/UploadButton'

interface Props {
  studentId:    string
  academicYear: string
  gradeLevel:   string
}

const CATEGORIES = [
  { value: 'art_craft',     label: 'Art / Craft'   },
  { value: 'home_project',  label: 'Home Project'  },
  { value: 'recording',     label: 'Recording'     },
  { value: 'certificate',   label: 'Certificate'   },
  { value: 'photo',         label: 'Photo'         },
  { value: 'other',         label: 'Other'         },
] as const

const sel: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)', cursor: 'pointer' }
const inp: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--rule)' }
const lbl: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mid)' }

const EMPTY = { title: '', category: 'other', description: '' }

export default function ParentUploadForm({ studentId, academicYear, gradeLevel }: Props) {
  const [form, setForm] = useState({ ...EMPTY })
  function update(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })) }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '0 0 0.6rem' }}>
        Fill in details, then upload:
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={lbl}>Title *</span>
          <input
            style={{ ...inp, width: 200 }}
            type="text"
            value={form.title}
            placeholder='e.g. "Shabbat art project"'
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={lbl}>Category</span>
          <select style={sel} value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={lbl}>Description</span>
          <input
            style={{ ...inp, width: 240 }}
            type="text"
            value={form.description}
            placeholder="Tell us about this… (optional)"
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        {form.title.trim() ? (
          <UploadButton
            studentId={studentId}
            uploadType="parent_upload"
            academicYear={academicYear}
            gradeLevel={gradeLevel}
            accept="image/*,audio/*,video/*,.pdf"
            label="+ Upload File"
            metadata={{
              title:              form.title,
              description:        form.description || undefined,
              parent_upload_type: form.category,
            }}
            onSuccess={() => setForm({ ...EMPTY })}
          />
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            Enter a title above to enable upload
          </span>
        )}
      </div>
    </div>
  )
}
