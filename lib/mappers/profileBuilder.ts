// ============================================================
// lib/mappers/profileBuilder.ts — snake_case DB rows →
// camelCase TS interfaces for the Profile Builder feature.
// Re-exported from lib/mappers.ts.
// ============================================================

import type {
  Profile,
  ProfileSection,
  ProfileSectionAttachment,
  ProfileRow,
  ProfileSectionRow,
  ProfileSectionAttachmentRow,
} from '../types/profileBuilder'

export function mapProfile(row: ProfileRow): Profile {
  return {
    id:               row.id,
    schoolId:         row.school_id,
    studentId:        row.student_id,
    academicYearId:   row.academic_year_id,
    term:             row.term,
    season:           row.season,
    status:           row.status,
    draftedBy:        row.drafted_by,
    reviewedBy:       row.reviewed_by,
    publishedAt:      row.published_at,
    unpublishedAt:    row.unpublished_at,
    unpublishReason:  row.unpublish_reason,
    createdBy:        row.created_by,
    updatedBy:        row.updated_by,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
    deletedAt:        row.deleted_at,
  }
}

export function mapProfileSection(row: ProfileSectionRow): ProfileSection {
  return {
    id:                row.id,
    profileId:         row.profile_id,
    schoolId:          row.school_id,
    sectionKind:       row.section_kind,
    sectionOrder:      row.section_order,
    isRequired:        row.is_required,
    status:            row.status,
    narrativeText:     row.narrative_text,
    narrativeDraft:    row.narrative_draft,
    teacherNotesUsed:  row.teacher_notes_used ?? [],
    dataSources:       row.data_sources ?? {},
    createdBy:         row.created_by,
    updatedBy:         row.updated_by,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
    deletedAt:         row.deleted_at,
  }
}

export function mapProfileSectionAttachment(
  row: ProfileSectionAttachmentRow,
): ProfileSectionAttachment {
  return {
    id:                 row.id,
    profileSectionId:   row.profile_section_id,
    schoolId:           row.school_id,
    attachmentKind:     row.attachment_kind,
    storagePath:        row.storage_path,
    caption:            row.caption,
    displayOrder:       row.display_order,
    uploadedBy:         row.uploaded_by,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    deletedAt:          row.deleted_at,
  }
}
