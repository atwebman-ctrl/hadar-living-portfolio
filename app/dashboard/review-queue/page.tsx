// ============================================================
// app/dashboard/review-queue/page.tsx
//
// Dr. Worth's review queue — admin-only list of profiles with
// status='in_review'. Each card links to the preview page.
// ============================================================

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { formatGrade } from '@/lib/gradeLevel'

type ReviewQueueRow = {
  id:           string
  term:         string
  season:       string
  updated_at:   string
  student_id:   string
  student_first_name: string
  student_last_name:  string
  student_grade_level: string
}

export default async function ReviewQueuePage() {
  const ctx = await getAuthContext().catch(() => redirect('/sign-in'))

  if (ctx.role !== 'admin') redirect('/dashboard')

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, term, season, updated_at, student_id,
      students!inner ( first_name, last_name, grade_level )
    `)
    .eq('school_id', ctx.schoolId)
    .eq('status', 'in_review')
    .is('deleted_at', null)
    .order('updated_at', { ascending: true })

  if (error) console.error('[review-queue] fetch failed', error)

  const rows: ReviewQueueRow[] = (data ?? []).map((r) => {
    const s = r.students as unknown as {
      first_name: string; last_name: string; grade_level: string
    }
    return {
      id:         r.id as string,
      term:       r.term as string,
      season:     r.season as string,
      updated_at: r.updated_at as string,
      student_id: r.student_id as string,
      student_first_name:  s.first_name,
      student_last_name:   s.last_name,
      student_grade_level: s.grade_level,
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '48px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--ink-faint)', marginBottom: 8,
        }}>
          Head of School · Review queue
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500,
          color: 'var(--navy)', margin: '0 0 24px',
        }}>
          Profiles awaiting your review
        </h1>

        {rows.length === 0 ? (
          <div style={{
            background: 'var(--white)', border: '1px solid var(--rule)',
            borderRadius: 8, padding: '48px 32px', textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-mid)',
          }}>
            No profiles awaiting review.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/review-queue/${r.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--white)', border: '1px solid var(--rule)',
                  borderLeft: '3px solid var(--gold)',
                  borderRadius: 8, padding: '18px 20px',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <div>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 500,
                    color: 'var(--navy)',
                  }}>
                    {r.student_first_name} {r.student_last_name}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-mid)',
                    marginTop: 4,
                  }}>
                    {r.term} · {formatGrade(r.student_grade_level)} · submitted {formatSubmittedAt(r.updated_at)}
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--gold)',
                }}>
                  Review →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatSubmittedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
