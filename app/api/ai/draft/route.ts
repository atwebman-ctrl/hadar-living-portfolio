// ============================================================
// app/api/ai/draft/route.ts
//
// POST /api/ai/draft
//
// Calls the Claude API to generate a teacher-facing narrative
// draft for a given portfolio section, then stores the result
// in ai_drafts with status 'draft'.
//
// Auth: Clerk session required. Role: admin or teacher.
// school_id is derived from the Clerk org — never from the request.
//
// INSERT into ai_drafts uses supabaseAdmin (service role) because
// the RLS policy intentionally has no authenticated INSERT grant —
// only the AI pipeline (this route) creates draft rows.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  validate,
  CreateAiDraftRequestSchema,
  type CreateAiDraftRequestInput,
  ValidationError,
} from '@/lib/validation'
import { authErrorResponse } from '@/lib/apiHelpers'

// ── Prompt construction ───────────────────────────────────────

function buildSystemPrompt(firstName: string | null): string {
  const nameClause = firstName
    ? `The student's first name is ${firstName}. Refer to them by this name throughout.`
    : `Use the student's first name where it appears in the data.`
  return `You are a writing assistant for teachers at a small classical Jewish academy.\
Generate a single paragraph (2–4 sentences) for a student's living portfolio.\
The audience is the student's parents. The tone is warm, literate, and celebratory — \
like a thoughtful letter from an admired teacher.\
Write in third person. ${nameClause}\
Plain prose only — no bullet points, no headings, no markdown formatting.\
Never invent scores or specific facts that are not present in the provided data.`
}

const SECTION_LABELS: Record<string, string> = {
  student_header:    'Student Overview',
  academic_scores:   'Academic Assessment Performance',
  immersion:         'Hebrew Language Immersion',
  reading_bookshelf: 'Reading List and Bookshelf',
  writing:           'Writing Portfolio',
  handwriting:       'Handwriting Development',
  rhetoric:          'Rhetoric and Oral Presentation',
  virtue_badges:     'Character Virtues',
  photos:            'School Life Photos',
  parent_uploads:    'Home Creations',
  teacher_profiles:  'Teacher Observations',
  scope_sequence:    'Curriculum Scope and Sequence',
  state_of_union:    'Year in Review',
}

function buildUserPrompt(input: CreateAiDraftRequestInput): string {
  const label = SECTION_LABELS[input.sectionType] ?? input.sectionType
  return `Section: ${label}\n\nStudent data:\n${JSON.stringify(input.context, null, 2)}\n\nWrite the portfolio narrative.`
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // 2. Validate
  let input: CreateAiDraftRequestInput
  try {
    input = validate(CreateAiDraftRequestSchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    throw err
  }

  // 3. Auth — admin or teacher only
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can generate AI drafts.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // 4. Verify student belongs to this school (school_id isolation)
  const { data: student, error: stuErr } = await supabaseAdmin
    .from('students')
    .select('id, first_name')
    .eq('id', input.studentId)
    .eq('school_id', ctx.schoolId)
    .single()

  if (stuErr || !student) {
    return NextResponse.json(
      { error: 'Student not found.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 5. Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI service is not configured.', code: 'AI_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const firstName = typeof input.context.studentFirstName === 'string'
    ? input.context.studentFirstName
    : null

  let draftText: string
  try {
    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      // claude-haiku-4-5-20251001: fast and cost-effective for narrative drafts.
      // Upgrade to claude-sonnet-4-6 for higher-quality output if needed.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: buildSystemPrompt(firstName),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    })
    const block = message.content[0]
    draftText = block.type === 'text' ? block.text.trim() : ''
  } catch (err) {
    console.error('[POST /api/ai/draft] Claude API error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.', code: 'AI_ERROR' },
      { status: 502 }
    )
  }

  if (!draftText) {
    return NextResponse.json(
      { error: 'AI returned an empty response.', code: 'AI_EMPTY' },
      { status: 502 }
    )
  }

  // 6. Store draft — service role bypasses RLS (no authenticated INSERT policy)
  const referenceId = input.referenceId ?? input.studentId
  const { data: draft, error: dbErr } = await supabaseAdmin
    .from('ai_drafts')
    .insert({
      school_id:     ctx.schoolId,
      student_id:    input.studentId,
      section_type:  input.sectionType,
      reference_id:  referenceId,
      content_draft: draftText,
      content_final: null,
      status:        'draft',
      reviewed_by:   null,
      reviewed_at:   null,
    })
    .select('id')
    .single()

  if (dbErr || !draft) {
    console.error('[POST /api/ai/draft] DB insert error:', dbErr)
    return NextResponse.json(
      { error: 'Failed to store draft.', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { draftId: draft.id, text: draftText, sectionType: input.sectionType },
    { status: 201 }
  )
}
