// ============================================================
// lib/storage.ts
//
// Single source of truth for resolving storage paths in the
// `portfolio-assets` bucket to public URLs. Synchronous — no
// network call. Requires the bucket to be set to public in the
// Supabase dashboard (Storage → Policies → Public bucket).
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'

const STORAGE_BUCKET = 'portfolio-assets'

export function storagePublicUrl(path: string | null): string | null {
  if (!path) return null
  return supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
