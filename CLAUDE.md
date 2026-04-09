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
- `app/demo/portfolio.css` — Demo portfolio styles (⚠️ CSS variables not yet unified with landing styles — Sprint 1.5 remaining task)
- `app/layout.tsx` — Root layout, ClerkProvider, font loading
- `app/globals.css` — Global styles
- `app/api/demo/auth/route.ts` — Demo password gate API route
- `components/portfolio/` — Section components (CharacterArc, CreativeEvolution, HeroSection, ImmersionEngine, IntellectualArc, PortfolioFooter, RhetoricRoom, SideNav, TheCanon)
- `components/portfolio/RevealObserver.tsx` — IntersectionObserver wrapper; fires CSS reveal animations when sections enter viewport. Required on real portfolio pages — sections were invisible without it (bug fixed)
- `components/portfolio/SubjectScoreRows.tsx` — Compact RIT/percentile score table; accepts `ScoreDisplayRow[]`; used by IntellectualArc for Math and ELA sub-sections
- `components/portfolio/InlineAssessmentForm.tsx` — Inline data-entry form inside IntellectualArc; replaces TeacherDataPanel for assessment scores; POSTs to assessments API; calls `router.refresh()` on save
- `components/portfolio/InlineReadingForm.tsx` — Inline data-entry form inside TheCanon; replaces TeacherDataPanel for reading list; "Add from catalog" opens BookCatalogPicker; calls `router.refresh()` on save
- `components/portfolio/AssessmentForm.tsx` — Legacy TeacherDataPanel sub-form (retained but no longer rendered in main portfolio flow)
- `components/portfolio/ReadingForm.tsx` — Legacy TeacherDataPanel sub-form (retained but no longer rendered in main portfolio flow)
- `components/portfolio/TeacherDataPanel.tsx` — ⚠️ REMOVED from portfolio/demo renders; replaced by inline forms. Component file kept for reference but not used
- `components/portfolio/BookCatalogPicker.tsx` — Modal overlay; fetches school book catalog, live search, auto-fills ReadingForm/InlineReadingForm title+author on selection
- `components/portfolio/BookCatalogManager.tsx` — Book Catalog tab content; add-book form (title, author, gradeLevel) + paginated catalog list; school-scoped, no props needed
- `components/splash/BookSplash.tsx` — Full-screen 3D CSS book-opening splash animation (navy cover → parchment reveal → fade); sessionStorage-gated (plays once per browser session); 9 unit tests
- `components/charts/` — MapsChart (kept for compat, not rendered), AvantChart, MapPercentileChart
- `components/charts/MapPercentileChart.tsx` — NWEA MAP percentile band chart; 5 stacked teal area fills (p5/p25/p50/p75/p95); student dots navy/gold (latest); auto-scales grade range and y-axis; subject='math'|'reading'
- `lib/nweaNorms.ts` — NWEA MAP Growth 2025 norm lookup (K–8, Math + Reading, fall/winter/spring); `getPercentileBands(subject, gradeRange)` returns p5–p95 via z-scores
- `lib/types.ts` — Shared TypeScript types (all domain models; includes `BookCatalogEntry`)
- `lib/mappers.ts` — Row mappers: Supabase snake_case → camelCase TS
- `lib/supabase.ts` — Client-side Supabase client (anon key)
- `lib/supabaseAdmin.ts` — Server-side admin client (service role key — API routes only)
- `lib/getStudentPortfolio.ts` — Single data-fetch entry point
- `lib/auth.ts` — Clerk helpers: getSchoolId(), getRole(), getAuthContext(), requireRole()
- `lib/validation.ts` — Zod schemas for all API route inputs; `gradeLevel` uses `z.enum([...GRADE_LEVELS])` — must match `lib/gradeLevel.ts`
- `lib/gradeLevel.ts` — `GRADE_LEVELS` const array, `GradeLevel` type, `formatGrade()`, `sortGrades()`, `GRADE_SELECT_OPTIONS`; single source of truth for grade enum
- `lib/constants.ts` — Re-exports `GRADE_SELECT_OPTIONS` from `lib/gradeLevel`; defines `TERM_OPTIONS` ('Fall 2024'–'Spring 2026') and `TermOption` type; **all forms import from here — never hardcode term strings**
- `proxy.ts` — Clerk middleware (Next.js 16); protects /dashboard, /admin, /portfolio; userId-only check (org not required) so OrgPickerScreen handles no-org case
- `supabase/migrations/` — 0001 initial schema, 0002 multi-tenancy, 0003 RLS policies, 0004 Sprint 3 tables, 0005 parent_students, 0006 student archived_at, 0007 book_catalog, 0010 grade_level_enum, 0011 student_profile_fields (gender, date_of_birth, enrollment_status), 0012 data_foundation (audit columns, soft delete, academic_years, enrollment_records, class_assignments)
- `design-reference/` — Target aesthetic HTML files (landing.html, hadar-portfolio.html)
- `app/dashboard/page.tsx` — Teacher/admin student list; parent redirect (OR filter on parent_clerk_user_id + invited_email); server component
- `app/dashboard/DashboardUI.tsx` — Presentational sub-components: OrgPickerScreen, ParentPendingScreen, PageHeader, StudentCard, EmptyState
- `app/dashboard/AddStudentForm.tsx` — Client component modal form; POSTs to /api/dashboard/students; gradeLevel is a `<select>` using `GRADE_SELECT_OPTIONS`
- `app/dashboard/DashboardClient.tsx` — `'use client'` wrapper; owns `activeView: DashboardView` state; renders sidebar + conditional view components
- `app/dashboard/DashboardSidebar.tsx` — Sidebar nav (Student Rosters, By Grade, Year in Review, Settings); Settings admin-only
- `app/dashboard/StudentGrid.tsx` — Grade filter pills + search; groups/sorts via `formatGrade`/`sortGrades`
- `components/dashboard/ByGradeView.tsx` — Collapsible per-grade sections; sorted with `sortGrades()`
- `components/dashboard/YearInReviewView.tsx` — Placeholder
- `components/dashboard/SettingsView.tsx` — Admin-only placeholder
- `app/not-found.tsx` — Styled 404 page using design system tokens
- `app/admin/page.tsx` — Admin-only school settings overview; Sprint 3 placeholders for Teachers + Theme
- `app/portfolio/[studentId]/page.tsx` — Dynamic portfolio; passes school.name + student name to SideNav
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk SignIn centered on cream background
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk SignUp centered on cream background
- `app/api/ai/draft/route.ts` — POST: generate AI narrative draft via Claude Haiku; studentFirstName injected into system prompt; stores in ai_drafts; returns { draftId, text, sectionType }
- `app/api/ai/drafts/[draftId]/route.ts` — PATCH: accept/reject/edit an AI draft; sets content_final, status, reviewed_by, reviewed_at
- `app/api/dashboard/students/[studentId]/uploads/route.ts` — POST: multipart upload to portfolio-assets Supabase Storage; inserts into photos, handwriting_samples, or parent_uploads; role-gated (parent ownership check)
- `components/shared/AiDraftEditor.tsx` — Client component: view/edit/resolve AI draft; Accept, Edit & Accept, Reject buttons
- `components/portfolio/AiNarrativePanel.tsx` — Generate button + inline AiDraftEditor; teacher/admin sees generate flow or resolved draft; parent sees accepted text only; wired into IntellectualArc ×2 (math_scores, english_scores), ImmersionEngine, TheCanon, CreativeEvolution, CharacterArc
- `components/shared/UploadButton.tsx` — Client component: hidden file input, XHR upload with progress bar, onSuccess/onError callbacks; wired into PhotoGallery, HandwritingSamples, ParentUploads
- `components/shared/InviteParentButton.tsx` — Client component: modal with email input, POSTs to invite-parent route; shown below HeroSection for admin/teacher only
- `app/api/dashboard/students/[studentId]/invite-parent/route.ts` — POST: inserts pending parent_students row, calls Clerk createOrganizationInvitation with role 'org:parent'
- `supabase/migrations/0005_parent_students.sql` — parent_students table: invited_email, nullable parent_clerk_user_id, status (pending/active), RLS; apply before testing invite flow
- `supabase/migrations/0012_data_foundation.sql` — audit columns (created_by, updated_by, updated_at) + soft delete (deleted_at) on 6 content tables; academic_years table (canonical year registry per school); enrollment_records table (enrollment history per student); class_assignments table (student ↔ teacher per year)

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
  - [ ] Set up GitHub Actions CI (lint + typecheck + test + build)
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
  - [x] BookshelfAnimation removed from portfolio and demo renders — duplicate of The Canon; component file kept but not rendered
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
  - [ ] OCR pipeline for handwriting samples
  - [ ] Writing/rhetoric critique generation
  - [ ] Test score extraction
- [ ] Sprint 5 (V2): School-wide analysis, State of the Union, multi-school theming

## Tayler's Pending Feedback Items
Items raised by Tayler after reviewing the live portfolio. Not yet scheduled to a sprint — address before the next stakeholder review.

- [x] **Book database** — `supabase/migrations/0007_book_catalog.sql`; `GET/POST /api/dashboard/schools/book-catalog`; `BookCatalogPicker` modal in ReadingForm auto-fills title+author; `BookCatalogManager` tab in TeacherDataPanel for adding/viewing catalog entries
- [x] **Dynamic MAP percentile curves from NWEA 2025 norms** — `lib/nweaNorms.ts` (K–8 fall means + SDs, winter/spring offsets, z-score bands); `MapPercentileChart.tsx` (5 stacked teal area fills, student dots in navy/gold); replaces per-subject MapsChart in IntellectualArc; grade derived from student gradeLevel + academicYear offset
- [x] **Book-opening splash animation** — `components/splash/BookSplash.tsx` + `BookSplash.css`; full-screen 3D CSS animation (navy illuminated-manuscript cover → rotateY open → parchment fill → fade); `app/LandingShell.tsx` checks `sessionStorage.splash_played` — plays once per session, skipped on repeat visits; 9 unit tests
- [x] **Bookshelf nav link** — Confirmed removed: `SideNav.tsx` `navItems` array contains no `#bookshelf` entry. `BookshelfAnimation.tsx` component file retained for reference but not rendered anywhere.
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
