# Quire (Hadar Living Portfolio) — Archive

This file contains historical session notes, superseded decisions, and completed phase recaps extracted from CLAUDE.md on April 19, 2026. It exists as a reference for "why did we do X back in <month>?" — not as active operating guidance.

Claude Code does NOT need to read this file to do current work. Reference it only when specifically asked about past decisions.

---

## Build Sprints (historical checkbox record)

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
  - [x] Create `lib/supabase.ts`, `lib/supabaseAdmin.ts`, `lib/getStudentPortfolio.ts`, `lib/mappers.ts`, `lib/auth.ts`, `lib/types.ts`, `lib/validation.ts`
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
  - [x] Wire all six section components to typed `PortfolioData` props with demo fallbacks
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
  - [x] Group page year selector — GroupDetailClient owns selectedYear state; YearSelector shown only for math/the-canon/composition tabs; IntellectualArc gets selectedYear prop; TheCanon/CreativeEvolution get pre-filtered arrays
  - [ ] OCR pipeline for handwriting samples
  - [ ] Writing/rhetoric critique generation
  - [ ] Test score extraction
- [x] Sprint 5 Session 2: Nav restructure + dashboard grid hub — COMPLETE
  - [x] Phase 1: language columns on writing_samples + student_videos, video_storage_path fix
  - [x] Phase 2: MathSection, EnglishSection, HebrewSection, CompositionView, TeacherJournal
  - [x] Phase 3A: Flatten navigation — single Portfolio group, /journal + /gallery routes
  - [x] Phase 3B: Dashboard grid hub — 6 metric cards, slim hero, remove StatsBar
  - [x] Phase 4A: Demo page updated to new components
  - [ ] Phase 4B: Knowledge moved to teacher dashboard (deferred)
- [x] Sprint 5 Session 3: Inline teacher comments
  - [x] Migration: fix ghost columns (section_category, term, highlight_quote, visible_to_parents) + add section_anchor
  - [x] InlineSectionComment component with note display + compact form
  - [x] Wired into all 6 sections + 2 video tabs with section_anchor deep-links
  - [x] TeacherJournal "View in context" links navigate to exact section via tab slug + anchor fragment
  - [x] teacherNotes threaded through GroupDetailClient and SectionDetailClient to all section components
- [ ] Sprint 5 (V2): School-wide analysis, State of the Union, multi-school theming

---

## Bugs Fixed (April 11, 2026)

- **Chart.js "line is not a registered controller"** — `MapPercentileChart` and `MapTrajectoryChart` were missing `LineController` in `Chart.register()`. Fixed in both. Do not remove `LineController` from registration.
- **Add Student failing silently** — Zod schema rejected empty-string `gender`/`dateOfBirth` from the form; INSERT was missing `gender`, `date_of_birth`, `enrollment_status`, `updated_at`. Fixed in `lib/validation.ts` (z.preprocess) and `app/api/dashboard/students/route.ts`.
- **IntellectualArc crash** — `SectionDetailClient` lacked an error boundary. Added `SectionErrorBoundary` class component with `componentDidUpdate` reset on tab/key change; added try-catch logging on the section page.

---

## Tayler's Feedback Items (completed)

- [x] **Book database** — `supabase/migrations/0007_book_catalog.sql`; `GET/POST /api/dashboard/schools/book-catalog`; `BookCatalogPicker` modal in ReadingForm auto-fills title+author; `BookCatalogManager` tab in TeacherDataPanel for adding/viewing catalog entries
- [x] **Dynamic MAP percentile curves from NWEA 2025 norms** — `lib/nweaNorms.ts` (K–8 fall means + SDs, winter/spring offsets, z-score bands); `MapPercentileChart.tsx` (5 stacked teal area fills, student dots in navy/gold); replaces per-subject MapsChart in IntellectualArc; grade derived from student gradeLevel + academicYear offset
- [x] **Book-opening splash animation** — `components/splash/BookSplash.tsx` + `BookSplash.css`; full-screen 3D CSS animation (navy illuminated-manuscript cover → rotateY open → parchment fill → fade); `app/LandingShell.tsx` checks `sessionStorage.splash_played` — plays once per session, skipped on repeat visits; 9 unit tests
- [x] **Bookshelf nav link** — Removed: `SideNav.tsx` contains no `#bookshelf` entry. `BookshelfAnimation.tsx` deleted.

---

## Migration 0012 Fix Incident (commit cdfb9ed, 2026-04-19)

Migration 0012 contained invalid SQL (COALESCE inside a UNIQUE table constraint). Production had been reconciled manually via a UNIQUE INDEX, but the file was never back-ported. Fixed in place to match production reality.

This is an exception to the "never edit historical migrations" rule — the file had literally never been valid SQL, so there was no history to preserve. Local `supabase db reset` now replays all 24 migrations cleanly.

---

## Sprint 5 Session 1 & 2 — Rename and Restructure Narrative

Session 1 renamed labels; Session 2 restructured the tree. Navigation is now a flat 5-tab list under a single `/group/portfolio` route, the hub page is a visual dashboard grid, and Math/English/Hebrew have their own dedicated section components. Composition was originally a 6th top-level tab, but was moved into English and Hebrew as a sub-tab in a follow-up pass.

Tab order: The Canon · Math · English · Hebrew · Soulcraft. Each of English and Hebrew has Spelling · Grammar · Composition · Video sub-tabs. Teacher journal and Gallery live at `/journal` and `/gallery` — not inside the tab list.

Display labels renamed in Session 1 (was: Intellectual Arc, Immersion Engine, Scope & Sequence, Creative Evolution, Character Arc). DB `section_type` / `section_category` values were NOT renamed.

---

## Session · Apr 16 2026 · Major Scope Pivot to Profile Builder

### What shipped this session

- StreamComposer Phase 1 scaffold (committed earlier in session). Five files under 300 lines each, typecheck clean:
  - components/dashboard/StreamComposer.tsx (294 lines)
  - components/dashboard/ComposerOptionsRow.tsx (226 lines)
  - components/dashboard/ComposerNoteBody.tsx (60 lines)
  - components/dashboard/ComposerScoreBody.tsx (112 lines)
  - components/dashboard/ComposerPhotoBody.tsx (98 lines)
  - lib/types.ts: new FeedEntry discriminated union added (note/score/photo variants)
- Dev-only test route at /dashboard/stream-test renders the scaffold in isolation
- Component is NOT wired into WorkbenchView — intentionally parked

Two additional commits beyond the StreamComposer scaffold:

1. **55138da — Ghost migration repair**
   - Found students table was never actually in migration 0012's ALTER list
   - Added missing deleted_at, created_by, updated_by columns + partial index
   - Preserved diagnostic scripts in scripts/ for future ghost audits

2. **56df410 — Profile Builder Phase 1 (schema + creation flow)**
   - Three new Supabase tables: profiles, profile_sections, profile_section_attachments
   - TypeScript types in lib/types/profileBuilder.ts
   - POST /api/dashboard/profiles endpoint
   - Server page at /dashboard/profiles/[studentId]/[season]
   - Client components: ProfileOverview + EmptyState + Filled + styles
   - Helper: lib/academicYears.ts::getOrCreateAcademicYearId (with sensible Aug 1 – Jun 30 defaults)
   - End-to-end verified: Athena's Spring 2025-2026 profile created, 9 sections seeded

### Major scope reframe

Mid-session pivot after Tayler shared Athena's actual Hadar Student Learning Profile PDF. Reading that document made clear that Quire's hero feature is not a portfolio dashboard or data-capture workbench. It is a Learning Profile Builder — a system that replaces the 1.5-hour manual assembly of a per-student, per-semester document (currently done in Google Slides) with a ~10-20 minute assisted assembly. Data Quire already holds (MAP, AVANT, Lexile, reading list, writing samples, photos, captured notes) flows into a structured document; AI drafts narrative prose; teachers edit and approve; Dr. Worth (Head of School) reviews and publishes; parents receive a permanent record.

### Cadence and roles (confirmed with Aaron)

- Two semesters per year: Fall and Spring
- ~8 students per grade in current Hadar setup
- Two-role workflow: **Teacher** (drafts profile, fills sections, reviews AI drafts) → **Dr. Liliana Worth, Head of School** (reviews, approves, publishes)
- Tayler Lonsdale is the customer and school founder, NOT in the per-student workflow — she's the decision-maker for what Quire becomes
- Parents receive the published document (web view + downloadable PDF). Previous semesters stay accessible and downloadable forever.

### Product architecture (5 things, clear jobs)

1. **Roster + Profile Queue** — teacher's landing page, shows class and each student's current-semester profile status
2. **Profile Builder** (hero) — main workspace for assembling a semester's profile per student. Sections: MAPS Math & English, Lexile, AVANT Hebrew, Hebrew national comparison, Canon reading list, English composition, Hebrew composition, Character Development (Middot), Rhetoric (Poetry Recitation), plus optional highlight sections (art, field trips, etc.)
3. **Captured data feed** — each student has a chronological stream of notes/photos/videos logged over the term; feeds into Profile Builder sections automatically
4. **Quick Capture** (support) — globally available slide-over panel for logging ad hoc notes, photos, videos. The StreamComposer scaffold becomes this feature; not a top-level page.
5. **Parent View** — published profile, beautiful and archivable. Web display + PDF export. All past semesters browseable.

### Section structure (required vs optional)

- ~12 required sections per profile (auto-data + character + work samples + rhetoric)
- ~2+ optional sections per profile (added when relevant: art, field trips, field-specific highlights)
- Completion is measured against REQUIRED sections only. Optional sections are additive, not part of the completion tally.
- Status vocabulary: Complete / Awaiting your narrative / In progress / Not started

### AI / Claude naming in product

Per Tayler's feedback, Claude should NOT be named in product UI copy. Use "Quire" or passive language ("A draft is ready for you to review"). Claude can be credited in marketing/footer/about contexts per Anthropic's terms, but the teacher-facing workflow should read as Quire's product, not a thin wrapper on Claude.

### Mockup artifact

Standalone HTML mockup built at `/Users/aaronandmijntjewebman/Downloads/quire-profile-builder-mockup.html` (eight states, real Quire tokens, fonts via Google Fonts). Shared with Tayler for reaction. Mockup should be considered the spec-in-progress for the next several weeks of build work.

### StreamComposer scaffold reframe

Originally built as replacement for WorkbenchView's 4-tab UI. Now understood to be Quick Capture (Tool B in the architecture). Reuse, do not discard. Future work will move from /dashboard/stream-test to a global slide-over reachable from any page via floating button + keyboard shortcut (Cmd+Shift+N).
