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
- **Caveat**: Tayler's replacement-for-Lexile decision is still pending (school-level curriculum call she's coordinating with others). Scoping work here may become moot if the metric changes entirely.
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
4. **Lexile** — hold until Tayler's framework decision; scoping work may become moot if the whole metric changes.

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


---

## Optimistic list pattern rollout — apply useOptimisticList to remaining add forms (2026-04-25)

**Context.** #27 (newly-added Canon books don't appear until cache propagates) was fixed by introducing `lib/useOptimisticList.ts` and applying it to `TheCanon` + `InlineReadingForm` + `ReadingForm`. The same bug exists on every other inline-add form on the portfolio — they all call `revalidatePortfolio() + router.refresh()`, which is racy under Next 16's split cache stores. The fix is mechanical: hoist a `useOptimisticList<T>` in the section component, surface `add` to the form, change the form's `onSuccess` to receive the inserted row.

**Forms to migrate** (ordered by user-facing visibility — start at the top):

1. `components/portfolio/InlineAssessmentForm.tsx` — assessments. Owner candidate: `MathSection` / `EnglishSection` / `HebrewSection` (whichever renders the form for the relevant assessmentType).
2. `components/portfolio/InlineWritingForm.tsx` — writing samples. Owner: `CompositionView`.
3. `components/portfolio/PhotoCard.tsx` + `components/shared/UploadButton.tsx` — gallery photos. Owner: gallery view component.
4. `components/portfolio/InlineCharacterForm.tsx` — character / middot awards. Owner: `CharacterArc`.
5. `components/portfolio/InlineTeacherNoteForm.tsx` — teacher notes. Owner: wherever notes are listed (likely `TeacherJournal` or per-section comment surfaces).
6. `components/shared/InlineSectionComment.tsx` — section comments. Owner: per-section.
7. `components/dashboard/EditStudentForm.tsx` — student edit (PATCH, not add). Different shape — may want a `useOptimisticUpdate` variant or just keep `router.refresh()`. Audit before migrating.
8. `components/dashboard/ProfilePhotoUpload.tsx` — profile photo. Single-record, not list. Skip optimistic list; consider `useOptimisticState` variant if needed.
9. `components/dashboard/DeleteStudentButton.tsx` — delete, not add. Out of scope for this hook.
10. `components/dashboard/ReviewActionBar.tsx` — review submit/approve. Status mutation, not list add. Out of scope.
11. `components/dashboard/NoteSlideOver.tsx` — quick capture notes. Owner: `NoteSlideOver` itself.
12. `components/portfolio/ReportsView.tsx` — reports list. Owner: `ReportsView`.
13. `components/portfolio/BookCatalogManager.tsx` — book catalog. Owner: `BookCatalogManager` itself (modal-scoped state).

**Approach.** Each migration is ~10 lines of code: import hook, wrap props, pass `add`, change form's onSuccess signature. The hook is generic over `{ id: string }`, so any list type works. Test coverage for the hook is already in place (`lib/useOptimisticList.test.ts`); per-component tests are not required for the migration unless a section has unusual derivation logic.

**Why not bundle now.** Each migration touches a different section component plus its inline form, and the changes are independent. Shipping them as a stack of small commits (one section per commit) keeps blast radius low and lets each one be tested independently in dev. A single mega-commit would be hard to revert if one section has a quirk.


---

## Seed-time binary upload for demo data (2026-04-25)

**Context.** #53 ("Lost Compass 404") had two coupled root causes: a path bug in `supabase/seed.ts` (every seeded `storage_path` / `image_path` was prefixed with the bucket name `portfolio-assets/`, which `storagePublicUrl()` then prepended a second time, producing 404s) AND missing binaries in the Supabase storage bucket. The path bug is fixed; the missing-files layer remains.

**What's still broken after the path fix.**

- 9 seeded rows now reference correct storage paths but the actual binary files do not exist in the `portfolio-assets` bucket:
  - 3 handwriting samples (`handwriting/fall-2025-cursive.jpg`, `winter-2026-cursive.jpg`, `spring-2026-cursive.jpg`)
  - 4 classroom photos (`photos/science-fair-2026.jpg`, `purim-play-2026.jpg`, `shabbat-celebration-2025.jpg`, `art-exhibition-2026.jpg`)
  - 2 parent uploads (`parent-uploads/mosaic-jerusalem.jpg`, `parent-uploads/the-lost-compass.pdf`)
- `<img>` tags render as broken (silently). PDF/recording cards expose a "View ↗" link that opens a Supabase 404 in a new tab — this is what Mijntje saw on Lost Compass.

**What needs to happen.** Extend `supabase/seed.ts` so that alongside each row insert, the seed actually uploads a placeholder binary to the resolved storage path. Two clean paths:

1. Check in small placeholder assets under `supabase/seed-assets/` (a 1-page PDF, a few JPGs at portfolio-card aspect) and have the seed script `supabaseAdmin.storage.from('portfolio-assets').upload(path, file)` each one before/after the row insert.
2. Or: omit the binary-backed rows entirely from seed and rely on a separate manual upload pass for demo polish.

Option 1 is the right answer — keeps `npm run db:reset` self-contained and gives every fresh local environment a working demo on day zero.

**Estimated effort.** 1-2 hours: collect/license-check ~7 small placeholder images + a 1-page PDF, wire up an upload helper in seed.ts, handle re-run idempotency (`upsert: true`), verify in local Supabase Storage UI.

**When to prioritize.** Before any external demo where Mijntje, Tayler, or Dr. Worth might click into Athena's gallery or parent uploads. Not blocking for current Profile Builder work.


---

## Signed-URL flow rollout to remaining uploads (2026-04-25)

**Context.** #54 PR 2 introduced a signed-URL upload flow (`/uploads/sign` + `/uploads/finalize` + `DirectUploadButton`) so files larger than Vercel's ~4.5 MB serverless body cap can be PUT straight to Supabase storage. Three surfaces migrated in PR 2: classroom photos via `UnifiedGallery`, parent uploads via `ParentUploadForm`, and handwriting samples via `CompositionHandwriting`. Several remaining upload paths still go through the legacy multipart `/uploads` route and inherit the 4 MB cap.

**Surfaces still on legacy multipart.**

1. `components/dashboard/ProfilePhotoUpload.tsx` — student profile photo. Fixed-path upsert with a `students.profile_photo_path` column write. Could move to signed URL with a profile_photo branch on `/sign` + a dedicated finalizer that updates the students row instead of inserting elsewhere. `DirectUploadButton` is close to drop-in once those branches exist.
2. `components/dashboard/VideoUploadZone.tsx` — student videos. Already storage-only on the legacy route (DB row created later by the videos API after the form submits). Migrate `VideoUploadZone` to call `/sign` directly, do raw PUT, then call the existing videos API instead of `/finalize`. Don't try to fold video into the generic `/finalize`.
3. `app/api/dashboard/settings/logo/route.ts` (school logo) — admin-only, small (≤4 MB usually), low priority. Migrate only if logos start exceeding the cap.
4. Report cards (if/when wired) — likely PDFs ≥4 MB; should be born on the signed-URL flow.
5. Assessment PDF attachments (future) — same logic; born signed-URL.

**Approach.** `DirectUploadButton` covers any caller whose finalize step is "insert one row in one of the three known tables". For finalizers that need to update existing rows (profile_photo) or hand off to a different API (videos), build a thin per-surface variant that reuses `/uploads/sign` and the same XHR PUT plumbing but calls a different finalize endpoint. Don't expand `/uploads/finalize` into a switch over every upload type — keep it scoped to the three insert-a-row cases.

**Estimated effort per surface.** 1–3 hours. Profile photo is straightforward. Video needs a small refactor since the current legacy path is storage-only and the row-creation path lives elsewhere. School logo is essentially a copy-paste of profile photo.


---

## Orphan storage cleanup script (2026-04-25)

**Context.** The signed-URL flow shipped in #54 PR 2 has a graceful-failure gap: `/uploads/sign` issues a token, the client PUTs the file to storage, then must call `/uploads/finalize` to insert the DB row. If the user closes the tab, drops their network, or the browser crashes between the PUT and the finalize call, the file lands in the bucket with no DB row referencing it — an orphan.

`/finalize` itself verifies the object exists (good — closes one direction of the inconsistency), but there's no symmetric cleanup for objects that uploaded successfully and then never got finalized.

**What needs to happen.** Periodic job (cron or Vercel scheduled function) that:

1. Lists all objects in `portfolio-assets` under `{schoolId}/{studentId}/{type}/` prefixes.
2. Joins against `photos.storage_path`, `handwriting_samples.image_path`, `parent_uploads.storage_path` (and any future signed-URL targets).
3. For any object older than 24h that has no matching DB row, deletes it from storage.

24 hours is generous — the signed-URL TTL is 2 hours, so anything older than that is definitely orphaned, not in-flight. 24h gives breathing room for any debug session.

**Estimated effort.** 2–3 hours. Single TS script that imports `supabaseAdmin`, iterates three tables and the bucket, deletes the diff. Wire to GitHub Actions cron or Vercel cron once written.

**When to prioritize.** Before the bucket starts approaching paid-tier limits, or before it gets large enough that a `list()` over the whole bucket becomes slow. For now (small alpha tenant), orphans are harmless.


---

## Magic-byte MIME validation at /finalize (2026-04-25)

**Context.** `/uploads/sign` validates the client-claimed `mime` against `MIME_ALLOWLIST` before issuing a signed URL. This is a string-only check — a malicious client could send `mime: "image/jpeg"` while uploading an executable, and the storage object would land with a JPEG content-type header attached.

For the current product surface — classroom photos, handwriting scans, parent-uploaded art and PDFs from authenticated users — this is acceptable. Users have to be signed in; the bucket is private; the worst case is that a teacher uploads a renamed file to their own student's gallery.

**What we'd add when sensitivity grows.** In `/uploads/finalize`, after `verifyObjectExists()` succeeds, download the first ~16 bytes of the storage object via `supabaseAdmin.storage.from(bucket).download(path, { transform: { ... } })` (or a Range request through `createSignedUrl`) and check the magic-byte signature against the claimed MIME using a small in-tree map (PDF: `25 50 44 46`, JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, MP4: `66 74 79 70` at offset 4, etc.). Reject + delete the object on mismatch.

**Estimated effort.** 1–2 hours. Small library — we can write the magic-byte map ourselves (it's ~10 entries) rather than pull in `file-type` and its dependencies.

**When to prioritize.** Before the upload surface accepts content from unauthenticated origins, or before parent uploads start being shown to other tenants. Not urgent on the current single-tenant deployment.


---

## Tayler curriculum follow-ups — Lexile + scope and sequence (2026-04-25)

**Context.** Two pending curriculum items Tayler is coordinating with the broader school team. Neither is urgent; both are blocked on school-level decisions, not engineering work.

1. **Lexile replacement** — Tayler is evaluating whether to replace Lexile with a different reading-level metric. The technical implication for Quire is that loadLexileBand scoping (see profile-year scoping audit above) may become moot if the metric changes entirely. Hold all Lexile-related scoping work until the framework decision lands.

2. **Scope and sequence** — Tayler has flagged that the school's scope and sequence (curriculum mapping per grade level) needs review or implementation in Quire. Specifics pending. Likely relates to the existing scope_and_sequence table.

**When to prioritize.** Reactive — wait for Tayler to land on the curriculum side, then engineering work can be scoped properly. Following up periodically (every 2-4 weeks) is reasonable.

**Owner.** Aaron tracks status with Tayler; engineering work triggered by her decisions.


---

## Code TODOs (collected 2026-04-26)

**Context.** Inline `// TODO:` comments collected from the codebase during the 2026-04-26 hygiene sweep. Each item is small enough to fit a single PR but not urgent enough to block on. Migrated here to keep source files comment-clean.

1. **Bulk score save → per-row PDF upload** (`components/dashboard/BulkScoresMode.tsx`). After a bulk MAP-score save, offer a PDF upload per row so the source report card can be attached. Useful for audit and parent-facing artifacts. Low effort once the `/uploads/sign` flow is generalized for non-image MIMEs.

2. **Auto-categorize teacher notes via Claude** (`components/dashboard/QuickNotesMode.tsx`). The Quick Notes category dropdown defaults to `general`. A future "Auto" mode would route the note through Haiku and pick a category (`academic`, `behavior`, `social`, etc.). Already deferred in the broader Phase 7 Quick Capture work.

3. **PDF upload for compositions** (`components/portfolio/CompositionHandwriting.tsx`). Extract the front page of an uploaded composition PDF as the handwriting preview image. Removes the need to upload a separate handwriting scan when the composition itself shows the handwriting. Touches `/uploads/sign` (PDF MIME), `/uploads/finalize`, and a server-side PDF-to-image step.

4. **Pre-set composition form language** (`components/portfolio/CompositionView.tsx`). When `filter !== 'all'` (i.e., the user is viewing only English or only Hebrew samples), the inline writing form should pre-fill its `language` select to match. Pure UX nicety; no schema changes.

5. **AI draft badge on progress summary** (`components/portfolio/PortfolioHub.tsx`). When `progress_summary` was AI-drafted (vs. teacher-written), show a small "AI draft" badge in the hub. Requires tracking the source on the row — likely a `progress_summary_source` column or reusing `ai_drafts` linkage. Defer until Phase 5 (real Claude drafting) lands.

6. **Admin-configurable academic-year start/end dates** (`lib/academicYears.ts`). `getOrCreateAcademicYearId` currently hardcodes Aug 1 → Jun 30 as the academic-year window. Sensible default for US classical schools, but should be per-tenant configurable once a year-management admin UI exists. Tracked separately under "settings UI" backlog.

7. **Refactor shared grade/season logic** (`lib/avantHelpers.ts`). When a 4th assessment-style section lands (beyond MAPS / AVANT / Lexile), refactor the shared grade-derivation and season-sort logic out of `mapsHelpers.ts` into a neutral `lib/assessmentHelpers.ts`. For now, cross-importing is fine — this only becomes worth the churn when there are 4+ consumers.

**When to prioritize.** Each item independently — most can ship as small follow-up PRs. Items 5 and 7 are gated on other work (Phase 5; 4th assessment section).
