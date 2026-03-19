# CLAUDE.md — Hadar Living Portfolio

## Agent Behavior
Say "🫡" in your first message to acknowledge you've read this document.
Always recommend the optimal, future-proofed solution — never the shortcut.
At end of every session, ask "anything to clean up?" and remind Aaron to update this CLAUDE.md.

## GOTCHAS — Read before any code change
- `SUPABASE_SERVICE_ROLE_KEY` only in `app/api/` server routes — never in client components
- No hardcoded student data in reusable components — all data via props from `getStudentPortfolio()`
- Fonts (Playfair Display, DM Mono, Lora) must be loaded via Google Fonts in layout.tsx — not local
- Background is cream `#F7F4EE`, not white — Tailwind `bg-white` anywhere in layout is a bug
- Video slots accept either `storage_path` (Supabase) OR `external_url` (YouTube/Vimeo) — never assume one format
- Demo student (`is_demo: true`) must never expose PII beyond first name in public-facing routes
- Cursor commit button is bugged — always use terminal for git
- `DEMO_PASSWORD` env var gates `/demo` route — do not hardcode the password string in source

## What This Project Is
Interactive student portfolio platform for Hadar Jewish Classical Academy. Replaces static PDF report cards with a cinematic, data-rich "Living Portfolio" — six sections covering academic growth, Hebrew immersion, reading canon, writing progression, rhetoric & video milestones, and character development. Doubles as a fundraising demo for the school. Built by Aaron Webman (non-technical founder) using Claude Code.

## Live URLs
- Design reference: `design-reference/index.html` (open in browser to see target aesthetic)
- Repo: (set when initialized)
- Vercel: (set on first deploy)

## Stack
Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Supabase · Clerk · Recharts

## Supabase Schema (6 tables)
- `students` — core student record, `parent_user_ids[]`, `is_demo` flag
- `assessments` — MAPS (math/english), AVANT (speaking/reading/listening/writing), Lexile scores
- `character_awards` — virtue badges with Hebrew, transliteration, English, award date
- `readings` — book list per student per academic year, `completed` boolean, `sort_order`
- `videos` — video milestones, accepts `storage_path` OR `external_url`, typed by `video_type`
- `writing_samples` — English and Hebrew compositions keyed by grade level

## Storage Buckets (2)
- `videos` — mp4/mov uploads
- `portfolio-assets` — thumbnails, images, PDFs

## Auth (Clerk)
- `admin` role — can create/edit students, upload assessments, link videos
- `parent` role — read-only, sees only their child(ren) via `parent_user_ids` on student record
- `/demo` — cookie-based password gate (`DEMO_PASSWORD` env var), no Clerk required
- `/dashboard` and `/admin` — Clerk protected

## Design System (enforce always)
- Background: `#F7F4EE` (cream) — never white as page background
- Primary: `#1B3A6B` (navy) · Accent: `#B8963E` (gold)
- Headings: `font-family: 'Playfair Display', serif`
- Labels/data/nav: `font-family: 'DM Mono', monospace`
- Body/prose: `font-family: 'Lora', serif`
- Borders: `1px solid #D6D0C4` — never Tailwind default gray
- No purple gradients. No dark mode. No rounded pill buttons.

## Code Hygiene Rules (enforce always)
1. No file over 300 lines — split into sub-components immediately
2. `SUPABASE_SERVICE_ROLE_KEY` only in `app/api/` — never client-side
3. No hardcoded student data in components — data flows from `getStudentPortfolio(id)`
4. All chart components accept typed `data` prop — no inline data
5. Check file tree + line counts before every commit
6. Refactor checkpoint after every 3–4 features

## Key Files
- `lib/supabase.ts` — client-side Supabase client
- `lib/supabaseAdmin.ts` — server-side admin client (service role key here only)
- `lib/getStudentPortfolio.ts` — single source of truth for all student data fetching
- `components/portfolio/` — six portfolio section components (one file per section)
- `components/charts/` — MapsLineChart, AvantBarChart, LexileBar, BenchmarkBars
- `components/video/VideoSlot.tsx` — renders storage_path or external_url, never assumes format
- `design-reference/index.html` — full visual reference, open before any UI work

## Build Sprints (update checkboxes each session)
- [ ] Sprint 1: Next.js init, Tailwind, Supabase schema, Clerk auth, static Athena demo page
- [ ] Sprint 2: Data layer — `getStudentPortfolio()`, portfolio renders from DB, admin CRUD
- [ ] Sprint 3: Media — video upload, VideoSlot component, ThenNowPlayer, thumbnails
- [ ] Sprint 4: Parent portal — Clerk parent accounts, `parent_user_ids` linking, PDF export
- [ ] Sprint 5: Demo mode — `/demo` password gate, Athena seed data, public-safe rendering

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server routes only — never client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DEMO_PASSWORD=hadar2026
```

## Verification Commands
```bash
ls components/portfolio/    # confirm section components exist
wc -l components/portfolio/*.tsx    # confirm no file over 300 lines
cat lib/supabaseAdmin.ts | grep SERVICE_ROLE    # confirm key is only here
```
