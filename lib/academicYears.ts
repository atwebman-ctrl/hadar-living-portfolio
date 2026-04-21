// ============================================================
// lib/academicYears.ts — Server-only helper to resolve or
// create the academic_years row for (school_id, label).
//
// Uses supabaseAdmin (bypasses RLS). Call from API routes or
// server components only — never from client code.
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'

// Returns the school's current academic year ({id, label}) by reading the
// is_current flag on academic_years. Throws if no current row exists —
// misconfiguration should surface early rather than silently fall back to
// a hardcoded label.
export async function getCurrentAcademicYear(
  schoolId: string,
): Promise<{ id: string; label: string }> {
  const { data, error } = await supabaseAdmin
    .from('academic_years')
    .select('id, label')
    .eq('school_id', schoolId)
    .eq('is_current', true)
    .maybeSingle()

  if (error) {
    throw new Error(`getCurrentAcademicYear: lookup failed — ${error.message}`)
  }
  if (!data) {
    throw new Error(
      `getCurrentAcademicYear: no current academic year set for school ${schoolId}. ` +
      `Mark one row in academic_years as is_current=true.`,
    )
  }
  return { id: data.id as string, label: data.label as string }
}

// Read-only lookup: id → label ("2025-2026"). Used by profile surfaces
// that need to filter time-scoped data by the profile's year (which is
// stored as a FK on profiles.academic_year_id, not as a label).
export async function getAcademicYearLabelById(
  id:       string,
  schoolId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('academic_years')
    .select('label')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (error) {
    throw new Error(`getAcademicYearLabelById: lookup failed — ${error.message}`)
  }
  return (data?.label as string | undefined) ?? null
}

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
