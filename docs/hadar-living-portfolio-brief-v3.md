# Hadar Living Portfolio — Master Project Brief (v3)
**Hadar Jewish Classical Academy · Austin, Texas**
*Founded by Tayler Lonsdale · 2022*
*Last updated: March 27, 2026*

---

## What This Is

A student portfolio platform linked from the main Hadar school website. Each student has a living, longitudinal digital portfolio — updated each semester — that parents can view and teachers can manage. The goal is to give families an elegant, permanent record of their child's intellectual, linguistic, and moral development from their earliest years through graduation.

**Aesthetic:** Illuminated manuscript — navy lapis, gold, and parchment — inspired by the Mishneh Torah, Voynich manuscript, and Jewish medieval art.

**Licensing intent:** This platform is being built for Hadar first, but the architecture must support licensing to other classical schools. Every architectural decision — database schema, auth, theming, branding, content structure — must be school-agnostic from the foundation up. Hadar is the first tenant, not a hardcoded assumption.

---

## Architecture: Multi-Tenancy Foundation

Since this product may be licensed to other classical schools, the following principles apply to every piece of code written:

### Database

- Every table gets a `school_id` column (UUID, foreign key to a `schools` table)
- All queries filter by `school_id` — no data from one school is ever visible to another
- RLS policies enforce `school_id` isolation at the database level
- Seed data, demo data, and migrations are school-aware

### Auth (Clerk Organizations)

- Each school is a Clerk Organization
- Roles (admin, teacher, parent) are scoped to the organization, not global
- A user could theoretically be a parent at one school and a teacher at another
- The `/portfolio/[studentId]` route validates that the requesting user belongs to the same org as the student

### Theming

- Design tokens (colors, fonts, logo, school name) are stored per-school — not hardcoded
- Hadar's illuminated manuscript aesthetic is the default theme and the design reference
- Other schools can override colors, fonts, and logo via a school settings table
- The core layout, section structure, and UX patterns remain consistent across schools

### Content & Sections

- All 12 portfolio sections are available to every school
- Schools can enable/disable sections via a config (e.g., a school without Hebrew doesn't need AVANT scores)
- Section labels can be customized per school (e.g., "Immersion Engine" → "Language Proficiency")
- The AI layer is school-agnostic — same edit-and-accept contract everywhere

### Code Rules for Multi-Tenancy

- **No school name, logo, or color hardcoded in any component** — always pulled from school config or theme context
- **No Hadar-specific content in reusable components** — Hadar content lives in seed data or school config, not in JSX
- **Every API route receives `school_id`** from the authenticated user's org — never from the client
- **Test with at least two mock schools** before considering any feature complete (add to CI once test suite exists)

---

## Current State

**Live URL:** hadar-living-portfolio.vercel.app
**GitHub:** github.com/atwebman-ctrl/hadar-living-portfolio
**Stack:** Next.js 16 · TypeScript (strict) · Tailwind CSS 4 · Supabase · Clerk · Chart.js / react-chartjs-2

### What's Built (Sprint 1 ✅)

- **Landing page (`/`)** — Split layout. Left panel: navy linen book cover with HADAR in Cinzel Decorative, baroque gold frame illustration of a Jewish boy in cowboy boots, corner ornaments, linen texture background. Right panel: parchment login form with "Your child's learning story" headline. Hebrew tagline: *שֶׂכֶל אֵינוֹ חָכְמָה* ("intelligence is not wisdom").
- **Demo portfolio (`/demo`)** — Full six-section interactive portfolio using Athena Lonsdale's data. Sections: MAPS scores chart, Lexile reading level, AVANT Hebrew proficiency, bookshelf, writing flip-book, virtue badges, video slots.
- **Asset gallery** at `/hadar-gallery-v2.html`
- **Mobile layout** — Login form on top, book cover below on scroll.
- **Supabase schema** — 6 tables with RLS enabled (policies not yet written). 2 storage buckets defined.
- **Linked from main website** — This is a companion site to the main Hadar school site, not a standalone product. Navigation should make the relationship clear (back-link to main site, consistent branding).

### What's NOT Built Yet

- No `lib/` directory (no Supabase clients, no data-fetching layer)
- No Clerk installed or wired
- No `middleware.ts` (no route protection)
- No `/demo` password gate (demo is publicly accessible)
- No `schools` table or `school_id` columns (multi-tenancy not yet in schema)
- No test suite or CI pipeline
- No rate limiting or input validation (Zod)
- No error tracking (Sentry)

---

## Design Philosophy

**C.S. Lewis meets classical literature.** This is a book you'd pass down. The aesthetic is an illuminated manuscript — the Mishneh Torah, the Voynich manuscript, gilt-edged pages, Narnia endpapers. The feeling of opening something old that matters. Every screen should feel like a page from a beautifully bound volume: linen-textured navy covers, gold-leafed borders, parchment warmth, serif typography that breathes.

The canonical reference is the landing page screenshot (see `design-reference/`): a navy linen left panel with baroque gold frame illustration, and a parchment right panel with classical typography. Every subsequent screen — the portfolio, the admin dashboard, the teacher tools — must feel like a continuation of this same book, not a separate application.

### What This Means in Practice

- **Warmth over sterility.** Cream and parchment, never white. Linen textures, never flat backgrounds. The screen should feel like paper.
- **Gold as the accent, never the background.** Gold is for borders, ornaments, active states, and moments of emphasis — the gilding on the edge of a page, not the page itself.
- **Typography does the heavy lifting.** Serif fonts at generous sizes with real tracking. The text itself should feel elegant before any decoration is added.
- **Ornament is structural, not decorative.** Corner ornaments, ruled borders, and decorative dividers serve as wayfinding — they tell you where you are in the book. They are not clipart.
- **No modern SaaS patterns.** No rounded pill buttons, no purple gradients, no card shadows, no dark mode. This is not a dashboard — it's a portfolio. The visual language of Notion, Linear, and Stripe does not belong here.
- **Quiet animation.** Fade-ins, gentle reveals, page-turn transitions. Nothing bounces, slides aggressively, or calls attention to itself. The content is the event.

### Design Tokens — Hadar Default Theme

> **⚠️ Known issue:** The landing page (`page.css`) and demo portfolio (`portfolio.css`) currently use different color variables. These must be unified in Sprint 1.5. The values below are the canonical targets.

> **Multi-tenancy note:** These tokens will eventually be loaded from a school settings table. For now they are CSS variables in a single source file. When we add the school config layer, these become the Hadar default. Other schools override via `theme_json` in the `schools` table.

**Colors**

| Token | Variable | Hex | Usage |
|-------|----------|-----|-------|
| Navy | `--navy` | `#1B3A6B` | Primary brand, sidenav, headers |
| Navy deep | `--navy-deep` | `#152A47` | Deep accents, left panel base |
| Gold | `--gold` | `#C49A2A` | Accent, borders, ornaments, active states |
| Gold light | `--gold-light` | `#D4AF6A` | Hover states, subtle accents |
| Cream | `--cream` | `#F7F4EE` | Page background — never white |
| Parchment | `--parchment` | `#F2E8CC` | Landing page right panel, card backgrounds |
| Ink | `--ink` | `#1C1917` | Body text |
| Ink mid | `--ink-mid` | `#44403C` | Secondary text |
| Ink light | `--ink-light` | `#78716C` | Tertiary text, captions |
| Rule | `--rule` | `#D6D0C4` | Borders — never Tailwind default gray |

**Typography**

| Role | Font | Weight | Character |
|------|------|--------|-----------|
| Display / title | Cinzel Decorative | 400, 700 | The spine of the book — monumental, rare |
| Headings | Playfair Display | 400 | Chapter titles — elegant, readable |
| Body / prose | Lora (portfolio), Cormorant Garamond (landing) | 400, 300–500 | The page — warm, bookish, generous |
| Labels / data / nav | DM Mono | 300, 400, 500 | Marginalia — precise, small, functional |

**Key Rules**

- Background is `--cream` (`#F7F4EE`) — Tailwind `bg-white` anywhere is a bug
- Borders are `1px solid var(--rule)` — never Tailwind default gray
- Corner ornaments use `public/images/corner-ornament.png` rotated per corner
- Linen texture (`public/images/navy-cloth.png`) on all navy surfaces
- All fonts loaded via Google Fonts in `layout.tsx` — never local
- No purple gradients. No dark mode. No rounded pill buttons. No card shadows.

**Key Images**

- `public/images/kid.png` — Boy in baroque gold frame (landing page hero)
- `public/images/navy-cloth.png` — Linen texture for navy surfaces
- `public/images/corner-ornament.png` — Decorative corner elements (rotate per position)

---

## Three User Roles

| Role | Access |
|------|--------|
| **Admin** | All student data within their school. Publishes school-wide State of the Union for the board. |
| **Teacher** | Upload, post, comment, edit content for assigned students. Reviews and approves all AI-generated content before it's parent-visible. |
| **Parent** | View-only on teacher content. Upload-only on their own parent section (art, stories, poems from home). |

---

## Full Section Map (12 Sections)

Every item in the portfolio is tagged with **date, age, and grade** at the database level — a shared metadata schema, not per-section. Schools can enable/disable and relabel sections via config.

### 1. Student Header
Profile photo at the top, a student summary paragraph, and a "My teachers are X, Y, Z" section with linked teacher cards. *(Per Tayler: this is the first thing parents see — photo, summary, and teacher attribution.)*

### 2. Academic Scores *(AI-assisted)*
Houses MAPS, Lexile, and AVANT Hebrew scores (already in demo). Standardized test sub-section: teacher uploads the PDF → AI extracts results, summarizes in plain language, and runs built-in validation checks on its own extraction → teacher reviews, edits, accepts. *(Per Tayler: "AI double checks through built-in tests." The AI must validate its own extraction before surfacing it to the teacher.)* V2 adds school-wide cohort analysis.

### 3. Reading / Bookshelf
The bookshelf is the hero visual — books animate in (roll or fan open) as the student's year unfolds. Each book has its own card explaining: **why it was chosen, what values and skills it builds, page count, full book text if available.** *(Per Tayler: the explanation of "why" is critical — this is a curated intellectual biography, not a reading log. "Maybe a bookshelf design where books roll in.")*

### 4. Writing *(AI-assisted)*
Writing samples in a flip-book UI. Each sample has: the original image, AI-transcribed text (OCR), and a mechanics summary flagging punctuation, spelling, and handwriting issues ("missed period on line 3"). *(Per Tayler: "Make sure to have the image + transcribed, pointers, low hanging fruit of critiques like 'you missed a period' so that the teacher can focus on higher level stuff. But the AI can provide a summary of the mechanics and what should be improved.")* Teacher edits the AI summary into their own voice and accepts before it's parent-visible.

### 5. Handwriting *(AI-assisted)*
Progression over time is the core — September vs. May is powerful. *(Per Tayler: "Handwriting section that demonstrates how their handwriting improves over time. Teachers can add notes like 'has to work on not writing letters backwards.'")* OCR flags mechanics automatically. A timeline slider lets parents drag through the year and watch the hand develop.

### 6. Rhetoric *(AI-assisted)*
AI generates a critique summary of the student's spoken or written argumentation. *(Per Tayler: "AI critique summary of the performance.")* Teacher must review, edit into their voice, and approve before parents see it.

### 7. Virtue Badges
Character milestones, teacher-awarded. Teachers can add a brief note when awarding ("Showed remarkable courage during the class debate"). Parents view.

### 8. Photos
School photos and classroom moments. Date/age/grade tagged. Teacher uploads; parents view. Illuminated manuscript aesthetic for frames. *(Per Tayler: "There should also be a photo section.")*

### 9. Parent Uploads *(parent-managed)*
Completely separate from teacher sections. Parents upload art, stories, poems, recordings from home. Each item date/age/grade tagged. Teachers can view but not edit. *(Per Tayler: "Parents can upload child art, stories, poems, etc. from home. Everything will be marked by date, age, and grade.")* This is the family memory section within the academic portfolio.

### 10. Teacher Profiles
Photo, bio, subjects taught, years at school. Each teacher name in the student header links to their profile. *(Per Tayler: "There should be access to photos/bio of the teachers so kids can remember who their teachers are into adulthood.")* Lives at `/teachers` — a school-wide page linkable from the main school site.

### 11. Scope & Sequence
Static content published by Tikvah (for Hadar; other schools would publish their own). Admin uploads the document; it renders as a clean readable page per grade level. No AI — pure content display. *(Per Tayler: "Static information about what each of the kids are doing in each grade and at each level. It'll be published by Tikvah and we'll put this on the site as a section.")*

### 12. State of the Union *(V2 · Admin only · AI-assisted)*
After the per-student data layer matures, the admin compiles a school-wide narrative for the board — MAPS trends, reading volume, Hebrew proficiency growth across cohorts. AI drafts from aggregate data; admin edits and publishes. *(Per Tayler: "Can the chief administrator create a state of the union for the school board as a final product once the rest of the site is built?")* Built last.

---

## The AI Layer — Universal Pattern

Every AI-generated field follows the same contract across all sections:

1. AI produces a draft (critique, extraction, summary)
2. It appears in an **editable field** marked "AI draft — pending teacher review"
3. Teacher edits into their own voice
4. Teacher hits **Accept** → published under their name
5. **Nothing AI-generated is ever parent-visible without teacher acceptance**

*(Per Tayler: "ALL AI must be able to be edited by the teacher so the teacher can make sure it's their voice and they approve the message. There should be edit field and a button to accept.")*

This protects the school's voice. Every word a parent reads has been approved by a human educator. This pattern is school-agnostic and applies identically across all tenants.

---

## Supabase Schema

### Current Tables (6 — Sprint 1)

| Table | Purpose |
|-------|---------|
| `students` | Core record. `parent_user_ids[]` (Clerk IDs), `is_demo` flag |
| `assessments` | MAPS math/english, AVANT speaking/reading/listening/writing, Lexile |
| `character_awards` | Virtue badges with Hebrew, transliteration, English, award date |
| `readings` | Book list per student per year, `completed` boolean, `sort_order` |
| `videos` | Video milestones. `storage_path` OR `external_url` (constraint enforced) |
| `writing_samples` | English and Hebrew compositions keyed by grade level |

### Tables to Add (Sprint 1.5 / Sprint 2)

| Table | Purpose |
|-------|---------|
| `schools` | School name, slug, logo, theme config, enabled sections, Clerk org ID |
| `school_members` | Maps Clerk user IDs to schools with roles (admin/teacher/parent) |
| `teachers` | Teacher profiles: photo, bio, subjects, years at school. Linked from student headers. |
| `photos` | School photos, classroom moments. Date/age/grade tagged. |
| `parent_uploads` | Art, stories, poems from home. Parent-managed. |
| `handwriting_samples` | Handwriting progression with teacher notes and OCR data. |
| `ai_drafts` | Stores AI-generated content with status (draft/accepted/rejected), editor ID, edit history. Shared across all AI-assisted sections. |

> **Multi-tenancy:** Every table above (including the existing 6) needs a `school_id` column. Add it in the Sprint 1.5 migration before any real data enters the system.

**Storage buckets:** `videos` (mp4/mov), `portfolio-assets` (thumbnails, images, PDFs). Both private.

**RLS:** Enabled on all existing tables. Policies not yet written — Sprint 1.5 task. All policies must filter by `school_id`.

---

## Auth (Clerk Organizations) — Not Yet Wired

| Route | Protection |
|-------|-----------|
| `/` | Public (or school-specific landing via subdomain/slug) |
| `/demo` | Password gate (`DEMO_PASSWORD` env var) — **not yet implemented** |
| `/portfolio/[studentId]` | Clerk — parent sees own child only via `parent_user_ids`, within same org |
| `/teachers` | Public within the school context |
| `/dashboard`, `/admin` | Clerk — teacher/admin roles within the org |
| `/api/public/*` | Open |
| `/api/dashboard/*` | Clerk auth required, `school_id` derived from org |

---

## Build Sequence

| Sprint | Focus | Status |
|--------|-------|--------|
| **1** | Landing page, demo portfolio, design system, six-section UI | ✅ Complete |
| **1.5** | Security, multi-tenancy foundation, and code hygiene (see task list below) | 🔲 Next |
| **2** | Data layer — `getStudentPortfolio()`, dynamic `/portfolio/[studentId]`, admin CRUD, Clerk wired | 🔲 |
| **3** | Expand to full 12 sections — Parent Uploads, Teacher Profiles, Handwriting, Photos, Scope & Sequence, Bookshelf animation | 🔲 |
| **4** | AI layer — OCR pipeline, writing/rhetoric critique, test score extraction, edit-and-accept UI, `ai_drafts` table | 🔲 |
| **5 (V2)** | School-wide analysis, State of the Union admin tool, multi-school theming | 🔲 |

---

## Sprint 1.5 — Security, Multi-Tenancy & Hygiene Task List

### Multi-Tenancy Foundation (do first — everything else depends on this)

- [ ] **Create `schools` table** — `id`, `name`, `slug`, `logo_url`, `theme_json`, `enabled_sections[]`, `clerk_org_id`, `created_at`
- [ ] **Add `school_id` to all existing tables** — `students`, `assessments`, `character_awards`, `readings`, `videos`, `writing_samples`. Non-nullable UUID with foreign key to `schools`.
- [ ] **Create Hadar seed record** — Insert Hadar as the first school with its theme tokens, so existing demo data has a valid `school_id`.
- [ ] **Create `ai_drafts` table** — Shared table for all AI-generated content: `id`, `school_id`, `student_id`, `section_type`, `content_draft`, `content_final`, `status` (draft/accepted/rejected), `reviewed_by`, `reviewed_at`, `created_at`.
- [ ] **Plan additional tables** — `teachers`, `photos`, `parent_uploads`, `handwriting_samples`, `school_members`. Schema these out; create in Sprint 2 or 3 as needed.

### Security (do immediately after multi-tenancy schema)

- [ ] **Install Clerk** — `npm install @clerk/nextjs`, wrap `ClerkProvider` in `layout.tsx`. Use Clerk Organizations (not flat roles).
- [ ] **Create `middleware.ts`** — Protect `/portfolio`, `/dashboard`, `/admin` routes. Leave `/`, `/demo`, `/api/public/*` open. Derive `school_id` from the user's Clerk org. Match the Webman Law pattern.
- [ ] **Write Supabase RLS policies** — All policies filter by `school_id`. Parents read only their child's rows (via `parent_user_ids` + `school_id`). Teachers read/write students within their school. Admins read/write all within their school. Service role bypasses RLS for API routes.
- [ ] **Add `/demo` password gate** — Middleware or server component checks `DEMO_PASSWORD` env var before rendering. Athena's data should not be publicly accessible.
- [ ] **Remove hardcoded password from `CLAUDE.md`** — Line 88 currently shows the actual password value. Delete the value; leave the variable name only.
- [ ] **Create `lib/supabase.ts`** — Client-side Supabase client using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Create `lib/supabaseAdmin.ts`** — Server-side admin client using `SUPABASE_SERVICE_ROLE_KEY`. Only imported in `app/api/` routes.
- [ ] **Create `lib/getStudentPortfolio.ts`** — Single source of truth for all student data fetching. Accepts `studentId` and `schoolId`. All portfolio components receive data via props from this function.

### Code Quality

- [ ] **Install Zod** — Validate all API route inputs. No unvalidated user data hits Supabase.
- [ ] **Set up Jest + basic tests** — At minimum: one test per API route, type-check passes, build passes. Include a two-school test fixture to verify tenant isolation.
- [ ] **Set up GitHub Actions CI** — Run lint + type-check + test on every push/PR.
- [ ] **Split `page.css` (639 lines)** — Break into partials: `landing-layout.css`, `landing-left-panel.css`, `landing-right-panel.css`, `landing-mobile.css`. Each under 300 lines.
- [ ] **Unify CSS color variables** — `page.css` and `portfolio.css` currently define different navys, golds, and creams. Create a single `globals.css` variable set that both pages import. These become the Hadar default theme; other schools override via `theme_json`.
- [ ] **Add Sentry** — Error tracking before real users touch this. Can be last in the sprint.

### Cleanup

- [ ] **Update `CLAUDE.md`** — Sync sprint sequence, correct Next.js version (16 not 15), reconcile color/font tokens, add multi-tenancy rules, reference this brief as the canonical spec.
- [ ] **Audit `package.json`** — Brief originally listed Recharts but project uses Chart.js/react-chartjs-2. Confirm no phantom dependencies.
- [ ] **Remove all Hadar-specific strings from components** — Any school name, tagline, or branding in JSX should be replaced with props or context that pull from the school config. (Can be done incrementally as components are touched.)

---

## Code Rules (Non-negotiable)

1. No file over 300 lines — split into sub-components immediately
2. `SUPABASE_SERVICE_ROLE_KEY` only in `app/api/` files — never in client components
3. No hardcoded student data in reusable components — all data via props from `getStudentPortfolio()`
4. **No hardcoded school name, branding, or theme in components** — always from school config or theme context
5. All chart components accept typed `data` prop — no inline data
6. **Every query filters by `school_id`** — no exceptions
7. Always use terminal for git commits (Cursor commit button is bugged)
8. After every feature: check file tree + line counts before committing
9. Refactor checkpoint after every 3–4 features
10. Read `CLAUDE.md` in project root before touching any code

---

## Key Design Decisions (Locked)

- **Multi-tenancy from day one** — `school_id` on every table, Clerk Organizations for auth, theme config per school
- **Date/age/grade metadata** is a shared system-level field across all sections, not per-section
- **Bookshelf animation** and **handwriting timeline slider** are the two highest-impact parent moments — prioritize design on these
- **Teacher Profiles** live at `/teachers`, not embedded per-portfolio, so they can be linked from the main school website
- **All AI content** requires explicit teacher approval — no exceptions
- **Color unification** must happen before Sprint 2 — one canonical set of CSS variables, overridable per school
- **Linked from main site** — This is not a standalone product. Navigation must make the relationship to the school's main site clear.
- **Sections are configurable** — Schools can enable/disable and relabel sections. Not every school teaches Hebrew.

---

## Tayler's Notes (March 27, 2026) — Integration Checklist

These are Tayler Lonsdale's direct requirements from today's conversation, with the section where each is addressed:

| Tayler's Requirement | Section | Status |
|---------------------|---------|--------|
| Profile picture + student summary + "my teachers are X, Y, Z" | §1 Student Header | ✅ Spec'd |
| Admin can access all student data | Roles table | ✅ Spec'd |
| Teachers upload, post, comment, edit | Roles table | ✅ Spec'd |
| Parents view-only + upload from home | Roles table + §9 Parent Uploads | ✅ Spec'd |
| Everything marked by date, age, and grade | Shared metadata schema | ✅ Spec'd |
| Book section: why included, values, skills, page count, full books, bookshelf animation | §3 Reading / Bookshelf | ✅ Spec'd |
| Handwriting progression over time, teacher notes | §5 Handwriting | ✅ Spec'd |
| OCR: image + transcription + mechanics critique | §4 Writing + §5 Handwriting | ✅ Spec'd |
| Linked site from main website | Architecture note + Key Decisions | ✅ Spec'd |
| Teacher photos/bios so kids remember them | §10 Teacher Profiles | ✅ Spec'd |
| Scope & sequence from Tikvah | §11 Scope & Sequence | ✅ Spec'd |
| Rhetoric: AI critique summary | §6 Rhetoric | ✅ Spec'd |
| ALL AI editable by teacher + accept button | AI Layer universal pattern | ✅ Spec'd |
| Photo section | §8 Photos | ✅ Spec'd |
| Standardized test scores: AI extracts + validates | §2 Academic Scores | ✅ Spec'd |
| V2 school-wide analysis | §2 (V2) + §12 State of the Union | ✅ Spec'd |
| State of the Union for school board | §12 State of the Union | ✅ Spec'd |

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Agent instructions — read before any code change |
| `app/page.tsx` + `app/page.css` | Landing page |
| `app/demo/page.tsx` + `app/demo/portfolio.css` | Demo portfolio |
| `components/portfolio/` | Six section components (one file per section) |
| `components/charts/` | MapsChart, AvantChart |
| `design-reference/` | Target aesthetic HTML files |
| `supabase/migrations/` | Database schema |
| `lib/supabase.ts` | Client-side Supabase client *(not yet created)* |
| `lib/supabaseAdmin.ts` | Server-side admin client *(not yet created)* |
| `lib/getStudentPortfolio.ts` | Data fetching layer *(not yet created)* |
| `middleware.ts` | Route protection *(not yet created)* |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server routes only — never client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DEMO_PASSWORD=                      # do NOT commit the actual value
```

---

*Hadar Living Portfolio — Master Brief v3 · March 27, 2026*
*Hadar is the first tenant. The architecture serves every school.*
