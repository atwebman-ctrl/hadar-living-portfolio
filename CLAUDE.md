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

### Tooling
- Cursor commit button is bugged — always use terminal for git
- If using Cursor, run in Claude-only mode (not Auto)

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
11. Once Jest exists, run tests before every push — CI will catch it anyway but catch it locally first

## Key Files

### Exists now
- `app/page.tsx` — Landing page
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
- `components/charts/` — MapsChart, AvantChart
- `lib/types.ts` — Shared TypeScript types (all domain models)
- `lib/mappers.ts` — Row mappers: Supabase snake_case → camelCase TS
- `lib/supabase.ts` — Client-side Supabase client (anon key)
- `lib/supabaseAdmin.ts` — Server-side admin client (service role key — API routes only)
- `lib/getStudentPortfolio.ts` — Single data-fetch entry point
- `lib/auth.ts` — Clerk helpers: getSchoolId(), getRole(), getAuthContext(), requireRole()
- `lib/validation.ts` — Zod schemas for all API route inputs
- `middleware.ts` — Clerk auth + route protection
- `supabase/migrations/` — 0001 initial schema, 0002 multi-tenancy, 0003 RLS policies
- `design-reference/` — Target aesthetic HTML files (landing.html, hadar-portfolio.html)

### Does NOT exist yet (do not reference as if it does)
- `components/shared/AiDraftEditor.tsx` — Universal AI edit-and-accept component
- `components/theme/ThemeProvider.tsx` — School theme context
- `lib/getSchoolConfig.ts` — Fetch school settings + theme

## Auth (Clerk Organizations)
- Each school = one Clerk Organization
- Roles: `admin`, `teacher`, `parent` — scoped to the org, not global
- `admin` — all student data within their school, school settings, teacher management
- `teacher` — upload, edit, comment, review/accept AI drafts for assigned students
- `parent` — view-only on teacher content, upload-only in Parent Uploads section, sees only own children via `parent_user_ids`
- `/demo` — cookie-based password gate (`demo_session` cookie), no Clerk required
- `/dashboard` and `/admin` — Clerk protected via middleware.ts

## Architectural Decisions (locked — do not reverse without discussion)
- **`on delete restrict` for all `school_id` FKs** — A school record cannot be deleted while student/content rows exist under it. Deletion must be a deliberate multi-step operation. (`school_members` uses cascade — member records are disposable.)
- **`school_members` allows multiple roles per user** — Unique constraint is `(school_id, clerk_user_id, role)`, not `(school_id, clerk_user_id)`. A user can be both teacher and parent at the same school; they get two rows.
- **Teachers have broad read access within their school** — RLS policies give teachers SELECT on all students in their school. Narrowing to assigned students is deferred to Sprint 3 when a `student_teachers` join table is added.
- **`ai_drafts` INSERT is service-role only** — No authenticated INSERT policy exists. Only the AI pipeline (via `supabaseAdmin`) creates draft rows. Teachers update (accept/edit/reject); they never insert.
- **Signin form styles in `landing-mobile.css`** — The form's mobile overrides are tightly coupled to its base styles; co-locating them in the same file keeps the cascade readable. This is intentional, not a mistake.

## Build Sprints (update checkboxes each session)
- [x] Sprint 1: Landing page, demo portfolio, design system, six-section UI — COMPLETE
- [ ] Sprint 1.5: Security, multi-tenancy foundation, code hygiene — IN PROGRESS
  - [x] Create `schools` table with theme_json, enabled_sections, clerk_org_id
  - [x] Add `school_id` to all existing tables (0002 migration)
  - [x] Create Hadar seed record (fixed UUID `a1000000-0000-0000-0000-000000000001`)
  - [x] Create `ai_drafts` table
  - [x] Create `school_members` table
  - [x] Install Clerk, wrap ClerkProvider in layout.tsx
  - [x] Create middleware.ts with route protection
  - [x] Write Supabase RLS policies (0003 migration — pending Clerk JWT setup in Supabase dashboard)
  - [x] Add `/demo` password gate (server component + API route)
  - [x] Create `lib/supabase.ts`
  - [x] Create `lib/supabaseAdmin.ts`
  - [x] Create `lib/getStudentPortfolio.ts` + `lib/mappers.ts`
  - [x] Create `lib/auth.ts`, `lib/types.ts`, `lib/validation.ts`
  - [x] Install Zod
  - [x] Split `page.css` (639 lines) into 4 partials under app/styles/
  - [x] Unify CSS color variables — single canonical :root in globals.css; landing and portfolio :root blocks removed; --lapis* aliases kept for landing CSS compatibility
  - [ ] Set up Jest + basic tests (two-school fixture required)
  - [ ] Set up GitHub Actions CI (lint + typecheck + test + build)
  - [ ] Add Sentry error tracking
  - [ ] Audit package.json for phantom dependencies
  - [ ] Remove Hadar-specific strings from reusable components
- [ ] Sprint 2: Data layer — Supabase + Clerk wired, dynamic `/portfolio/[studentId]`, admin CRUD
- [ ] Sprint 3: Expand to full 12 sections — Parent Uploads, Teacher Profiles, Handwriting, Photos, Scope & Sequence, Bookshelf animation
- [ ] Sprint 4: AI layer — OCR, writing/rhetoric critique, test score extraction, edit-and-accept UI
- [ ] Sprint 5 (V2): School-wide analysis, State of the Union, multi-school theming

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server routes only — never client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DEMO_PASSWORD=                      # do NOT commit the actual value
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
