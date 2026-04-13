# CLAUDE.md — Hadar Living Portfolio

## Agent Behavior
Say "🫡" in your first message to acknowledge you've read this document.
Always recommend the optimal, future-proofed solution — never the shortcut.
At end of every session: ask "anything to clean up?" and remind Aaron to update this file.

## Reference Documents (read before any architecture or product questions)
- **Master Brief:** `docs/hadar-living-portfolio-brief-v3.md` — product spec, section map, design philosophy, sprint task list, Tayler's requirements
- **Architecture Doc:** `docs/hadar-living-portfolio-architecture.md` — ER diagram, API route map, component tree, data flow, auth flow, theming, AI layer, security checklist, design bible
- **Design Reference:** `design-reference/` — HTML mockups (`landing.html`, `hadar-portfolio.html`) and `landing-reference.png` (canonical screenshot). Open in browser before any UI work.

If the answer to a question is in those docs, go there. This file is gotchas and guard rails — not the spec.

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

### Data
- **Grade levels are a closed enum** — always `GRADE_LEVELS` from `lib/gradeLevel.ts` ('pre-k','k','1'…'12'). DB column is `grade_level text CHECK (...)`. Zod schema uses `z.enum([...GRADE_LEVELS])`. All UI dropdowns use `GRADE_SELECT_OPTIONS`. Never accept free-text grade input.
- **Term fields are always `<select>` dropdowns** — import `TERM_OPTIONS` from `lib/constants.ts`; never free-text. All inline forms (InlineAssessmentForm, InlineAvantForm, InlineVideoForm, InlineWritingForm, InlineCharacterForm, AssessmentForm) use this.
- **Academic year fields are always `<select>` dropdowns** — import `ACADEMIC_YEAR_OPTIONS` from `lib/constants.ts`. No pattern attribute needed; dropdown enforces format.
- **Student profile fields (0011)** — `gender` ('boy'|'girl', nullable), `date_of_birth` (date, nullable; age always computed never stored), `enrollment_status` ('active'|'withdrawn'|'graduated'|'transferred', default 'active'). Constants: `GENDER_OPTIONS`, `ENROLLMENT_STATUS_OPTIONS` in `lib/constants.ts`. Enrollment status badge on card only when NOT 'active'.
- **Zod v4 strict UUID validation** — `z.string().uuid()` in Zod v4 enforces RFC 4122 (version nibble 1–5, variant nibble 8/9/a/b). All fixed/seed UUIDs must be real v4 UUIDs. The Hadar school UUID is `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`.

### Tooling
- Cursor commit button is bugged — always use terminal for git
- If using Cursor, run in Claude-only mode (not Auto)
- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for Clerk middleware

### Branch Workflow
- All work happens on branches: `aaron/feature-name` or `mijntje/feature-name`
- PRs required to merge to main; CI must pass before merge
- Mijntje's PRs require Aaron's approval; Aaron can bypass as repo admin
- CI runs `npx tsc --noEmit` + `npx vitest run` on every push/PR (`.github/workflows/ci.yml`)

## Code Hygiene Rules (enforce always)
1. No file over 300 lines — split into sub-components immediately
2. `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabaseAdmin.ts` (its definition) and `app/api/` routes. `supabaseAdmin` may be imported in server-only `lib/` helpers (e.g. `lib/auth.ts`, `lib/getStudentPortfolio.ts`) that are themselves only ever called from `app/api/` routes or server components — never from client components.
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

## Key Files

### Exists now
- `app/page.tsx` — Landing page entry (thin server component; renders LandingShell + LandingContent)
- `app/LandingShell.tsx` — Client wrapper; checks `sessionStorage.splash_played`, mounts BookSplash overlay on first visit
- `app/LandingContent.tsx` — Static landing page markup + CSS imports (extracted from page.tsx)
- `app/styles/landing-layout.css` — CSS vars, keyframes, page grid
- `app/styles/landing-left-panel.css` — Navy manuscript panel
- `app/styles/landing-right-panel.css` — Parchment portal panel
- `app/styles/landing-mobile.css` — Signin card, form, responsive overrides
- `app/demo/page.tsx` — Demo portfolio (server component, password-gated)
- `app/demo/DemoPortfolio.tsx` — Demo portfolio client component
- `app/demo/DemoGate.tsx` — Password form component
- `app/demo/portfolio.css` — Demo portfolio styles (⚠️ CSS variables not yet unified with landing styles — Sprint 1.5 remaining task); contains CSS for: `.hub-group-card`, `.stats-bar` / `.stats-bar-cell`, `.group-tab-bar` / `.group-tab`, `.sidenav-group-row`
- `app/layout.tsx` — Root layout, ClerkProvider, font loading
- `app/globals.css` — Global styles
- `app/api/demo/auth/route.ts` — Demo password gate API route
- `components/portfolio/` — Section components (CharacterArc, CreativeEvolution, HeroSection, ImmersionEngine, IntellectualArc, PortfolioFooter, RhetoricRoom, SideNav, TheCanon)
- `components/portfolio/GroupDetailClient.tsx` — `'use client'` tabbed view for group detail pages (`/group/[groupSlug]`); owns `selectedYear` + `years` state; `YEAR_FILTER_TABS` gates `<YearSelector>` to only intellectual-arc, the-canon, creative-evolution tabs; TheCanon/CreativeEvolution receive filtered data arrays; IntellectualArc receives `selectedYear` prop; `TabErrorBoundary` class resets on tab change
- `components/portfolio/YearSelector.tsx` — Year-filter pill bar; used in GroupDetailClient and SectionDetailClient (NOT in HubShell — year pills are merged into StatsBar there)
- `components/portfolio/HeroSection.tsx` — Identity strip (photo + name on the left, school logo/initial + italic name on the right at 35% opacity); exports `StatsBar` named export (metrics ribbon + year pills, `justify-content: space-between`); takes `school?: SchoolConfig` so the right cluster can render `logoUrl` or fall back to a first-initial circle; photo/initials circle is 96px; padding `1.25rem 2.5rem`
- `components/portfolio/HubShell.tsx` — `'use client'` hub wrapper; owns `selectedYear` + `years` state; passes year props to `<StatsBar>` (no standalone YearSelector); renders 3-group `<PortfolioHub>` below
- `components/portfolio/PortfolioHub.tsx` — 3 elegant group cards (Academics, Student Work, Gallery); each links to `/portfolio/[studentId]/group/[slug]`. Subtitle helpers `academicsSubtitle`/`studentWorkSubtitle`/`gallerySubtitle` return dynamic summaries when data exists (latest Math percentile + Hebrew composite / latest book + teacher-note count / photo + parent-upload counts); static copy is the fallback. The hub ends at the "View Full Portfolio →" button — school branding lives on the hero's right side, not here.
- `components/portfolio/SideNav.tsx` — Sidebar nav with expandable groups; group headers link to `/group/[slug]`; chevron button independently toggles sub-items; sub-items link to `/group/[slug]?tab=[section-slug]`; accepts `activeGroup` prop
- `components/portfolio/RevealObserver.tsx` — IntersectionObserver wrapper; fires CSS reveal animations when sections enter viewport. Required on real portfolio pages — sections were invisible without it (bug fixed)
- `components/portfolio/SubjectScoreRows.tsx` — Compact RIT/percentile score table; accepts `ScoreDisplayRow[]`; used by IntellectualArc for Math and ELA sub-sections
- `components/portfolio/InlineAssessmentForm.tsx` — Inline data-entry form inside IntellectualArc; replaces TeacherDataPanel for assessment scores; POSTs to assessments API; calls `router.refresh()` on save
- `components/portfolio/InlineReadingForm.tsx` — Inline data-entry form inside TheCanon; replaces TeacherDataPanel for reading list; "Add from catalog" opens BookCatalogPicker; calls `router.refresh()` on save
- `components/portfolio/ReadingForm.tsx` — Enhanced book intake form; used in edit-book modal inside TheCanon; 3 grouped sections (Book Info / Reading Details / Reflections); supports both POST (add) and PATCH (edit) modes via optional `readingId` + `initial` props
- ~~`components/portfolio/TeacherDataPanel.tsx`~~ — Deleted (replaced by InlineAssessmentForm + InlineReadingForm)
- `components/portfolio/BookDetail.tsx` — Accordion detail panel for a book entry in TheCanon; shows cover thumbnail (Open Library API) + all reading fields; hover-reveal Edit/Delete buttons for admin/teacher
- `components/portfolio/StarRating.tsx` — 5-star click-to-rate input; gold filled vs outline; click same star again to clear; used in ReadingForm
- `components/portfolio/BookCatalogPicker.tsx` — Modal overlay; fetches school book catalog, live search, auto-fills ReadingForm/InlineReadingForm title+author on selection
- `components/portfolio/BookCatalogManager.tsx` — Book Catalog tab content; add-book form (title, author, gradeLevel) + paginated catalog list; school-scoped, no props needed
- `components/splash/BookSplash.tsx` — Full-screen 3D CSS book-opening splash animation (navy cover → parchment reveal → fade); sessionStorage-gated (plays once per browser session); 9 unit tests
- `components/charts/` — AvantChart, MapPercentileChart, MapTrajectoryChart
- `components/charts/MapPercentileChart.tsx` — NWEA MAP percentile band chart; 5 stacked teal area fills (p5/p25/p50/p75/p95); student dots navy/gold (latest); auto-scales grade range and y-axis; subject='math'|'reading'; requires `LineController` in `Chart.register()` — do not remove
- `components/charts/MapTrajectoryChart.tsx` — student score trajectory over time; also requires `LineController` in `Chart.register()`
- `lib/nweaNorms.ts` — NWEA MAP Growth 2025 norm lookup (K–8, Math + Reading, fall/winter/spring); `getPercentileBands(subject, gradeRange)` returns p5–p95 via z-scores
- `lib/types.ts` — Shared TypeScript types (all domain models; includes `BookCatalogEntry`)
- `lib/mappers.ts` — Row mappers: Supabase snake_case → camelCase TS
- `lib/supabase.ts` — Client-side Supabase client (anon key)
- `lib/supabaseAdmin.ts` — Server-side admin client (service role key — API routes only)
- `lib/getStudentPortfolio.ts` — Single data-fetch entry point
- `lib/auth.ts` — Clerk helpers: getSchoolId(), getRole(), getAuthContext(), requireRole()
- `lib/utils.ts` — Shared utilities: `ordinal(n)` (1→"1st"), `latestAssessment(assessments, type)` (most recent by academicYear)
- `lib/modalStyles.ts` — Shared modal style constants: `MODAL_OVERLAY`, `MODAL_HEADER`, `modalPanel(maxWidth, maxHeight)`
- `lib/validation.ts` — Zod schemas for all API route inputs; `gradeLevel` uses `z.enum([...GRADE_LEVELS])` — must match `lib/gradeLevel.ts`; `gender` and `dateOfBirth` use `z.preprocess(v => v === '' ? null : v, ...)` to coerce empty string → null (form sends `''` for unselected optional fields)
- `lib/gradeLevel.ts` — `GRADE_LEVELS` const array, `GradeLevel` type, `formatGrade()`, `sortGrades()`, `GRADE_SELECT_OPTIONS`; single source of truth for grade enum
- `lib/constants.ts` — Re-exports `GRADE_SELECT_OPTIONS` from `lib/gradeLevel`; defines `TERM_OPTIONS` ('Fall 2024'–'Spring 2026') and `TermOption` type; **all forms import from here — never hardcode term strings**
- `proxy.ts` — Clerk middleware (Next.js 16); protects /dashboard, /admin, /portfolio; userId-only check (org not required) so OrgPickerScreen handles no-org case
- `supabase/migrations/` — 0001 initial schema, 0002 multi-tenancy, 0003 RLS policies, 0004 Sprint 3 tables, 0005 parent_students, 0006 student archived_at, 0007 book_catalog, 0010 grade_level_enum, 0011 student_profile_fields (gender, date_of_birth, enrollment_status), 0012 data_foundation (audit columns, soft delete, academic_years, enrollment_records, class_assignments)
- `design-reference/` — Target aesthetic HTML files (landing.html, hadar-portfolio.html)
- `app/dashboard/page.tsx` — Teacher/admin student list; parent redirect (OR filter on parent_clerk_user_id + invited_email); server component
- `app/dashboard/DashboardUI.tsx` — Presentational sub-components: OrgPickerScreen, ParentPendingScreen, PageHeader, StudentCard, EmptyState. The header "Settings" gear is a `<Link href="/dashboard/settings">` (admin only); Year-in-Review is still a view toggle.
- `app/dashboard/AddStudentForm.tsx` — Client component modal form; POSTs to /api/dashboard/students; gradeLevel is a `<select>` using `GRADE_SELECT_OPTIONS`
- `app/dashboard/DashboardClient.tsx` — `'use client'` wrapper; owns `activeView: DashboardView` state (`roster` | `year-in-review`); renders sidebar + StudentGrid/YearInReviewView
- `app/dashboard/settings/page.tsx` — Server component; admin-only `/dashboard/settings` route; non-admin redirects to `/dashboard`; fetches `schools.id/name/logo_url` and hands them to `SettingsUI`
- `app/dashboard/settings/SettingsUI.tsx` — `'use client'` UI for school settings; "School Identity" section with logo preview (120px) and Upload Logo button (POST /api/dashboard/settings/logo, 2 MB max, image/* only, optimistic update via local state); "School Name" section is display-only for now
- `app/dashboard/DashboardSidebar.tsx` — Sidebar nav (Student Rosters, By Grade, Year in Review, Settings); Settings admin-only
- `app/dashboard/StudentGrid.tsx` — Grade filter pills + search; groups/sorts via `formatGrade`/`sortGrades`
- `components/dashboard/ByGradeView.tsx` — Collapsible per-grade sections; sorted with `sortGrades()`
- `components/dashboard/YearInReviewView.tsx` — Placeholder
- `app/not-found.tsx` — Styled 404 page using design system tokens
- `app/admin/page.tsx` — Admin-only school settings overview; Sprint 3 placeholders for Teachers + Theme
- `app/portfolio/[studentId]/page.tsx` — Dynamic portfolio hub (server component); renders HubShell with 3 group cards
- `app/portfolio/[studentId]/group/[groupSlug]/page.tsx` — Group detail page (server component); validates slug (academics|student-work|gallery), fetches portfolio, renders GroupDetailClient with `initialTab` from `?tab=` searchParam
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk SignIn centered on cream background
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk SignUp centered on cream background
- `app/api/ai/draft/route.ts` — POST: generate AI narrative draft via Claude Haiku; studentFirstName injected into system prompt; stores in ai_drafts; returns { draftId, text, sectionType }
- `app/api/ai/drafts/[draftId]/route.ts` — PATCH: accept/reject/edit an AI draft; sets content_final, status, reviewed_by, reviewed_at
- `app/api/dashboard/students/[studentId]/uploads/route.ts` — POST: multipart upload to portfolio-assets Supabase Storage; inserts into photos, handwriting_samples, or parent_uploads; role-gated (parent ownership check)
- `app/api/dashboard/settings/logo/route.ts` — POST: admin-only multipart upload of the school logo to `portfolio-assets/{school_id}/logo.{ext}`; image/* only, 2 MB max, rate-limited 5/min per user; cleans up any prior extension in the folder; writes cache-busted public URL to `schools.logo_url`; calls `revalidateSchool(schoolId)` to bust every cached portfolio in that school. Vitest suite at `route.test.ts` covers admin happy path, auth/role rejection, non-image, file-too-large, and storage error.
- `components/shared/AiDraftEditor.tsx` — Client component: view/edit/resolve AI draft; Accept, Edit & Accept, Reject buttons
- `components/portfolio/AiNarrativePanel.tsx` — Generate button + inline AiDraftEditor; teacher/admin sees generate flow or resolved draft; parent sees accepted text only; wired into IntellectualArc ×2 (math_scores, english_scores), ImmersionEngine, TheCanon, CreativeEvolution, CharacterArc
- `components/shared/UploadButton.tsx` — Client component: hidden file input, XHR upload with progress bar, onSuccess/onError callbacks; wired into PhotoGallery, HandwritingSamples, ParentUploads
- `components/shared/InviteParentButton.tsx` — Client component: modal with email input, POSTs to invite-parent route; shown below HeroSection for admin/teacher only; trigger is text-link style (no border, opacity 0.5, fades to full on hover)
- `app/api/dashboard/students/route.ts` — GET/POST students; POST INSERT includes `gender`, `date_of_birth`, `enrollment_status`, `updated_at`; Zod schema uses `z.preprocess` for optional nullable fields
- `app/api/dashboard/students/[studentId]/invite-parent/route.ts` — POST: inserts pending parent_students row, calls Clerk createOrganizationInvitation with role 'org:parent'
- `supabase/migrations/0005_parent_students.sql` — parent_students table: invited_email, nullable parent_clerk_user_id, status (pending/active), RLS; apply before testing invite flow
- `supabase/migrations/0012_data_foundation.sql` — audit columns (created_by, updated_by, updated_at) + soft delete (deleted_at) on 6 content tables; academic_years table (canonical year registry per school); enrollment_records table (enrollment history per student); class_assignments table (student ↔ teacher per year)
- `.github/workflows/ci.yml` — GitHub Actions CI; triggers on push/PR to main; runs `npm ci` → `npx tsc --noEmit` → `npx vitest run`; `check` job name must match branch protection status check

### Does NOT exist yet (do not reference as if it does)
- `components/theme/ThemeProvider.tsx` — School theme context
- `lib/getSchoolConfig.ts` — Fetch school settings + theme
- `middleware.ts` — does not exist; Next.js 16 uses `proxy.ts` instead

## Auth (Clerk Organizations)
- Each school = one Clerk Organization
- Roles: `admin`, `teacher`, `parent` — scoped to the org, not global
- `admin` — all student data within their school, school settings, teacher management
- `teacher` — upload, edit, comment, review/accept AI drafts for assigned students
- `parent` — view-only on teacher content, upload-only in Parent Uploads section, sees only own children via `parent_user_ids`
- `/demo` — cookie-based password gate (`demo_session` cookie), no Clerk required
- `/dashboard`, `/admin`, `/portfolio` — Clerk protected via `proxy.ts`; unauthenticated → `/sign-in?redirect_url=...`; authenticated with no org → `OrgPickerScreen` (`<OrganizationSwitcher />`) in dashboard
- Role fallback: if Clerk orgRole is absent or `org:member`, `getRole()` queries `school_members` table before throwing `AUTH_INVALID_ROLE`

## Architectural Decisions (locked — do not reverse without discussion)
- **`on delete restrict` for all `school_id` FKs** — A school record cannot be deleted while student/content rows exist under it. Deletion must be a deliberate multi-step operation. (`school_members` uses cascade — member records are disposable.)
- **`school_members` allows multiple roles per user** — Unique constraint is `(school_id, clerk_user_id, role)`, not `(school_id, clerk_user_id)`. A user can be both teacher and parent at the same school; they get two rows.
- **Teachers have broad read access within their school** — RLS policies give teachers SELECT on all students in their school. Narrowing to assigned students is deferred to Sprint 3 when a `student_teachers` join table is added.
- **`ai_drafts` INSERT is service-role only** — No authenticated INSERT policy exists. Only the AI pipeline (via `supabaseAdmin`) creates draft rows. Teachers update (accept/edit/reject); they never insert.
- **Signin form styles in `landing-mobile.css`** — The form's mobile overrides are tightly coupled to its base styles; co-locating them in the same file keeps the cascade readable. This is intentional, not a mistake.
- **Portfolio overview: 3 groups, not flat tiles** — Academics (Intellectual Arc, Immersion Engine, Scope & Sequence), Student Work (The Canon, Creative Evolution, Rhetoric Room, Handwriting, Teacher Notes, Character Arc), Gallery (Photo Gallery, Parent Uploads). The 11-tile flat layout is gone; do not revert.
- **Hero section: student identity + school identity** — Left cluster is the student (photo + name + optional InviteParentButton). Right cluster is the school logo (or first-initial fallback circle) and italic school name at 35% opacity. Metrics live in `StatsBar` below the hero, not inside it. No school branding elsewhere on the hub — the hero is the single source.
- **Year selector placement** — Hub overview: year pills merged into `StatsBar` right side. Group pages: standalone `<YearSelector>` rendered by `GroupDetailClient` only for tabs that filter by year. `SectionDetailClient` has its own year selector too. Never add a fourth instance.
- **Supabase RLS status** — RLS is enabled on all 20 public tables. Policies exist for core tables (0003). Sprint 3+ tables (photos, parent_uploads, handwriting_samples, teacher_notes, scope_and_sequence, book_catalog, student_videos) have RLS enabled but **policies not yet applied to production**. Service role bypasses RLS for all `app/api/` routes. ⚠️ Complete before giving parents direct DB access.

## Build Sprints (update checkboxes each session)
- [x] Sprint 1: Landing page, demo portfolio, design system, six-section UI — COMPLETE
- [x] Sprint 1.5: Security, multi-tenancy foundation, code hygiene — COMPLETE
  - [x] Create `schools` table with theme_json, enabled_sections, clerk_org_id
  - [x] Add `school_id` to all existing tables (0002 migration)
  - [x] Create Hadar seed record (fixed UUID `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`)
  - [x] Create `ai_drafts` table
  - [x] Create `school_members` table
  - [x] Install Clerk, wrap ClerkProvider in layout.tsx
  - [x] Create proxy.ts with route protection (Next.js 16 — not middleware.ts)
  - [x] Write Supabase RLS policies (0003 migration — pending Clerk JWT setup in Supabase dashboard)
  - [x] Add `/demo` password gate (server component + API route)
  - [x] Create `lib/supabase.ts`
  - [x] Create `lib/supabaseAdmin.ts`
  - [x] Create `lib/getStudentPortfolio.ts` + `lib/mappers.ts`
  - [x] Create `lib/auth.ts`, `lib/types.ts`, `lib/validation.ts`
  - [x] Install Zod
  - [x] Split `page.css` (639 lines) into 4 partials under app/styles/
  - [x] Unify CSS color variables — single canonical :root in globals.css; landing and portfolio :root blocks removed; --lapis* aliases kept for landing CSS compatibility
  - [x] Clerk org setup — sign-in/sign-up pages, OrgPickerScreen for no-org users, role fallback via school_members table
  - [x] Set up Vitest + basic tests — mappers, validation, soft-delete route (53 tests; husky pre-commit hook enforces vitest run)
  - [x] Set up GitHub Actions CI — `.github/workflows/ci.yml`; tsc + vitest on push/PR; branch protection requires `check` job to pass
  - [ ] Add Sentry error tracking
  - [x] Audit package.json for phantom dependencies
  - [x] Remove Hadar-specific strings from reusable components (SideNav now accepts schoolName/studentName props; falls back to "Hadar" for demo)
- [x] Sprint 2: Data layer — Supabase + Clerk wired, dynamic `/portfolio/[studentId]`, admin CRUD — COMPLETE
  - [x] Create `app/portfolio/[studentId]/page.tsx` — server component with Clerk auth, school_id derivation, parent access guard
  - [x] Wire all six section components to typed `PortfolioData` props with demo fallbacks (HeroSection, IntellectualArc, ImmersionEngine, TheCanon, CreativeEvolution, RhetoricRoom, CharacterArc)
  - [x] Export typed chart data interfaces (`MapsDataPoint`, `AvantDataPoint`); charts accept data props, fall back to demo
  - [x] Fix `supabaseAdmin` to lazy-initialize via Proxy (prevents build-time crash when env vars absent)
  - [x] Admin CRUD routes — `GET/POST /api/dashboard/students`, `GET/PATCH /api/dashboard/students/[studentId]`, `POST /api/dashboard/students/[studentId]/assessments`; `lib/apiHelpers.ts` with shared `authErrorResponse()`
  - [x] Dynamic `/dashboard` — teacher/admin student list with Add Student form
  - [x] Dynamic `/admin` — admin-only school settings overview; teacher/parent redirected
- [x] Sprint 3: Expand to full 12 sections — COMPLETE
  - [x] ScopeAndSequence, HandwritingSamples, PhotoGallery, TeacherNotes, ParentUploads, BookshelfAnimation components wired with real data
  - [x] BookshelfAnimation removed from portfolio and demo renders — deleted (duplicate of The Canon)
  - [x] `supabase/migrations/0004_sprint3_tables.sql` — 5 new tables with RLS (apply to live DB)
  - [x] Seed updated with demo data for all Sprint 3 tables
  - [x] SideNav expanded to all 13 sections; Sprint 3 sections in DemoPortfolio
  - [x] `lib/types.ts` + `lib/mappers.ts` + `getStudentPortfolio.ts` updated for all Sprint 3 tables
- [ ] Sprint 4: AI layer — OCR, writing/rhetoric critique, test score extraction, edit-and-accept UI
  - [x] Install `@anthropic-ai/sdk`; add `ANTHROPIC_API_KEY` to env vars
  - [x] `POST /api/ai/draft` — generate narrative draft via Claude Haiku; store in ai_drafts; sectionTypes: academic_scores, immersion, reading_bookshelf, writing, virtue_badges
  - [x] `PATCH /api/ai/drafts/[draftId]` — accept/reject/edit a draft
  - [x] `components/shared/AiDraftEditor.tsx` — three-mode UI (view / edit / resolved)
  - [x] Wire AiNarrativePanel into 5 sections: IntellectualArc (split — see below), ImmersionEngine, TheCanon, CreativeEvolution, CharacterArc; studentFirstName in all contexts
  - [x] IntellectualArc split into Mathematics and English Language Arts sub-sections — each has independent score rows (SubjectScoreRows) and AiNarrativePanel keyed to `math_scores` / `english_scores` section types; `academic_scores` type retired from this section
  - [x] `POST /api/dashboard/students/[studentId]/uploads` — multipart upload to Supabase Storage (portfolio-assets); photos, handwriting, parent uploads
  - [x] `components/shared/UploadButton.tsx` — XHR upload with progress; wired into PhotoGallery, HandwritingSamples, ParentUploads
  - [x] Parent invite flow: `0005_parent_students.sql` (pending/active table with email+user_id indexes, RLS), `POST /api/dashboard/students/[studentId]/invite-parent` (Clerk org invite + DB row), `components/shared/InviteParentButton.tsx` (modal with email input, success/error states), `enforceParentAccess()` in portfolio page (email→userId linking on first visit) — COMPLETE
  - [x] Parent dashboard redirect: `/dashboard` detects `role=parent`, queries `parent_students` with OR(parent_clerk_user_id, invited_email) fallback, links Clerk user ID on first email-match, redirects to `/portfolio/[studentId]`; shows `ParentPendingScreen` if no row found
  - [x] Fix portfolio sections invisible on real student pages — `RevealObserver.tsx` (IntersectionObserver) was missing from dynamic route; sections now animate in correctly
  - [x] Inline data entry redesign — `TeacherDataPanel` removed from portfolio/demo renders; replaced with `InlineAssessmentForm` (in IntellectualArc) and `InlineReadingForm` (in TheCanon); both call `router.refresh()` on save for instant UI update without full reload
  - [x] Portfolio hub restructure — 11 flat tiles replaced with 3 group cards (Academics, Student Work, Gallery); tabbed sub-pages via `/portfolio/[studentId]/group/[groupSlug]`; SideNav rewritten with expandable groups + `?tab=` deep-link
  - [x] Hero refinements — school name badge (absolutely positioned top-right); InviteParentButton text-link style (opacity 0.5); StatsBar border-top + box-shadow; photo 96px; year pills merged into StatsBar (right-aligned, no standalone YearSelector on hub)
  - [x] Group page year selector — GroupDetailClient owns selectedYear state; YearSelector shown only for intellectual-arc/the-canon/creative-evolution tabs; IntellectualArc gets selectedYear prop; TheCanon/CreativeEvolution get pre-filtered arrays
  - [ ] OCR pipeline for handwriting samples
  - [ ] Writing/rhetoric critique generation
  - [ ] Test score extraction
- [ ] Sprint 5 (V2): School-wide analysis, State of the Union, multi-school theming

## Bugs Fixed (April 11, 2026)
- **Chart.js "line is not a registered controller"** — `MapPercentileChart` and `MapTrajectoryChart` were missing `LineController` in `Chart.register()`. Fixed in both. Do not remove `LineController` from registration.
- **Add Student failing silently** — Zod schema rejected empty-string `gender`/`dateOfBirth` from the form; INSERT was missing `gender`, `date_of_birth`, `enrollment_status`, `updated_at`. Fixed in `lib/validation.ts` (z.preprocess) and `app/api/dashboard/students/route.ts`.
- **IntellectualArc crash** — `SectionDetailClient` lacked an error boundary. Added `SectionErrorBoundary` class component with `componentDidUpdate` reset on tab/key change; added try-catch logging on the section page.

## Tayler's Pending Feedback Items
Items raised by Tayler after reviewing the live portfolio. Not yet scheduled to a sprint — address before the next stakeholder review.

- [x] **Book database** — `supabase/migrations/0007_book_catalog.sql`; `GET/POST /api/dashboard/schools/book-catalog`; `BookCatalogPicker` modal in ReadingForm auto-fills title+author; `BookCatalogManager` tab in TeacherDataPanel for adding/viewing catalog entries
- [x] **Dynamic MAP percentile curves from NWEA 2025 norms** — `lib/nweaNorms.ts` (K–8 fall means + SDs, winter/spring offsets, z-score bands); `MapPercentileChart.tsx` (5 stacked teal area fills, student dots in navy/gold); replaces per-subject MapsChart in IntellectualArc; grade derived from student gradeLevel + academicYear offset
- [x] **Book-opening splash animation** — `components/splash/BookSplash.tsx` + `BookSplash.css`; full-screen 3D CSS animation (navy illuminated-manuscript cover → rotateY open → parchment fill → fade); `app/LandingShell.tsx` checks `sessionStorage.splash_played` — plays once per session, skipped on repeat visits; 9 unit tests
- [x] **Bookshelf nav link** — Removed: `SideNav.tsx` contains no `#bookshelf` entry. `BookshelfAnimation.tsx` deleted.
- [ ] **Replace Lexile metric** — ⏳ BLOCKED: pending Karissa's input on preferred reading-level framework (Fountas & Pinnell, DRA, or narrative description). Lexile bar chart remains in place until decision.
- [ ] **Scope and sequence from Lobel team** — ⏳ BLOCKED: Lobel team has not yet supplied curriculum scope and sequence content. ScopeAndSequence section shows placeholder/seed data. Build import or admin UI once format is confirmed.
- [ ] **Load real Athena data** — Demo student currently uses hardcoded seed data; once DB is live, seed Athena's real assessment scores, readings, and samples so the demo portfolio reflects genuine student work

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
npm run db:new <name>   # Create next numbered migration file in supabase/migrations/
npm run db:push         # Apply pending migrations to production
npm run db:status       # List all migrations and their applied status
npm run db:reset        # Reset local DB and replay all migrations (local only)
```

- All 14 existing migrations (0001–0014) are tracked and marked as applied.
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
