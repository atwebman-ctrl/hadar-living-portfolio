// ============================================================
// lib/mappers.test.ts
// Unit tests for row-mapper functions.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mapStudent, mapAssessment, mapReading } from './mappers'

// Valid RFC 4122 v4 UUIDs for test data
const SCHOOL_ID  = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const STUDENT_ID = '11111111-1111-4111-8111-111111111111'

describe('mapStudent', () => {
  const row = {
    id:                  STUDENT_ID,
    school_id:           SCHOOL_ID,
    first_name:          'Ayala',
    last_name:           'Cohen',
    grade_level:         '4th Grade',
    academic_year:       '2025-2026',
    parent_user_ids:     ['clerk_parent_1'],
    profile_photo_path:  'avatars/ayala.jpg',
    summary:             'A curious learner.',
    is_demo:             false,
    deleted_at:          null,
    created_at:          '2025-09-01T00:00:00.000Z',
    updated_at:          '2025-09-01T00:00:00.000Z',
  }

  it('maps all fields to camelCase', () => {
    const result = mapStudent(row)
    expect(result.id).toBe(STUDENT_ID)
    expect(result.schoolId).toBe(SCHOOL_ID)
    expect(result.firstName).toBe('Ayala')
    expect(result.lastName).toBe('Cohen')
    expect(result.gradeLevel).toBe('4th Grade')
    expect(result.academicYear).toBe('2025-2026')
    expect(result.parentUserIds).toEqual(['clerk_parent_1'])
    expect(result.profilePhotoPath).toBe('avatars/ayala.jpg')
    expect(result.summary).toBe('A curious learner.')
    expect(result.isDemo).toBe(false)
    expect(result.createdAt).toBe('2025-09-01T00:00:00.000Z')
    expect(result.updatedAt).toBe('2025-09-01T00:00:00.000Z')
  })

  it('maps deletedAt when null', () => {
    const result = mapStudent(row)
    expect(result.deletedAt).toBeNull()
  })

  it('maps deletedAt when set to a timestamp', () => {
    const deletedRow = { ...row, deleted_at: '2026-01-15T12:00:00.000Z' }
    const result = mapStudent(deletedRow)
    expect(result.deletedAt).toBe('2026-01-15T12:00:00.000Z')
  })

  it('defaults parentUserIds to empty array when absent', () => {
    const result = mapStudent({ ...row, parent_user_ids: undefined })
    expect(result.parentUserIds).toEqual([])
  })

  it('maps null optional fields to null', () => {
    const result = mapStudent({ ...row, profile_photo_path: null, summary: null })
    expect(result.profilePhotoPath).toBeNull()
    expect(result.summary).toBeNull()
  })
})

describe('mapAssessment', () => {
  const ASSESSMENT_ID = '22222222-2222-4222-9222-222222222222'

  const row = {
    id:               ASSESSMENT_ID,
    school_id:        SCHOOL_ID,
    student_id:       STUDENT_ID,
    assessment_type:  'maps_math',
    score:            220,
    percentile:       78,
    rit_score:        220,
    lexile_value:     null,
    term:             'Fall 2025',
    academic_year:    '2025-2026',
    notes:            'Strong improvement.',
    created_at:       '2025-10-01T00:00:00.000Z',
  }

  it('maps all fields to camelCase', () => {
    const result = mapAssessment(row)
    expect(result.id).toBe(ASSESSMENT_ID)
    expect(result.schoolId).toBe(SCHOOL_ID)
    expect(result.studentId).toBe(STUDENT_ID)
    expect(result.assessmentType).toBe('maps_math')
    expect(result.score).toBe(220)
    expect(result.percentile).toBe(78)
    expect(result.ritScore).toBe(220)
    expect(result.lexileValue).toBeNull()
    expect(result.term).toBe('Fall 2025')
    expect(result.academicYear).toBe('2025-2026')
    expect(result.notes).toBe('Strong improvement.')
    expect(result.createdAt).toBe('2025-10-01T00:00:00.000Z')
  })

  it('maps null numeric fields to null', () => {
    const result = mapAssessment({ ...row, score: null, percentile: null, rit_score: null })
    expect(result.score).toBeNull()
    expect(result.percentile).toBeNull()
    expect(result.ritScore).toBeNull()
  })
})

describe('mapReading', () => {
  const READING_ID = '33333333-3333-4333-a333-333333333333'

  const row = {
    id:            READING_ID,
    school_id:     SCHOOL_ID,
    student_id:    STUDENT_ID,
    title:         'The Phantom Tollbooth',
    author:        'Norton Juster',
    academic_year: '2025-2026',
    completed:     true,
    sort_order:    1,
    why_chosen:    'Sharpens language play.',
    values_skills: 'Curiosity, reasoning',
    page_count:    256,
    created_at:    '2025-11-01T00:00:00.000Z',
  }

  it('maps all fields to camelCase', () => {
    const result = mapReading(row)
    expect(result.id).toBe(READING_ID)
    expect(result.schoolId).toBe(SCHOOL_ID)
    expect(result.studentId).toBe(STUDENT_ID)
    expect(result.title).toBe('The Phantom Tollbooth')
    expect(result.author).toBe('Norton Juster')
    expect(result.academicYear).toBe('2025-2026')
    expect(result.completed).toBe(true)
    expect(result.sortOrder).toBe(1)
    expect(result.whyChosen).toBe('Sharpens language play.')
    expect(result.valuesSkills).toBe('Curiosity, reasoning')
    expect(result.pageCount).toBe(256)
    expect(result.createdAt).toBe('2025-11-01T00:00:00.000Z')
  })

  it('maps null optional fields to null', () => {
    const result = mapReading({
      ...row,
      author: null,
      why_chosen: null,
      values_skills: null,
      page_count: null,
    })
    expect(result.author).toBeNull()
    expect(result.whyChosen).toBeNull()
    expect(result.valuesSkills).toBeNull()
    expect(result.pageCount).toBeNull()
  })
})
