// ============================================================
// lib/mappers.ts — Row mappers: snake_case DB → camelCase TS
//
// Each function accepts a raw Supabase row (Record<string, unknown>)
// and returns the typed domain object from lib/types.ts.
// Imported exclusively by getStudentPortfolio.ts and API routes
// that need to normalise Supabase responses.
// ============================================================

import type {
  Student,
  SchoolConfig,
  Assessment,
  Reading,
  WritingSample,
  HandwritingSample,
  Video,
  CharacterAward,
  Photo,
  ParentUpload,
  Teacher,
  TeacherNote,
  AiDraft,
  SubjectProgress,
  SectionType,
  ThemeConfig,
  StudentVideo,
} from "./types";

type Row = Record<string, unknown>;

export function mapStudent(row: Row): Student {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    // Prefer new constrained column; fall back to legacy free-text value
    gradeLevel: (row.grade_level as string | null) ?? (row.grade_level_legacy as string | null) ?? '',
    academicYear: row.academic_year as string,
    parentUserIds: (row.parent_user_ids as string[]) ?? [],
    profilePhotoPath: (row.profile_photo_path as string) ?? null,
    summary: (row.summary as string) ?? null,
    isDemo: row.is_demo as boolean,
    archivedAt: (row.archived_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapSchool(row: Row): SchoolConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string) ?? null,
    theme: (row.theme_json as ThemeConfig) ?? {},
    enabledSections: (row.enabled_sections as SectionType[]) ?? [],
    websiteUrl: (row.website_url as string) ?? null,
    clerkOrgId: (row.clerk_org_id as string) ?? null,
  };
}

export function mapAssessment(row: Row): Assessment {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    assessmentType: row.assessment_type as Assessment["assessmentType"],
    score: (row.score as number) ?? null,
    percentile: (row.percentile as number) ?? null,
    ritScore: (row.rit_score as number) ?? null,
    lexileValue: (row.lexile_value as string) ?? null,
    term: row.term as string,
    academicYear: row.academic_year as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapReading(row: Row): Reading {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    title: row.title as string,
    author: (row.author as string) ?? null,
    academicYear: row.academic_year as string,
    completed: row.completed as boolean,
    sortOrder: row.sort_order as number,
    whyChosen: (row.why_chosen as string) ?? null,
    valuesSkills: (row.values_skills as string) ?? null,
    pageCount: (row.page_count as number) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapWritingSample(row: Row): WritingSample {
  return {
    id:             row.id as string,
    schoolId:       row.school_id as string,
    studentId:      row.student_id as string,
    language:       row.language as WritingSample["language"],
    gradeLevel:     row.grade_level as string,
    title:          row.title as string,
    body:           (row.body as string) ?? null,
    storagePath:    (row.storage_path as string) ?? null,
    imagePath:      (row.image_path as string) ?? null,
    ocrText:        (row.ocr_text as string) ?? null,
    academicYear:   row.academic_year as string,
    createdAt:      row.created_at as string,
    genre:          (row.genre as string) ?? null,
    excerpt:        (row.excerpt as string) ?? null,
    teacherComments:(row.teacher_comments as string) ?? null,
    term:           (row.term as string) ?? null,
    filePath:       (row.file_path as string) ?? null,
  };
}

export function mapHandwritingSample(row: Row): HandwritingSample {
  return {
    id:           row.id as string,
    schoolId:     row.school_id as string,
    studentId:    row.student_id as string,
    imagePath:    row.image_path as string,
    ocrText:      (row.ocr_text as string) ?? null,
    teacherNotes: (row.teacher_notes as string) ?? null,
    term:         row.term as string,
    academicYear: row.academic_year as string,
    createdAt:    row.created_at as string,
    publicUrl:    null, // set post-mapping in getStudentPortfolio
  };
}

export function mapVideo(row: Row): Video {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    videoType: row.video_type as Video["videoType"],
    title: row.title as string,
    description: (row.description as string) ?? null,
    storagePath: (row.storage_path as string) ?? null,
    externalUrl: (row.external_url as string) ?? null,
    thumbnailPath: (row.thumbnail_path as string) ?? null,
    recordedAt: (row.recorded_at as string) ?? null,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
  };
}

export function mapCharacterAward(row: Row): CharacterAward {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    virtueHebrew: row.virtue_hebrew as string,
    virtueTransliteration: row.virtue_transliteration as string,
    virtueEnglish: row.virtue_english as string,
    awardDate: row.award_date as string,
    description: (row.description as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapPhoto(row: Row): Photo {
  return {
    id:          row.id as string,
    schoolId:    row.school_id as string,
    studentId:   row.student_id as string,
    storagePath: row.storage_path as string,
    caption:     (row.caption as string) ?? null,
    dateTaken:   (row.date_taken as string) ?? null,
    gradeLevel:  row.grade_level as string,
    academicYear:row.academic_year as string,
    createdAt:   row.created_at as string,
    publicUrl:   null, // set post-mapping in getStudentPortfolio
  };
}

export function mapParentUpload(row: Row): ParentUpload {
  return {
    id:          row.id as string,
    schoolId:    row.school_id as string,
    studentId:   row.student_id as string,
    uploadType:  row.upload_type as string,
    title:       row.title as string,
    storagePath: row.storage_path as string,
    description: (row.description as string) ?? null,
    date:        (row.date as string) ?? null,
    gradeLevel:  row.grade_level as string,
    academicYear:row.academic_year as string,
    uploadedBy:  row.uploaded_by as string,
    createdAt:   row.created_at as string,
    publicUrl:   null, // set post-mapping in getStudentPortfolio
  };
}

export function mapTeacher(row: Row): Teacher {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    clerkUserId: (row.clerk_user_id as string) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    photoPath: (row.photo_path as string) ?? null,
    bio: (row.bio as string) ?? null,
    subjects: (row.subjects as string[]) ?? [],
    startYear: (row.start_year as number) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapTeacherNote(row: Row): TeacherNote {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    sectionType: row.section_type as SectionType,
    authorName: row.author_name as string,
    text: row.text as string,
    createdAt: row.created_at as string,
  };
}

export function mapScopeAndSequence(row: Row): SubjectProgress {
  return {
    subject:       row.subject as string,
    unit:          (row.unit as string) ?? null,
    completionPct: row.completion_pct as number,
    notes:         (row.notes as string) ?? null,
  };
}

export function mapStudentVideo(row: Row): StudentVideo {
  return {
    id:         row.id as string,
    schoolId:   row.school_id as string,
    studentId:  row.student_id as string,
    title:      row.title as string,
    videoUrl:   row.video_url as string,
    gradeLevel: row.grade_level as string,
    term:       row.term as string,
    category:   row.category as StudentVideo['category'],
    createdAt:  row.created_at as string,
  };
}

export function mapAiDraft(row: Row): AiDraft {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    sectionType: row.section_type as SectionType,
    referenceId: row.reference_id as string,
    contentDraft: row.content_draft as string,
    contentFinal: (row.content_final as string) ?? null,
    status: row.status as AiDraft["status"],
    reviewedBy: (row.reviewed_by as string) ?? null,
    reviewedAt: (row.reviewed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
