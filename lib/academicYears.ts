// ============================================================
// lib/academicYears.ts — Server-only helper to resolve or
// create the academic_years row for (school_id, label).
//
// Uses supabaseAdmin (bypasses RLS). Call from API routes or
// server components only — never from client code.
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'

// Read-only lookup: returns the row id if it exists, null otherwise.
// Use this from read-path code (dashboard, lists) where creating a row
// as a side effect of a GET would be inappropriate.
export async function getAcademicYearId(
  schoolId: string,
  label: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('academic_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('label', label)
    .maybeSingle()

  if (error) {
    throw new Error(`getAcademicYearId: lookup failed — ${error.message}`)
  }
  return (data?.id as string | undefined) ?? null
}

export async function getOrCreateAcademicYearId(
  schoolId: string,
  label: string,
): Promise<string> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('academic_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('label', label)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`getOrCreateAcademicYearId: lookup failed — ${lookupError.message}`)
  }
  if (existing?.id) return existing.id as string

  // Defensive parse — the API route already validates the label shape,
  // but this helper has no other guarantee.
  const m = label.match(/^(\d{4})-(\d{4})$/)
  if (!m) {
    throw new Error(`getOrCreateAcademicYearId: invalid label "${label}" — expected YYYY-YYYY`)
  }
  const [, year1, year2] = m

  // TODO: replace these defaults with admin-configurable start/end dates
  // per school. Aug 1 → Jun 30 is a sensible default for US classical
  // school calendars; good enough until a year-management UI lands.
  const startDate = `${year1}-08-01`
  const endDate   = `${year2}-06-30`

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('academic_years')
    .insert({
      school_id:  schoolId,
      label,
      start_date: startDate,
      end_date:   endDate,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    throw new Error(
      `getOrCreateAcademicYearId: insert failed — ${insertError?.message ?? 'unknown'}`,
    )
  }
  return inserted.id as string
}
