// ============================================================
// lib/uploadValidation.ts
//
// Shared validation primitives for the upload flow. Imported by
// UploadButton (legacy multipart path), DirectUploadButton (signed-
// URL path), and the /sign API route. Keeps the size cap, MIME
// allow-list, and error-message mapping in one place so client and
// server stay in lockstep.
// ============================================================

export type UploadType = 'photo' | 'handwriting' | 'parent_upload'

// Size caps. The legacy multipart path is bounded by Vercel's ~4.5 MB
// body cap regardless of what we declare here, so 4 MB is the honest
// limit there. The signed-URL path bypasses Vercel entirely — uploads
// go straight to Supabase storage — so we can lift caps to type-
// appropriate ceilings.
export const LEGACY_MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB — legacy multipart route

export const MAX_FILE_BYTES: Record<UploadType, number> = {
  photo:         25 * 1024 * 1024,  //  25 MB
  handwriting:   25 * 1024 * 1024,  //  25 MB
  parent_upload: 100 * 1024 * 1024, // 100 MB — covers video / audio
}

export const MIME_ALLOWLIST: Record<UploadType, RegExp> = {
  photo:         /^image\//,
  handwriting:   /^image\//,
  parent_upload: /^(image|audio|video)\/|^application\/pdf$/,
}

export const TYPE_LABEL: Record<UploadType, string> = {
  photo:         'an image',
  handwriting:   'an image',
  parent_upload: 'an image, audio, video, or PDF',
}

/**
 * Maps an HTTP status (and optional server-provided message) to a
 * user-facing error string. Used by both upload buttons so the same
 * status produces the same copy regardless of which transport failed.
 */
export const STORAGE_BUCKET = 'portfolio-assets'

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Returns the per-(school, student, type) storage prefix. /finalize
 * re-validates the client-supplied path against this prefix to keep
 * a parent from spoofing a path under a different student or school.
 */
export function storagePathPrefix(schoolId: string, studentId: string, type: UploadType): string {
  return `${schoolId}/${studentId}/${type}/`
}

/**
 * Constructs a fresh upload path. The timestamp prevents collisions
 * across same-name re-uploads and gives a natural sort order.
 */
export function buildStoragePath(
  schoolId: string,
  studentId: string,
  type: UploadType,
  filename: string,
): string {
  return `${storagePathPrefix(schoolId, studentId, type)}${Date.now()}_${sanitizeFilename(filename)}`
}

export function errorMessageForStatus(status: number, serverMsg?: string | null): string {
  switch (status) {
    case 413: return 'File too large for the server. Please choose a smaller file.'
    case 401: return 'Please sign in again to upload.'
    case 403: return "You don't have permission to upload here."
    case 404: return 'Upload destination not found. Please refresh and try again.'
    default:
      if (status >= 500) return 'Server error during upload. Please try again.'
      return serverMsg ?? 'Upload failed. Please try again.'
  }
}
