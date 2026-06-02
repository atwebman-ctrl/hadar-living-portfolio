// ============================================================
// lib/types/profileBuilder.ts
//
// Type definitions for the Learning Profile Builder feature.
// Mirrors the Supabase schema from migration
// 20260417023351_create_profile_builder_tables.sql.
// ============================================================

// ---- Enum-like constants (matches DB CHECK constraints) ----

export const PROFILE_SEASONS = ['fall', 'spring'] as const
export type ProfileSeason = typeof PROFILE_SEASONS[number]

export const PROFILE_STATUSES = ['draft', 'in_review', 'published', 'unpublished'] as const
export type ProfileStatus = typeof PROFILE_STATUSES[number]

export const PROFILE_SECTION_STATUSES = ['not_started', 'in_progress', 'awaiting_review', 'complete'] as const
export type ProfileSectionStatus = typeof PROFILE_SECTION_STATUSES[number]

export const PROFILE_SECTION_KINDS = [
  'maps_scores',
  'lexile',
  'avant_hebrew',
  'hebrew_comparison',
  'canon_reading',
  'english_composition',
  'hebrew_composition',
  'character_middot',
  'poetry_recitation',
  'art_projects',
  'field_trips',
  'custom',
  'scripture',
] as const
export type ProfileSectionKind = typeof PROFILE_SECTION_KINDS[number]

// Human-readable labels for each section kind (for UI rendering).
// Keep aligned with the mockup.
export const PROFILE_SECTION_KIND_LABELS: Record<ProfileSectionKind, string> = {
  maps_scores: 'MAPS · Math & English',
  lexile: 'Lexile · Reading level context',
  avant_hebrew: 'AVANT · Hebrew language proficiency',
  hebrew_comparison: 'Hebrew · National comparison',
  canon_reading: 'Reading · English Canon',
  english_composition: 'English composition',
  hebrew_composition: 'Hebrew composition',
  character_middot: 'Character Development · Middot',
  poetry_recitation: 'Rhetoric · Poetry Recitation',
  art_projects: 'Art & creative projects',
  field_trips: 'Field trips & experiences',
  custom: 'Custom section',
  scripture: 'Scripture · Memory work & devotion',
}

// Which section kinds are REQUIRED by default for a new profile.
// Optional section kinds are only added when the teacher adds them.
// Ordering reflects the classical-education report-card sequence:
// character first, then canon and qualitative classroom work, then
// the foreign-language block, then rhetoric, with standardized
// measurements (Lexile, MAPS) at the end as evidentiary appendix.
//
// Future Phase 8 sections "Mathematics and Logic" and a merged
// "Hebrew · Proficiency, class observations, and national
// comparison" will slot in at positions 4 and 5 respectively when
// they land.
export const REQUIRED_SECTION_KINDS: ProfileSectionKind[] = [
  'character_middot',
  'canon_reading',
  'english_composition',
  'avant_hebrew',
  'hebrew_comparison',
  'hebrew_composition',
  'poetry_recitation',
  'lexile',
  'maps_scores',
]

export const OPTIONAL_SECTION_KINDS: ProfileSectionKind[] = [
  'art_projects',
  'field_trips',
  'custom',
  'scripture',
]

export const ATTACHMENT_KINDS = ['photo', 'video', 'certificate', 'document'] as const
export type AttachmentKind = typeof ATTACHMENT_KINDS[number]

// ---- Row interfaces (mirror DB columns exactly) ----

export interface Profile {
  id: string
  schoolId: string
  studentId: string
  academicYearId: string
  term: string                   // e.g. "Fall 2025-26"
  season: ProfileSeason
  status: ProfileStatus
  draftedBy: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewFeedback: string | null
  publishedAt: string | null
  unpublishedAt: string | null
  unpublishReason: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ProfileSection {
  id: string
  profileId: string
  schoolId: string
  sectionKind: ProfileSectionKind
  sectionOrder: number
  isRequired: boolean
  status: ProfileSectionStatus
  narrativeText: string | null
  narrativeDraft: string | null
  teacherNotesUsed: string[]          // array of teacher_note IDs
  dataSources: Record<string, unknown> // JSONB snapshot at draft time
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ProfileSectionAttachment {
  id: string
  profileSectionId: string
  schoolId: string
  attachmentKind: AttachmentKind
  storagePath: string
  caption: string | null
  displayOrder: number
  uploadedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// ---- Composite types for UI rendering ----

// A profile section with its attachments eagerly loaded.
export interface ProfileSectionWithAttachments extends ProfileSection {
  attachments: ProfileSectionAttachment[]
}

// A full profile with all its sections (used for the profile overview UI).
export interface ProfileWithSections extends Profile {
  sections: ProfileSectionWithAttachments[]
}

// ---- Mapper helper type ----
// When reading from Supabase, rows come back with snake_case. This is the
// shape of the raw row before we camelCase it with mapProfile().
export interface ProfileRow {
  id: string
  school_id: string
  student_id: string
  academic_year_id: string
  term: string
  season: ProfileSeason
  status: ProfileStatus
  drafted_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_feedback: string | null
  published_at: string | null
  unpublished_at: string | null
  unpublish_reason: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProfileSectionRow {
  id: string
  profile_id: string
  school_id: string
  section_kind: ProfileSectionKind
  section_order: number
  is_required: boolean
  status: ProfileSectionStatus
  narrative_text: string | null
  narrative_draft: string | null
  teacher_notes_used: string[]
  data_sources: Record<string, unknown>
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProfileSectionAttachmentRow {
  id: string
  profile_section_id: string
  school_id: string
  attachment_kind: AttachmentKind
  storage_path: string
  caption: string | null
  display_order: number
  uploaded_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
