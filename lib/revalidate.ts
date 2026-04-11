// ============================================================
// lib/revalidate.ts
//
// On-demand cache revalidation helpers. Call these in API route
// handlers immediately after a successful write so the Next.js
// data cache is busted and the next portfolio page load fetches
// fresh data from Supabase.
//
// Server-only — never import in client components.
// ============================================================

import { revalidateTag } from 'next/cache'

/**
 * Bust the cached portfolio data for a single student.
 * Call after any write to student-owned tables
 * (assessments, readings, writing_samples, photos, etc.).
 */
export function revalidatePortfolio(studentId: string): void {
  revalidateTag(`portfolio-${studentId}`, 'max')
}
