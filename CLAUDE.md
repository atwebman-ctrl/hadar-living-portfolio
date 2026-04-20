# CLAUDE.md — Quire (Hadar Living Portfolio)

## Agent Behavior
Say "🫡" in your first message to acknowledge you've read this document.
Always recommend the optimal, future-proofed solution — never the shortcut.
At end of every session: ask "anything to clean up?" and remind Aaron to update this file.

## Verification-First Workflow
Before modifying existing files or wiring into existing interfaces, always verify assumptions against the actual codebase first. Output prop interfaces, type definitions, CSS variables, database columns, and component structure BEFORE writing implementation code. Never guess at type strings, prop names, or data shapes — read the source files. This applies especially to: switch case values, assessment type strings, section_type/section_category DB values, CSS variable names, and component prop interfaces.

## Reference Documents (read before any architecture or product questions)
- **Master Brief:** `docs/hadar-living-portfolio-brief-v3.md` — product spec, section map, design philosophy, Tayler's requirements
- **Architecture Doc:** `docs/hadar-living-portfolio-architecture.md` — ER diagram, API route map, component tree, data flow, auth flow, theming, AI layer, security checklist, design bible
- **Design Reference:** `design-reference/` — HTML mockups (`landing.html`, `hadar-portfolio.html`) and `landing-reference.png` (canonical screenshot). Open in browser before any UI work.
- **Archive:** `ARCHIVE.md` — historical session notes, completed sprints, superseded decisions. Read only when asked about past decisions; not needed for current work.

If the answer is in those docs, go there. This file is gotchas and guard rails — not the spec.

## Stack
Next.js 16 · TypeScript (strict) · Tailwind CSS 4 · Supabase · Clerk (Organizations) · Chart.js / react-chartjs-2 · Zod

## GOTCHAS — Read before any code change

### Security
- `SUPABASE_SERVICE_ROLE_KEY` only in `app/api/` server routes — never in client components
- `school_id` is derived server-side from the Clerk org — never sent from the client, never from a query param
- Demo student (`is_demo: true`) must never expose PII beyond first name in public-facing routes
- `DEMO_PASSWORD` env var gates `/demo` route — do NOT hardcode the password string anywhere in source or docs

### Multi-Tenancy
- Every table has a `school_id` column. Every query filters by `school_id`. No exceptions.
- No school name, logo, color, or branding hardcoded in any component — always from school config or theme context
- No Hadar-specific content in reusable components — Hadar content lives in seed data or school config
- Test with at least two mock schools before considering any feature complete

### Design
- Background is cream `--cream` (`#F7F4EE`) — Tailwind `bg-white` anywhere is a bug
- Borders are `1px solid var(--rule)` (`#D6D0C4`) — never Tailwind default gray
- Gold accent (`--gold`: `#C49A2A`) — for borders, ornaments, active states. Never as a background fill.
- No purple gradients. No dark mode. No rounded pill buttons. No card shadows. No drop shadows.
- Fonts loaded via Google Fonts in `layout.tsx` — never local files
- Read the Design Bible (Architecture Doc §9) before writing any CSS

### Data
- No hardcoded student data in reusable components — all data via props from `getStudentPortfolio()`
- Video slots accept either `storage_path` (Supabase) OR `external_url` (YouTube/Vimeo) — never assume one format
- All chart components accept typed `data` prop — no inline data
- **Grade levels are a closed enum** — always `GRADE_LEVELS` from `lib/gradeLevel.ts` ('pre-k','k','1'…'12'). DB column is `grade_level text CHECK (...)`. Zod schema uses `z.enum([...GRADE_LEVELS])`. All UI dropdowns use `GRADE_SELECT_OPTIONS`. Never accept free-text grade input.
- **Term fields are always `<select>` dropdowns** — import `TERM_OPTIONS` from `lib/constants.ts`; never free-text. All inline forms use this.
- **Academic year fields are always `<select>` dropdowns** — import `ACADEMIC_YEAR_OPTIONS` from `lib/constants.ts`. No pattern attribute needed; dropdown enforces format.
- **Student profile fields** — `gender` ('boy'|'girl', nullable), `date_of_birth` (date, nullable; age always computed never stored), `enrollment_status` ('active'|'withdrawn'|'graduated'|'transferred', default 'active'). Constants in `lib/constants.ts`. Enrollment badge on card only when NOT 'active'.
- **Zod v4 strict UUID validation** — `z.string().uuid()` enforces RFC 4122 (version nibble 1–5, variant nibble 8/9/a/b). All fixed/seed UUIDs must be real v4 UUIDs. The Hadar school UUID is `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`.
- **Chart.js registration** — `MapPercentileChart` and `MapTrajectoryChart` require `LineController` in `Chart.register()`. Do not remove; you'll hit "line is not a registered controller" at render.

### Tooling
- Cursor commit button is bugged — always use terminal for git
- If using Cursor, run in Claude-only mode (not Auto)
- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for Clerk middleware

## Branch workflow
- Solo-dev mode: pushes go directly to `main`. Husky runs the unit suite pre-commit as the main gate.
- GitHub branch protection exists but allows admin bypass; this is acceptable while Aaron is the only committer.
- When a second engineer joins the repo, formalize PR gating: all changes via PR, integration + e2e CI jobs promoted to required checks, admin bypass disabled.

## Code Hygiene Rules (enforce always)
1. No file over 300 lines — split into sub-components immediately
2. `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabaseAdmin.ts` (its definition) and `app/api/` routes. `supabaseAdmin` may be imported in server-only `lib/` helpers (e.g. `lib/auth.ts`, `lib/getStudentPortfolio.ts`, `lib/sectionData.ts`) that are themselves only ever called from `app/api/` routes or server components — never from client components.
3. No hardcoded student data in components — data flows from `getStudentPortfolio(id)`
4. No hardcoded school name, branding, or theme in components — always from school config
5. Every query filters by `school_id` — no exceptions
6. All chart components accept typed `data` prop — no inline data
7. Check file tree + line counts before every commit
8. Refactor checkpoint after every 3–4 features
9. Validate all API inputs with Zod — no unvalidated data hits Supabase
10. Run `npx tsc --noEmit` and `npx next build` before every push — never push a broken build
11. Run `npx vitest run` before every commit — the husky pre-commit hook enforces this automatically
12. **Audit columns** — every INSERT into assessments, readings, writing_samples, student_videos, teacher_notes, character_awards must include `created_by: ctx.userId` and `updated_by: ctx.userId`. Every UPDATE must refresh `updated_by` and `updated_at`.
13. **Soft delete** — the 6 tables above have `deleted_at`. All SELECT queries in `getStudentPortfolio.ts` must include `.is('deleted_at', null)`. Use `update({ deleted_at: new Date().toISOString() })` — never hard-delete these rows.

## Key Cross-File Contracts
Most component/file purposes are discoverable via Read. These entries capture **non-obvious cross-file contracts** that would bite if rediscovered by reading the file alone.

- `lib/supabaseAdmin.ts` — service-role client, lazy-init via Proxy. Server-only. Import via `lib/auth.ts`, `lib/getStudentPortfolio.ts`, `lib/sectionData.ts`, or directly inside `app/api/`.
- `lib/auth.ts` — `getAuthContext()` returns `{ userId, schoolId, role }`. `getRole()` falls back to `school_members` table if Clerk orgRole is absent or `org:member`.
- `lib/getStudentPortfolio.ts` — single data-fetch entry point for the portfolio tree. All section SELECTs must filter `school_id` and `.is('deleted_at', null)`.
- `lib/sectionData.ts` — 8 loaders (maps/lexile/avant/canon/etc.) shared by Profile Builder editor routes AND the parent Published view. Signature: `(studentId, schoolId, gradeLevel, academicYear)`. Do not duplicate these loaders elsewhere.
- `lib/academicYears.ts` — `getCurrentAcademicYear(schoolId)` returns the row with `is_current=true`. Throws if none is marked; catch to `null` only in read-only dashboard contexts. `getOrCreateAcademicYearId()` is used by Profile Builder create flow.
- `lib/gradeLevel.ts` — single source of truth for `GRADE_LEVELS`, `GradeLevel`, `formatGrade`, `sortGrades`, `GRADE_SELECT_OPTIONS`. All forms import from here.
- `lib/constants.ts` — re-exports grade options; defines `TERM_OPTIONS` + `TermOption`. All forms import from here — never hardcode term strings.
- `lib/validation.ts` — Zod schemas for all API route inputs. `gender` + `dateOfBirth` use `z.preprocess(v => v === '' ? null : v, ...)` (form sends `''` for unselected optional fields).
- `lib/types.ts` — shared domain types. `lib/types/profileBuilder.ts` has the Profile Builder types (Profile, ProfileSection, REQUIRED_SECTION_KINDS, etc.).
- `proxy.ts` — Clerk middleware (Next 16 — not `middleware.ts`). Protects `/dashboard`, `/admin`, `/portfolio`. userId-only check; no-org users hit `OrgPickerScreen` in dashboard.
- `supabase/migrations/` — numbered `00NN_*.sql` up to 0014 (some ghost — see Migration Workflow); all later migrations are timestamp-prefixed.
- `scripts/publishAthenaSpringProfile.ts` — one-off backfill from pre-review-queue days; kept for reference but superseded by the approve route.

### Orphaned / legacy (file exists but only used by DemoPortfolio.tsx, if at all)
Kept in-tree to avoid churn. **Do not wire these into new pages or the real portfolio tree** — they are superseded:
- `components/portfolio/IntellectualArc.tsx` — superseded by MathSection + EnglishSection
- `components/portfolio/ImmersionEngine.tsx` — superseded by HebrewSection
- `components/portfolio/CreativeEvolution.tsx` — superseded by CompositionView
- `components/portfolio/RhetoricRoom.tsx` — removed from tabs; no replacement
- `components/portfolio/HandwritingSamples.tsx` — merged into CompositionView
- `components/portfolio/ScopeAndSequence.tsx` — removed from tabs; pending move to teacher dashboard
- `components/portfolio/BookDetail.tsx`, `ClassBookshelf.tsx`, `spinePalette.ts` — superseded by CanonListView + CanonBookDetail. Marked DEPRECATED.

### Does NOT exist yet (do not reference as if it does)
- `components/theme/ThemeProvider.tsx` — School theme context
- `lib/getSchoolConfig.ts` — Fetch school settings + theme
- `middleware.ts` — Next.js 16 uses `proxy.ts` instead

## Auth (Clerk Organizations)
- Each school = one Clerk Organization
- Roles: `admin`, `teacher`, `parent` — scoped to the org, not global
- `admin` — all student data within their school, school settings, teacher management, Dr. Worth review queue
- `teacher` — upload, edit, comment, review/accept AI drafts, draft profiles
- `parent` — view-only on teacher content, upload-only in Parent Uploads section, sees only own children via `parent_user_ids`
- `/demo` — cookie-based password gate (`demo_session` cookie), no Clerk required
- `/dashboard`, `/admin`, `/portfolio` — Clerk protected via `proxy.ts`; unauthenticated → `/sign-in?redirect_url=...`; authenticated with no org → `OrgPickerScreen` in dashboard
- Role fallback: if Clerk orgRole is absent or `org:member`, `getRole()` queries `school_members` table before throwing `AUTH_INVALID_ROLE`

## Architectural Decisions (locked — do not reverse without discussion)
- **`on delete restrict` for all `school_id` FKs** — A school record cannot be deleted while student/content rows exist under it. Deletion must be a deliberate multi-step operation. (`school_members` uses cascade — member records are disposable.)
- **`school_members` allows multiple roles per user** — Unique constraint is `(school_id, clerk_user_id, role)`, not `(school_id, clerk_user_id)`. A user can be both teacher and parent at the same school; they get two rows.
- **Teachers have broad read access within their school** — RLS policies give teachers SELECT on all students in their school. Narrowing to assigned students is deferred until a `student_teachers` join table is added.
- **`ai_drafts` INSERT is service-role only** — No authenticated INSERT policy exists. Only the AI pipeline (via `supabaseAdmin`) creates draft rows. Teachers update (accept/edit/reject); they never insert.
- **Signin form styles in `landing-mobile.css`** — The form's mobile overrides are tightly coupled to its base styles; co-locating them in the same file keeps the cascade readable. Intentional.
- **Portfolio overview: flat tab list + dashboard hub** — Tabs are The Canon, Math, English, Hebrew, Soulcraft under a single `/group/portfolio` route, plus standalone `/journal` and `/gallery` routes. The hub page is a visual dashboard grid (5 metric cards + 2 bottom links), NOT a list of group cards.
- **Composition lives as a sub-tab inside English and Hebrew** — `CompositionView` is rendered from `EnglishSection` (with `initialLanguage="english"`) and from `HebrewSection` (with `initialLanguage="hebrew"`). When `initialLanguage` is set, CompositionView hides its language pill bar and the samples list is pre-filtered. There is no standalone Composition tab. To bring the unified cross-language view back, render `<CompositionView>` with `initialLanguage` omitted.
- **The Canon renders as a list, not a bookshelf** — `CanonListView` + `CanonBookDetail` replaced the spine bookshelf + BookDetail accordion + ClassBookshelf tab. Do not reintroduce spine rendering into TheCanon.
- **Knowledge (Scope & Sequence) removed from portfolio tabs** — `ScopeAndSequence.tsx` is orphaned until it moves to the teacher dashboard as a per-grade view. Do not add a Knowledge tab back to the portfolio.
- **Hero section: slim identity strip** — Left cluster is the student (72px photo with `2px solid var(--gold)` border + name + "Grade {n} · Age {age}" line + optional InviteParentButton). Right cluster is school logo (or first-initial fallback) + italic school name at 50% opacity. No metrics.
- **StatsBar removed from hub** — Year filtering happens inside detail views only (GroupDetailClient + SectionDetailClient). The hub dashboard does not filter by year.
- **Year selector placement** — Standalone `<YearSelector>` rendered by `GroupDetailClient` only for tabs that filter by year (math, english, the-canon). `SectionDetailClient` has its own for the same slugs. Never add a third instance, and never add one to the hub.
- **Supabase RLS status** — RLS is enabled on all 20 public tables. Policies exist for core tables (0003). Sprint 3+ tables (photos, parent_uploads, handwriting_samples, teacher_notes, scope_and_sequence, book_catalog, student_videos) have RLS enabled but **policies not yet applied to production**. Service role bypasses RLS for all `app/api/` routes. ⚠️ Complete before giving parents direct DB access.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server routes only — never client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DEMO_PASSWORD=                      # do NOT commit the actual value
ANTHROPIC_API_KEY=                  # server routes only — never client
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Migration Workflow (Supabase CLI)
All migrations go through the CLI — never apply SQL manually through the Supabase dashboard. Tracking is automatic.

```bash
npm run db:new <name>   # Create next timestamped migration file in supabase/migrations/
npm run db:push         # Apply pending migrations to production
npm run db:status       # List all migrations and their applied status
npm run db:reset        # Reset local DB and replay all migrations (local only)
```

- All numbered migrations (0001–0014) are tracked and marked as applied.
- ⚠️ **0001–0014 may be ghost migrations** — they were retroactively marked applied without necessarily having run their DDL. If a column/constraint/index declared in one of those files is missing in production, create a new timestamped migration with idempotent DDL (`add column if not exists`, `drop constraint if exists` + `add constraint`, etc.) and push it. **Never edit the historical `00NN_*.sql` files in place** — the migration ledger is immutable once recorded. (See ARCHIVE.md for the one documented exception — 0012.)
- **Docker Desktop is NOT required** for `db:new` or `db:push` — only for `db:pull` and `db:reset` (local dev features we don't use).
- Migration files live in `supabase/migrations/` and are committed to git like any other code.

## Verification Commands
```bash
# File hygiene
wc -l $(find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .next)
# Confirm no file over 300 lines

# Security checks
grep -r "SERVICE_ROLE" --include="*.tsx" --include="*.ts" | grep -v "app/api/" | grep -v node_modules
# Should return nothing — service role key only in app/api/

grep -r "bg-white" --include="*.tsx" --include="*.css" | grep -v node_modules
# Should return nothing — cream background only

grep -rn "Hadar" components/ | grep -v node_modules
# Review results — school name should not be hardcoded in reusable components

grep -r "school_id" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .next
# Every query/route should include school_id filtering
```

## Testing infrastructure

**Unit (default Vitest suite)**
- Run: `npm test`
- Config: `vitest.config.ts` (excludes tests/integration/** and tests/e2e/**)
- Pattern: mocks `@/lib/supabaseAdmin` + `@/lib/auth`, no DB
- Currently 132 tests across 13 files
- Fast, offline, no dependencies

**Integration (Vitest against local Supabase)**
- Run: `npm run test:integration`
- Config: `vitest.integration.config.ts`
- Requires: `supabase start` running (Docker Desktop + local stack)
- Produces real DB writes against `http://127.0.0.1:54321`
- Production guard in `vitest.integration.setup.ts` throws if URL isn't localhost
- Harness: `tests/integration/helpers/testHarness.ts` — `adminClient()`, `seedSchool()`, `seedStudent()`, `deleteSchool()`, `makeAuthContext()`
- Currently 3 files, 6 tests (smoke, profileFlow, reviewFlow)

**E2E (Playwright + Chromium)**
- Run: `npm run test:e2e`
- Config: `playwright.config.ts` (Chromium only, auto-boots `next dev -p 3100`)
- Currently 1 test (landing-page smoke)
- Known issues:
  - Dev server reads `.env.local` not `.env.test` — fix before first real feature E2E test that relies on test-mode Clerk keys.
  - Local Chromium hits `ERR_NAME_NOT_RESOLVED` on 127.0.0.1 from inside Playwright's worker on this machine. Runs fine on CI (Ubuntu).

**CI (`.github/workflows/ci.yml`)**
- `check` job (tsc + vitest run) — blocking, required check
- `integration` job — continue-on-error: true, spins up supabase locally
- `e2e` job — continue-on-error: true, installs Playwright + Chromium
- Integration + E2E will be promoted to required checks after staying green for a week

**Workflow rules going forward**
- Every new feature should ship with at least one integration test covering its critical path
- PATCH/POST endpoints should have API-level tests that verify auth gating
- Before external demos: the full trifecta (unit + integration + e2e) should be green
- If you find yourself mocking the DB in a new test, ask whether it should be an integration test instead

## ⚠️ Three section-name taxonomies — do not confuse
1. **Route slugs (UI)**: `the-canon`, `math`, `english`, `hebrew`, `soulcraft` — current
2. **`ai_drafts.section_type` (DB)**: `math_scores`, `english_scores`, `immersion`, `writing`, `virtue_badges`, `reading_bookshelf` — UNCHANGED
3. **`schools.enabled_sections` (dormant)**: `academic_scores`, `reading`, `writing`, etc. — UNCHANGED

Tab order: The Canon · Math · English · Hebrew · Soulcraft. Each of English and Hebrew has Spelling · Grammar · Composition · Video sub-tabs. Teacher journal and Gallery live at `/journal` and `/gallery` — not inside the tab list.

## Product thesis
Quire's hero feature is the **Learning Profile Builder** — a system that replaces the 1.5-hour manual per-student, per-semester profile assembly (currently Google Slides) with a ~10–20 minute assisted assembly. Data Quire already holds (MAP, AVANT, Lexile, reading list, writing samples, photos, captured notes) flows into a structured document; AI drafts narrative prose; teachers edit and approve; Dr. Worth (Head of School) reviews and publishes; parents receive a permanent record.

### Cadence and roles
- Two semesters per year: Fall and Spring
- ~8 students per grade in current Hadar setup
- Two-role workflow: **Teacher** (drafts, fills sections, reviews AI drafts) → **Dr. Liliana Worth, Head of School** (reviews, approves, publishes)
- Tayler Lonsdale is the customer and school founder, NOT in the per-student workflow
- Parents receive the published document (web view + downloadable PDF). Previous semesters stay accessible forever.

### Product architecture (5 things)
1. **Roster + Profile Queue** — teacher's landing page; class + each student's current-semester profile status
2. **Profile Builder** (hero) — workspace for assembling a semester's profile per student. 9 required sections: MAPS Math & English, Lexile, AVANT Hebrew, Hebrew national comparison, Canon reading list, English composition, Hebrew composition, Character Development (Middot), Rhetoric (Poetry Recitation). Plus optional highlight sections (art, field trips).
3. **Captured data feed** — chronological stream of notes/photos/videos per student; feeds Profile Builder sections
4. **Quick Capture** (support) — globally available slide-over panel for ad-hoc logging. StreamComposer scaffold becomes this feature; not a top-level page. Will be reachable via floating button + Cmd+Shift+N.
5. **Parent View** — published profile, web display + PDF export. All past semesters browseable.

### Section completion
- Completion is measured against **required** sections only. Optional sections are additive, not part of the completion tally.
- Section status vocabulary: Complete / Awaiting your narrative / In progress / Not started
- Profile status state machine: `draft` → `in_review` → `published`, or `in_review` → `draft` (with `review_feedback`)

### AI / Claude naming in product
Per Tayler's feedback, Claude should NOT be named in product UI copy. Use "Quire" or passive language ("A draft is ready for you to review"). Claude can be credited in marketing/footer/about contexts per Anthropic's terms, but the teacher-facing workflow should read as Quire's product, not a thin wrapper on Claude.

## Profile Builder phase plan
- ✅ **Phase 1–3**: Profile Builder structure + 9 sections (schema, creation flow, per-section editors, section data sources)
- ✅ **Phase 4**: Dr. Worth review queue — shipped 2026-04-19 in Session A. `draft → in_review → published | draft-with-feedback` state machine. Admin-only `/dashboard/review-queue` list + preview. Section PATCH returns 403 LOCKED while profile is in_review. Three POST endpoints: `/submit`, `/approve`, `/request-changes`.
- ⏳ **Phase 5**: real Claude API drafting behind Generate Draft buttons
- ⏳ **Phase 6**: published-view polish (charts in published view instead of tables, poetry iframe, PDF export)
- ⏳ **Phase 7**: Quick Capture (StreamComposer reactivation)

## Session A state (April 19, 2026)
- **Pedagogical schools sidebar**: per-tenant JSONB config on `schools.pedagogical_schools`, scales to K–12. Sidebar hides when ≤1 school configured (Hadar's case). See `components/dashboard/PedagogicalSidebar.tsx`.
- **Dr. Worth Review Queue**: state machine on `profiles.status` — `draft → in_review → published` OR `draft + review_feedback` (returned). Admin-only `/dashboard/review-queue`. Section PATCH returns 403 LOCKED while profile is in_review. Three POST endpoints: `/submit`, `/approve`, `/request-changes`.
- **Hygiene**: `getCurrentAcademicYear(schoolId)` helper replaces hardcoded `CURRENT_ACADEMIC_YEAR_LABEL`. Section data fetchers consolidated in `lib/sectionData.ts` (8 loaders), consumed identically by editor routes and parent published view.

## Blocked / pending items
- **Replace Lexile metric** — ⏳ BLOCKED: pending Karissa's input on preferred reading-level framework (Fountas & Pinnell, DRA, or narrative description). Lexile bar chart remains in place until decision.
- **Scope and sequence from Lobel team** — ⏳ BLOCKED: Lobel team has not supplied curriculum scope and sequence content. `ScopeAndSequence.tsx` is orphaned with placeholder/seed data. Build import or admin UI once format is confirmed.
- **Load real Athena data** — Demo student currently uses hardcoded seed data; seed Athena's real assessment scores, readings, and samples so the demo portfolio reflects genuine student work.
- **Sentry error tracking** — not yet installed.
- **Tech debt**: `hadar-living-portfolio → quire-platform` rename (good moment: during a routing-heavy phase). `lib/types.ts` refactor into directory (re-export stopgap working fine for now). Broader ghost-migration audit for 0001–0011 columns.
- **Deferred**: StreamComposer wiring into WorkbenchView (revisit only if Profile Builder falters or Quick Capture gets prioritized independently). Auto-categorization of teacher notes via Haiku.
- **Tayler**: reaction to the final mockup (iterating actively — thesis validated, in UX polish feedback mode).
