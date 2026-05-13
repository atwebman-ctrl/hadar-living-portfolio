// ============================================================
// app/api/dashboard/profiles/[profileId]/sections/[sectionId]/generate/route.ts
//
// POST — generate a Claude-drafted narrative for a single Profile
// Builder section. The draft is persisted to
// profile_sections.narrative_draft and the section status moves to
// 'in_progress'. The teacher then edits + saves via the existing
// PATCH endpoint.
//
// Auth: Clerk session, role admin or teacher.
// Locked: returns 403 LOCKED while the parent profile is in_review
//   (matches the PATCH endpoint's safety guarantee — once submitted
//   to Dr. Worth, no edits or AI redrafts until she returns it).
// Rate limit: 5/min per user (Claude calls are billable).
//
// Section coverage: all 9 required section kinds are wired.
// Optional kinds (art_projects, field_trips, custom) return 501
// NOT_IMPLEMENTED — they have no prompt builders yet.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse, rateLimit, rateLimitResponse } from '@/lib/apiHelpers'
import {
  loadMapsScores,
  loadLexileBand,
  loadCanonReadings,
  loadCompositionSamples,
  loadAvantAssessments,
  avantComparisonFromAssessments,
  loadCharacterAwards,
  loadPoetryVideo,
} from '@/lib/sectionData'
import {
  buildMapsPrompt,
  buildLexilePrompt,
  buildCanonPrompt,
  buildCompositionPrompt,
  buildAvantPrompt,
  buildHebrewComparisonPrompt,
  buildCharacterPrompt,
  buildPoetryPrompt,
} from '@/lib/aiPrompts'
import { AVANT_GRADE_AVERAGES } from '@/lib/avantNorms'
import type { ProfileSectionKind } from '@/lib/types/profileBuilder'

type RouteContext = { params: Promise<{ profileId: string; sectionId: string }> }

interface ResolvedSection {
  sectionKind:   ProfileSectionKind
  studentId:     string
  season:        string
  termLabel:     string
  profileStatus: string
}

interface StudentRow {
  first_name:    string
  grade_level:   string
  academic_year: string
}

async function resolveSection(
  profileId: string,
  sectionId: string,
  schoolId:  string,
): Promise<ResolvedSection | null> {
  const { data, error } = await supabaseAdmin
    .from('profile_sections')
    .select('id, section_kind, profile_id, school_id, profiles!inner(student_id, season, term, status, school_id, deleted_at)')
    .eq('id', sectionId)
    .eq('profile_id', profileId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null

  const profile = data.profiles as unknown as {
    student_id: string
    season:     string
    term:       string
    status:     string
    school_id:  string
    deleted_at: string | null
  } | null

  if (!profile || profile.school_id !== schoolId || profile.deleted_at !== null) return null

  return {
    sectionKind:   data.section_kind as ProfileSectionKind,
    studentId:     profile.student_id,
    season:        profile.season,
    termLabel:     profile.term,
    profileStatus: profile.status,
  }
}

async function loadStudent(studentId: string, schoolId: string): Promise<StudentRow | null> {
  const { data } = await supabaseAdmin
    .from('students')
    .select('first_name, grade_level, academic_year')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .single()
  return (data as StudentRow | null) ?? null
}

async function callClaude(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw Object.assign(new Error('AI_NOT_CONFIGURED'), { code: 'AI_NOT_CONFIGURED' })

  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    // claude-haiku-4-5-20251001: fast and cost-effective for narrative drafts.
    // Upgrade to claude-sonnet-4-6 for higher-quality output if needed.
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system,
    messages:   [{ role: 'user', content: user }],
  })
  const block = message.content[0]
  return block?.type === 'text' ? block.text.trim() : ''
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { profileId, sectionId } = await params

  // Auth
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try { ctx = await getAuthContext() } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can generate drafts.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  // Rate limit — Claude calls are billable; cap at 5/min/user.
  if (!rateLimit(`${ctx.userId}:profile-section-generate`, 5).ok) return rateLimitResponse()

  // Resolve + school_id isolation
  const resolved = await resolveSection(profileId, sectionId, ctx.schoolId)
  if (!resolved) {
    return NextResponse.json({ error: 'Section not found.', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Lock guard — must mirror PATCH semantics.
  if (resolved.profileStatus === 'in_review') {
    return NextResponse.json(
      { error: 'This profile is awaiting review and cannot be edited.', code: 'LOCKED' },
      { status: 403 },
    )
  }

  const student = await loadStudent(resolved.studentId, ctx.schoolId)
  if (!student) {
    return NextResponse.json({ error: 'Student not found.', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Build the per-kind prompt
  const common = {
    studentFirstName: student.first_name,
    gradeLabel:       student.grade_level,
    termLabel:        resolved.termLabel,
  }
  let prompt: { system: string; user: string }
  switch (resolved.sectionKind) {
    case 'maps_scores': {
      const assessments = await loadMapsScores(
        resolved.studentId, ctx.schoolId, student.grade_level, student.academic_year,
      )
      prompt = buildMapsPrompt({ ...common, assessments })
      break
    }
    case 'lexile': {
      const band = await loadLexileBand(resolved.studentId, ctx.schoolId)
      prompt = buildLexilePrompt({ ...common, band })
      break
    }
    case 'canon_reading': {
      const readings = await loadCanonReadings(resolved.studentId, ctx.schoolId)
      prompt = buildCanonPrompt({ ...common, readings })
      break
    }
    case 'english_composition':
    case 'hebrew_composition': {
      const language = resolved.sectionKind === 'english_composition' ? 'english' : 'hebrew'
      const languageLabel = resolved.sectionKind === 'english_composition' ? 'English' : 'Hebrew'
      const samples = await loadCompositionSamples(
        resolved.studentId, ctx.schoolId, language, student.academic_year,
      )
      prompt = buildCompositionPrompt({ ...common, languageLabel, samples })
      break
    }
    case 'avant_hebrew': {
      const assessments = await loadAvantAssessments(
        resolved.studentId, ctx.schoolId, student.grade_level, student.academic_year,
      )
      prompt = buildAvantPrompt({ ...common, languageLabel: 'Hebrew', assessments })
      break
    }
    case 'hebrew_comparison': {
      const merged = await loadAvantAssessments(
        resolved.studentId, ctx.schoolId, student.grade_level, student.academic_year,
      )
      const athenaScores = avantComparisonFromAssessments(merged)
      const gradeInt = parseInt(student.grade_level, 10)
      const nationalAverage =
        gradeInt === 3 || gradeInt === 4 || gradeInt === 5 || gradeInt === 6
          ? AVANT_GRADE_AVERAGES[gradeInt]
          : null
      prompt = buildHebrewComparisonPrompt({
        ...common, languageLabel: 'Hebrew', athenaScores, nationalAverage,
      })
      break
    }
    case 'character_middot': {
      const awards = await loadCharacterAwards(resolved.studentId, ctx.schoolId)
      prompt = buildCharacterPrompt({ ...common, awards })
      break
    }
    case 'poetry_recitation': {
      const { videoUrl, title } = await loadPoetryVideo(resolved.studentId, ctx.schoolId)
      prompt = buildPoetryPrompt({
        ...common,
        videoTitle: title,
        hasVideo:   videoUrl !== null,
      })
      break
    }
    default:
      return NextResponse.json(
        {
          error: `AI drafting is not yet enabled for "${resolved.sectionKind}".`,
          code:  'NOT_IMPLEMENTED',
        },
        { status: 501 },
      )
  }

  // Call Claude
  let draftText: string
  try {
    draftText = await callClaude(prompt.system, prompt.user)
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'AI_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'AI service is not configured.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 },
      )
    }
    console.error('[POST /sections/:id/generate] Claude error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.', code: 'AI_ERROR' },
      { status: 502 },
    )
  }

  if (!draftText) {
    return NextResponse.json(
      { error: 'AI returned an empty response.', code: 'AI_EMPTY' },
      { status: 502 },
    )
  }

  // Persist as narrative_draft + bump status to in_progress.
  // Keep narrative_text untouched — that's the teacher-approved final.
  const { error: dbErr } = await supabaseAdmin
    .from('profile_sections')
    .update({
      narrative_draft: draftText,
      status:          'in_progress',
      updated_by:      ctx.userId,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', sectionId)

  if (dbErr) {
    console.error('[POST /sections/:id/generate] DB update:', dbErr)
    return NextResponse.json(
      { error: 'Failed to store draft.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json({ text: draftText, sectionKind: resolved.sectionKind }, { status: 200 })
}
