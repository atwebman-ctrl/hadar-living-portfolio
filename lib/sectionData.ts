// ============================================================
// lib/sectionData.ts — Server-only section-data loaders shared
// by the Profile Builder editor route and the parent-facing
// published view. One function per profile section kind;
// callers decide which to invoke.
//
// Uses supabaseAdmin — call from server components / API routes
// only. Never import from client code.
// ============================================================

import { supabaseAdmin } from './supabaseAdmin'
import { mapReading, mapCharacterAward } from './mappers'
import { mergeMapsAssessments, type MAPSAssessment } from './mapsHelpers'
import { mergeAvantAssessments, type AVANTAssessment } from './avantHelpers'
import type { HebrewSkillAverages } from './hebrewComparisonNorms'
import { storagePublicUrl } from './storage'
import type { Reading, CharacterAward } from './types'
import type { CompositionSample } from '@/components/profiles/sections/CompositionSection'

// ── Lexile ───────────────────────────────────────────────────

export function parseLexileRange(value: string | null): { min: number; max: number } | null {
  if (!value) return null
  const m = value.match(/(\d+)L?\s*[-–]\s*(\d+)L?/)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = value.match(/(\d+)L?/)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return null
}

export type LexileBand = {
  label:     string
  rangeMinL: number
  rangeMaxL: number
  termLabel: string
  notes:     string | null
}

export async function loadLexileBand(
  studentId: string,
  schoolId:  string,
): Promise<LexileBand | null> {
  const { data: lexRow } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('assessment_type', 'lexile')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lexileValue = (lexRow?.lexile_value as string | null) ?? null
  const range = parseLexileRange(lexileValue)
  if (!range) return null
  return {
    label:     lexileValue ?? `${range.min}L`,
    rangeMinL: range.min,
    rangeMaxL: range.max,
    termLabel: (lexRow?.term as string | null) ?? '—',
    notes:     (lexRow?.notes as string | null) ?? null,
  }
}

// ── MAPS ─────────────────────────────────────────────────────

function gradeToInt(gradeLevel: string): number {
  const n = parseInt(gradeLevel, 10)
  return Number.isNaN(n) ? 0 : n
}

export async function loadMapsScores(
  studentId:    string,
  schoolId:     string,
  gradeLevel:   string,
  academicYear: string,
): Promise<MAPSAssessment[]> {
  const { data: rows } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term, academic_year, rit_score, percentile')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .in('assessment_type', ['maps_math', 'maps_english'])
    .is('deleted_at', null)

  return mergeMapsAssessments(
    (rows ?? []) as Parameters<typeof mergeMapsAssessments>[0],
    gradeToInt(gradeLevel),
    academicYear,
  )
}

// ── AVANT (Hebrew) ───────────────────────────────────────────

export async function loadAvantAssessments(
  studentId:    string,
  schoolId:     string,
  gradeLevel:   string,
  academicYear: string,
): Promise<AVANTAssessment[]> {
  const { data: rows } = await supabaseAdmin
    .from('assessments')
    .select('id, assessment_type, term, academic_year, score')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .like('assessment_type', 'avant%')
    .is('deleted_at', null)

  return mergeAvantAssessments(
    (rows ?? []) as Parameters<typeof mergeAvantAssessments>[0],
    gradeToInt(gradeLevel),
    academicYear,
  )
}

// Derives the HebrewSkillAverages shape from the latest merged AVANT row.
// Accepts pre-loaded assessments so callers can share a single query when
// they need both the raw trajectory and the latest composite.
export function hebrewComparisonFromAvant(
  merged: AVANTAssessment[],
): HebrewSkillAverages {
  const latest = merged.length > 0 ? merged[merged.length - 1] : null
  const present = [latest?.reading, latest?.writing, latest?.listening, latest?.speaking]
    .filter((s): s is number => s != null)
  const composite = present.length > 0
    ? present.reduce((a, b) => a + b, 0) / present.length : 0
  return {
    reading:   latest?.reading   ?? 0,
    writing:   latest?.writing   ?? 0,
    listening: latest?.listening ?? 0,
    speaking:  latest?.speaking  ?? 0,
    composite,
  }
}

// ── Canon reading list ──────────────────────────────────────

export async function loadCanonReadings(
  studentId: string,
  schoolId:  string,
): Promise<Reading[]> {
  const { data: rows } = await supabaseAdmin
    .from('readings')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('sort_order')

  return (rows ?? []).map((r) => mapReading(r as Record<string, unknown>))
}

// ── Composition (English / Hebrew) ───────────────────────────

// `academicYear` scopes results to a single year label (e.g. "2025-2026") and
// is intended for profile surfaces — published report card, review queue
// preview, Profile Builder editor. When omitted, returns the student's full
// history (used by the parent portal's `/group/portfolio` view via
// getStudentPortfolio).
//
// Known trade-off: we scope by year only, not by season. Fall and Spring
// profiles in the same academic year therefore show the same set of samples.
// writing_samples.term is nullable and loosely typed, so filtering on it
// would silently drop samples whose term is null.
export async function loadCompositionSamples(
  studentId:     string,
  schoolId:      string,
  language:      'english' | 'hebrew',
  academicYear?: string,
): Promise<CompositionSample[]> {
  let query = supabaseAdmin
    .from('writing_samples')
    .select('id, language, grade_level, academic_year, title, body, ocr_text, image_path')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('language', language)
    .is('deleted_at', null)
    .order('academic_year', { ascending: true })

  if (academicYear) query = query.eq('academic_year', academicYear)

  const { data: rows } = await query

  return (rows ?? []).map((r) => {
    const row = r as Record<string, unknown>
    return {
      id:             row.id as string,
      language,
      gradeLevel:     (row.grade_level as string) ?? '',
      academicYear:   (row.academic_year as string) ?? '',
      title:          (row.title as string) ?? null,
      body:           (row.body as string) ?? null,
      ocrText:        (row.ocr_text as string) ?? null,
      imagePublicUrl: storagePublicUrl((row.image_path as string) ?? null),
    }
  })
}

// ── Character · Middot ──────────────────────────────────────

export async function loadCharacterAwards(
  studentId: string,
  schoolId:  string,
): Promise<CharacterAward[]> {
  const { data: rows } = await supabaseAdmin
    .from('character_awards')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('award_date', { ascending: false })

  return (rows ?? []).map((r) => mapCharacterAward(r as Record<string, unknown>))
}

// ── Rhetoric · Poetry Recitation ─────────────────────────────

export async function loadPoetryVideo(
  studentId: string,
  schoolId:  string,
): Promise<{ videoUrl: string | null; title: string | null }> {
  const { data: row } = await supabaseAdmin
    .from('student_videos')
    .select('video_url, title')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('category', 'poetry_recitation')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    videoUrl: (row?.video_url as string | null) ?? null,
    title:    (row?.title     as string | null) ?? null,
  }
}
