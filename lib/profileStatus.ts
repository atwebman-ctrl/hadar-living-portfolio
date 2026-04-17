// ============================================================
// lib/profileStatus.ts — Server-only helper to compute the
// "where is this student's profile?" status for a batch of
// students, for a single (school_id, season, academic_year_id).
//
// Used by the dashboard roster to render per-student status
// badges (NOT STARTED / DRAFT X/Y / REVIEW / PUBLISHED).
//
// Uses supabaseAdmin (bypasses RLS). Server-only.
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'
import type { ProfileStatus, ProfileSectionStatus, ProfileSeason } from './types/profileBuilder'

export type StudentProfileStatus =
  | { kind: 'not_started' }
  | { kind: 'in_draft', requiredComplete: number, requiredTotal: number, profileId: string }
  | { kind: 'in_review', profileId: string }
  | { kind: 'published', publishedAt: string, profileId: string }

export async function getProfileStatusesForStudents(
  studentIds: string[],
  schoolId: string,
  season: ProfileSeason,
  academicYearId: string | null | undefined,
): Promise<Map<string, StudentProfileStatus>> {
  const out = new Map<string, StudentProfileStatus>()
  if (!academicYearId || studentIds.length === 0) return out

  // 1. Fetch all profiles for these students in this term.
  const { data: profiles, error: profilesErr } = await supabaseAdmin
    .from('profiles')
    .select('id, student_id, status, published_at')
    .eq('school_id', schoolId)
    .eq('season', season)
    .eq('academic_year_id', academicYearId)
    .in('student_id', studentIds)
    .is('deleted_at', null)

  if (profilesErr) {
    console.error('[profileStatus] profiles fetch failed', profilesErr)
    return out
  }
  if (!profiles || profiles.length === 0) return out

  const profileIds = profiles.map((p) => p.id as string)

  // 2. Tally required-section completion per profile.
  const { data: sections, error: sectionsErr } = await supabaseAdmin
    .from('profile_sections')
    .select('profile_id, status')
    .in('profile_id', profileIds)
    .eq('is_required', true)
    .is('deleted_at', null)

  if (sectionsErr) {
    console.error('[profileStatus] sections fetch failed', sectionsErr)
    // Fall through with zero tallies — in_draft profiles will show 0/0.
  }

  const tallies = new Map<string, { complete: number, total: number }>()
  for (const s of sections ?? []) {
    const pid = s.profile_id as string
    const t = tallies.get(pid) ?? { complete: 0, total: 0 }
    t.total += 1
    if ((s.status as ProfileSectionStatus) === 'complete') t.complete += 1
    tallies.set(pid, t)
  }

  // 3. Build status entries per student.
  for (const p of profiles) {
    const studentId = p.student_id as string
    const profileId = p.id as string
    const status    = p.status as ProfileStatus

    if (status === 'in_review') {
      out.set(studentId, { kind: 'in_review', profileId })
    } else if (status === 'published') {
      out.set(studentId, {
        kind: 'published',
        publishedAt: (p.published_at as string | null) ?? '',
        profileId,
      })
    } else {
      // 'draft' or 'unpublished' both render as in-progress drafts.
      const t = tallies.get(profileId) ?? { complete: 0, total: 0 }
      out.set(studentId, {
        kind: 'in_draft',
        requiredComplete: t.complete,
        requiredTotal:    t.total,
        profileId,
      })
    }
  }

  return out
}
