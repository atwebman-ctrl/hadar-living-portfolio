# Follow-ups

Running log of known, deferred work. Each entry is a durable artifact captured at the point a problem was identified but not fixed, so a future session can pick it up with full context.

---

## Profile-year scoping audit (2026-04-20)

### Core principle

Profile surfaces — the published report card (`/portfolio/[studentId]/full/[profileId]`), the Dr. Worth review queue preview (`/dashboard/review-queue/[profileId]`), and the Profile Builder editor (`/dashboard/profiles/[studentId]/[season]/[sectionKind]`) — should show data scoped to **the profile's academic year**, not the student's current year.

A profile is a point-in-time document. When a parent opens a historical Spring 2024-2025 profile, they should see what the trajectory looked like at that moment, not today's latest everything.

Composition samples were scoped on 2026-04-20 (commit `5e70df0`). The remaining 7 loaders in `lib/sectionData.ts` still return data that leaks past the profile's term — either all-history or latest-ever.

The parent portal's portfolio view at `/portfolio/[studentId]/group/[groupSlug]` does NOT flow through these loaders (it uses `getStudentPortfolio`). That surface intentionally shows full history and must not be affected by any fix here.

### Loader-by-loader audit

#### 1. `loadMapsScores` — ALL-HISTORY
- **Current**: queries `assessments` where `assessment_type in ('maps_math','maps_english')` with no year filter; returns every MAP row.
- **Renderer**: `MapsBlock` table, one row per (academic_year, term).
- **Bug**: a Spring 2024-2025 profile shows Fall/Winter 2025-2026 rows that happened after the profile was written.
- **Scope**: `assessments` has `academic_year` + `term`. Three viable policies:
  - Strict: `academic_year = profile.year` (loses trajectory).
  - Up-to-and-including: `academic_year <= profile.year` (preserves prior trajectory, excludes future).
  - Up-to-season: as above, plus within profile.year exclude terms after profile.season via `termToSeason` mapping.
- **Recommended**: up-to-season. Matches the "snapshot of trajectory at that moment" mental model.
- **Complexity**: low — single query change + pass profile year through.

#### 2. `loadAvantAssessments` — ALL-HISTORY
- Same schema, same all-history pattern, same AvantBlock table renderer.
- Same recommendation: up-to-season.
- **Complexity**: low.

#### 3. `loadLexileBand` — LATEST-EVER
- **Current**: `order by created_at desc limit 1` on lexile rows. Ignores profile entirely.
- **Renderer**: single "Latest measure" pair.
- **Bug**: every historical profile shows today's latest Lexile band.
- **Scope**: filter `academic_year <= profile.year`, take latest `created_at` within that window; optionally narrow by term ≤ profile term.
- **Caveat**: Karissa's replacement-for-Lexile decision is still pending (see CLAUDE.md blocked items). May want to defer until the framework changes.
- **Complexity**: low (once the Lexile-vs-replacement question resolves).

#### 4. `hebrewComparisonFromAvant` — LATEST-EVER
- Not a loader itself; derives from `loadAvantAssessments` by taking `merged[merged.length - 1]`.
- **Bug**: shows today's composite skill averages on every historical profile.
- **Scope**: automatic if `loadAvantAssessments` (#2) is scoped — no separate work required.
- **Complexity**: free-ride on #2.

#### 5. `loadCanonReadings` — ALL-HISTORY
- **Current**: all readings for student, no year filter. Table has `academic_year text not null`.
- **Renderer**: lists every book.
- **Bug**: historical profile shows every book the student has ever read, including post-profile reading.
- **Scope**: `.eq('academic_year', profile.year)` — strict. Reading list is year-scoped by convention in the UI already.
- **Caveat**: if Fall/Spring scoping within the same year matters, `readings` has no `term` column. Would need to infer from `created_at` or add a column.
- **Complexity**: low for year-strict; medium if per-term scoping is wanted.

#### 6. `loadCharacterAwards` — ALL-HISTORY, harder to scope
- **Current**: all awards for student, no filter. Table has `award_date date not null` but **no `academic_year` column**.
- **Bug**: historical profile shows awards granted after the profile.
- **Scope options**:
  - Date range: `award_date between academic_years.start_date and academic_years.end_date`. Works today, no migration. Requires loading the academic_years row's dates alongside the profile.
  - Migration: add `academic_year` column to `character_awards`. Cleaner long-term but touches seed + insert paths.
- **Complexity**: medium.

#### 7. `loadPoetryVideo` — LATEST-EVER, harder to scope
- **Current**: `order by created_at desc limit 1` where `category='poetry_recitation'`.
- **Table**: has `term` (free text like "Fall 2025") and `grade_level`, **no `academic_year` column**.
- **Bug**: historical profile shows today's poetry video.
- **Scope options**:
  - Parse `term` string to extract year — fragile, relies on free-text format staying consistent.
  - Migration: add `academic_year` column to `student_videos`. Correct answer.
- **Complexity**: medium (migration is the right path).

### Recommended priority order

1. **Canon, MAPS, AVANT, Hebrew comparison** — all have clean `academic_year` columns. Single small patch per loader + one call-site change per. Low risk, biggest coverage gain.
2. **Character awards** — date-range query works today without a migration; column addition is cleaner if we're touching the table anyway.
3. **Poetry video** — needs a migration or term-parsing. Migration preferred.
4. **Lexile** — hold until Karissa's framework decision; scoping work may become moot if the whole metric changes.

### Cross-cutting suggestion: plumb `profileYear` through `LoadCtx`

All these loaders are called from `loadSectionData` in three places (published, review queue, editor). Tonight's composition fix added `profileYear: string | null` to the LoadCtx in two of them; the editor already had the label available from `getCurrentAcademicYear`.

When we tackle more than one loader, lift `profileYear` into a shared `LoadCtx` type, resolve it once per page (via `getAcademicYearLabelById` for published/review, or via `getCurrentAcademicYear` for the editor), and let each loader opt into the filter. Same pattern as tonight, applied uniformly.

### Reference: the fix pattern from composition

- Added optional `academicYear?: string` param to the loader; when present, applies `.eq('academic_year', ...)`. Backward-compatible for any caller that doesn't pass it (the parent portal still gets full history via `getStudentPortfolio`).
- New helper `getAcademicYearLabelById(id, schoolId)` in `lib/academicYears.ts` resolves `profile.academicYearId` → label.
- Both published and review-queue pages now resolve the profile's year once and pass it into `LoadCtx.profileYear`.
- Editor page destructures `label` from the existing `getCurrentAcademicYear` call.
- Commit: `5e70df0` — "Scope composition samples to profile's academic year on published, review queue, and editor surfaces. Portal dashboard view untouched."

---

## Students PATCH test coverage (2026-04-24)

### Context

Today's audit-column cleanup (commit `88e688a`) added `updated_by: ctx.userId` to the PATCH handler at `app/api/dashboard/students/[studentId]/route.ts:186`, alongside the existing `updated_at` refresh. The gap was only caught during a manual pre-edit verification pass — nothing in CI would have flagged a missing audit column on this route.

### The gap

`app/api/dashboard/students/[studentId]/route.test.ts` covers **only the DELETE handler** (soft-delete flow, demo-student guard, role check, DB error). The PATCH handler has **zero tests** despite being the endpoint behind the Edit Student form.

### Why it matters

PATCH is the hot path for every student edit: grade level, enrollment status, profile photo, parent assignment, summary, progress notes. A regression here ships silently. The cleanup we just did — adding `updated_by` to the updates object — had no test to assert it landed; a future refactor that drops the line would pass CI.

### Suggested minimum coverage

Mirror the DELETE test style already in the file (`makeUpdateChain` helper with `capturedUpdateArg`) and the assessments POST test style for insert-payload inspection. At minimum:

1. **200 on valid update** — asserts response body is the mapped updated row, and the `.update(payload)` call received the expected snake_cased fields.
2. **Audit columns present on UPDATE payload** — `updated_by` equals `ctx.userId`, `updated_at` is a valid ISO string. Guards against today's regression pattern.
3. **403 on wrong role** — parent role rejected before DB is touched (`supabaseAdmin.from` not called).
4. **404 when student not in school** — `eq('id', ...).eq('school_id', ctx.schoolId)` returns no row → NOT_FOUND (guards tenant isolation).
5. **500 on DB error** — DB_ERROR code returned when Supabase surfaces an error.
6. **Partial update** — sending only `{ gradeLevel }` updates only that column plus the audit trio; unrelated fields not overwritten to null.

### Scope reference

- Test harness patterns already in-tree: `app/api/dashboard/students/[studentId]/route.test.ts` (DELETE + `makeUpdateChain` with arg capture) and `app/api/dashboard/students/[studentId]/assessments/route.test.ts` (POST insert-payload assertions).
- Low-risk addition: pure Vitest, mocks `@/lib/auth` and `@/lib/supabaseAdmin`, no DB required. Fits in the existing `check` CI job.
- Consider extending the same pattern to the other audit-column-writing routes that lack payload assertions (cleanup candidate, not urgent).
