// ============================================================
// app/api/dashboard/schools/book-catalog/route.ts
//
// GET  — List all books in the school's catalog (all roles).
// POST — Add a book to the catalog (admin/teacher only).
//
// school_id is always derived server-side from the Clerk org.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  validate,
  CreateBookCatalogSchema,
  ValidationError,
  type CreateBookCatalogInput,
} from '@/lib/validationExtended'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authErrorResponse } from '@/lib/apiHelpers'
import type { BookCatalogEntry } from '@/lib/types'

function mapRow(row: Record<string, unknown>): BookCatalogEntry {
  return {
    id:                  row.id as string,
    schoolId:            row.school_id as string,
    title:               row.title as string,
    author:              row.author as string,
    gradeLevel:          row.grade_level as string,
    yearPublished:       (row.year_published as number | null) ?? null,
    pageCount:           (row.page_count as number | null) ?? null,
    learningObjectives:  (row.learning_objectives as string | null) ?? null,
    createdAt:           row.created_at as string,
  }
}

// ── GET /api/dashboard/schools/book-catalog ───────────────────

export async function GET(_req: NextRequest) {
  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  const { data, error } = await supabaseAdmin
    .from('book_catalog')
    .select('*')
    .eq('school_id', ctx.schoolId)
    .order('title', { ascending: true })

  if (error) {
    console.error('[GET /api/dashboard/schools/book-catalog]', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json((data ?? []).map((r) => mapRow(r as Record<string, unknown>)))
}

// ── POST /api/dashboard/schools/book-catalog ──────────────────

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  let input: CreateBookCatalogInput
  try {
    input = validate(CreateBookCatalogSchema, body)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    throw err
  }

  let ctx!: Awaited<ReturnType<typeof getAuthContext>>
  try {
    ctx = await getAuthContext()
  } catch (err) {
    if (err instanceof Error) return authErrorResponse(err)
    throw err
  }

  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can add books to the catalog.', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('book_catalog')
    .insert({
      school_id:           ctx.schoolId,
      title:               input.title,
      author:              input.author,
      grade_level:         input.gradeLevel,
      year_published:      input.yearPublished ?? null,
      page_count:          input.pageCount ?? null,
      learning_objectives: input.learningObjectives ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[POST /api/dashboard/schools/book-catalog]', error)
    return NextResponse.json(
      { error: 'Failed to add book.', code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(mapRow(data as Record<string, unknown>), { status: 201 })
}
