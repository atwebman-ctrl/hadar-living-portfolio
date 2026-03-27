# Hadar Living Portfolio — Architecture Document
**Technical reference for all build sessions**
*Last updated: March 27, 2026*

> **Read the master brief first.** This document assumes familiarity with the product spec (`hadar-living-portfolio-brief-v3.md`). The brief covers *what* we're building and *why*. This document covers *how*.

---

## Table of Contents

1. System Overview
2. Multi-Tenancy Model
3. Database Schema & Entity Relationships
4. Auth Flow (Clerk Organizations)
5. API Route Map
6. Data Flow
7. Component Architecture
8. Theming System
9. Design Bible
10. AI Layer Architecture
11. File & Storage Architecture
12. Deployment & Infrastructure
13. Testing Strategy
14. Security Checklist

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER                                │
│                                                               │
│  Landing Page (/)     Portfolio (/portfolio/[id])   Admin     │
│  ┌──────────┐        ┌──────────────────┐      ┌──────────┐ │
│  │ Public or │        │ 12 sections      │      │ CRUD for │ │
│  │ School    │        │ rendered from     │      │ students │ │
│  │ Login     │        │ getStudentPort-   │      │ content  │ │
│  │           │        │ folio() data      │      │ uploads  │ │
│  └──────────┘        └──────────────────┘      └──────────┘ │
│       │                      │                       │        │
└───────┼──────────────────────┼───────────────────────┼────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 SERVER                         │
│                                                               │
│  middleware.ts ──► Clerk auth check ──► school_id from org    │
│                                                               │
│  /api/public/*     /api/dashboard/*     /api/admin/*          │
│  (open)            (teacher+admin)      (admin only)          │
│                                                               │
│  lib/supabaseAdmin.ts ◄── SUPABASE_SERVICE_ROLE_KEY           │
│  lib/getStudentPortfolio.ts ◄── single data-fetch entry point │
└──────────────────────────────────────────────────────────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                               │
│                                                               │
│  PostgreSQL (RLS on every table, school_id isolation)         │
│  Storage: videos bucket, portfolio-assets bucket              │
│  Auth: Clerk JWT verification via Supabase auth.jwt()         │
└──────────────────────────────────────────────────────────────┘
```

**Key principle:** The Next.js server is the only layer that talks to Supabase with the service role key. Client components never import `supabaseAdmin`. All data flows through server components or API routes.

---

## 2. Multi-Tenancy Model

### Strategy: Shared Database, `school_id` Isolation

Every row in every table belongs to a school. There is no global data except the `schools` table itself.

```
schools
  ├── students        (school_id → schools.id)
  ├── assessments     (school_id → schools.id)
  ├── character_awards(school_id → schools.id)
  ├── readings        (school_id → schools.id)
  ├── videos          (school_id → schools.id)
  ├── writing_samples (school_id → schools.id)
  ├── teachers        (school_id → schools.id)
  ├── photos          (school_id → schools.id)
  ├── parent_uploads  (school_id → schools.id)
  ├── handwriting_samples (school_id → schools.id)
  ├── ai_drafts       (school_id → schools.id)
  └── school_members  (school_id → schools.id)
```

### How `school_id` Flows

1. User logs in via Clerk
2. Clerk session includes the user's Organization ID (`org_id`)
3. `middleware.ts` reads `org_id` from the Clerk session
4. Server-side code looks up `schools` where `clerk_org_id = org_id` → gets `school_id`
5. Every database query includes `WHERE school_id = $school_id`
6. RLS policies enforce this at the database level as a safety net

### Storage Isolation

Storage bucket paths are prefixed by school ID:

```
videos/{school_id}/{student_id}/{filename}
portfolio-assets/{school_id}/{student_id}/{filename}
```

RLS on storage policies also filters by `school_id`.

---

## 3. Database Schema & Entity Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│   schools    │
│─────────────│
│ id (PK)     │
│ name        │
│ slug        │
│ logo_url    │
│ theme_json  │
│ enabled_    │
│  sections[] │
│ clerk_org_id│
│ website_url │
│ created_at  │
└──────┬──────┘
       │
       │ school_id (FK on every table below)
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│   students   │                          │school_members│
│──────────────│                          │──────────────│
│ id (PK)      │                          │ id (PK)      │
│ school_id    │                          │ school_id    │
│ first_name   │                          │ clerk_user_id│
│ last_name    │                          │ role (enum)  │
│ grade_level  │                          │ created_at   │
│ academic_year│                          └──────────────┘
│ parent_user_ │
│  ids[]       │
│ profile_     │
│  photo_path  │
│ summary      │
│ is_demo      │
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │
       │ student_id (FK on all content tables)
       │
       ├────────────────┬────────────────┬────────────────┐
       │                │                │                │
       ▼                ▼                ▼                ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│assessments │  │  readings  │  │   videos   │  │ writing_   │
│            │  │            │  │            │  │ samples    │
│ school_id  │  │ school_id  │  │ school_id  │  │ school_id  │
│ student_id │  │ student_id │  │ student_id │  │ student_id │
│ type       │  │ title      │  │ video_type │  │ language   │
│ score      │  │ author     │  │ title      │  │ grade_level│
│ percentile │  │ why_chosen │  │ storage_   │  │ title      │
│ rit_score  │  │ values_    │  │  path      │  │ body       │
│ lexile_val │  │  skills    │  │ external_  │  │ image_path │
│ term       │  │ page_count │  │  url       │  │ ocr_text   │
│ academic_  │  │ academic_  │  │ thumbnail_ │  │ academic_  │
│  year      │  │  year      │  │  path      │  │  year      │
│ notes      │  │ completed  │  │ recorded_  │  │ created_at │
│ created_at │  │ sort_order │  │  at        │  └────────────┘
└────────────┘  │ created_at │  │ academic_  │
                └────────────┘  │  year      │
                                │ created_at │
       │                        └────────────┘
       │
       ├────────────────┬────────────────┬────────────────┐
       │                │                │                │
       ▼                ▼                ▼                ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ character_ │  │ handwriting│  │   photos   │  │  parent_   │
│ awards     │  │ _samples   │  │            │  │  uploads   │
│            │  │            │  │ school_id  │  │            │
│ school_id  │  │ school_id  │  │ student_id │  │ school_id  │
│ student_id │  │ student_id │  │ storage_   │  │ student_id │
│ virtue_heb │  │ image_path │  │  path      │  │ upload_type│
│ virtue_    │  │ ocr_text   │  │ caption    │  │ title      │
│  translit  │  │ teacher_   │  │ date_taken │  │ storage_   │
│ virtue_eng │  │  notes     │  │ age        │  │  path      │
│ award_date │  │ term       │  │ grade_level│  │ description│
│ description│  │ academic_  │  │ academic_  │  │ date       │
│ created_at │  │  year      │  │  year      │  │ age        │
└────────────┘  │ created_at │  │ created_at │  │ grade_level│
                └────────────┘  └────────────┘  │ academic_  │
                                                │  year      │
                                                │ uploaded_by│
       │                                        │ created_at │
       │                                        └────────────┘
       ▼
┌──────────────┐          ┌──────────────┐
│  teachers    │          │  ai_drafts   │
│──────────────│          │──────────────│
│ id (PK)      │          │ id (PK)      │
│ school_id    │          │ school_id    │
│ clerk_user_id│          │ student_id   │
│ first_name   │          │ section_type │
│ last_name    │          │ reference_id │
│ photo_path   │          │ content_draft│
│ bio          │          │ content_final│
│ subjects[]   │          │ status       │
│ start_year   │          │ reviewed_by  │
│ created_at   │          │ reviewed_at  │
└──────────────┘          │ created_at   │
                          └──────────────┘
```

### Key Relationships

- `schools` → everything. Every table has `school_id`.
- `students` → all content tables via `student_id`.
- `students.parent_user_ids[]` → Clerk user IDs. A parent can see their child's portfolio if their Clerk ID is in this array AND they belong to the same Clerk org.
- `teachers.clerk_user_id` → links Clerk identity to teacher profile.
- `ai_drafts.reference_id` → polymorphic FK to the content row the draft belongs to (e.g., a `writing_samples.id` or `assessments.id`). `section_type` disambiguates.
- `readings.why_chosen` and `readings.values_skills` — new columns vs. Sprint 1 schema, required by Tayler's bookshelf spec.

### New vs. Existing Tables

| Table | Status | Notes |
|-------|--------|-------|
| `schools` | **New** | Multi-tenancy anchor. Create in Sprint 1.5 migration. |
| `school_members` | **New** | Role mapping. Can defer to Sprint 2 if Clerk org roles suffice initially. |
| `students` | **Modify** | Add `school_id`, `profile_photo_path`, `summary`. |
| `assessments` | **Modify** | Add `school_id`. |
| `character_awards` | **Modify** | Add `school_id`. |
| `readings` | **Modify** | Add `school_id`, `why_chosen`, `values_skills`, `page_count`. |
| `videos` | **Modify** | Add `school_id`. |
| `writing_samples` | **Modify** | Add `school_id`, `image_path`, `ocr_text`. |
| `teachers` | **New** | Sprint 2 or 3. |
| `photos` | **New** | Sprint 3. |
| `parent_uploads` | **New** | Sprint 3. |
| `handwriting_samples` | **New** | Sprint 3. |
| `ai_drafts` | **New** | Sprint 4 (AI layer). |

### Shared Metadata

Per Tayler's requirement, every content item is tagged with date, age, and grade. Rather than adding these columns to every table, we enforce this as a pattern:

- `date` / `recorded_at` / `award_date` / `date_taken` — each table names this contextually but it always exists
- `academic_year` — present on every content table (e.g., "2025-2026")
- `grade_level` — on `students` (current) and on content tables that capture point-in-time grade

Age is derived at display time from the student's date of birth and the content's date, not stored redundantly.

---

## 4. Auth Flow (Clerk Organizations)

### Setup

```
Clerk Organization: "Hadar Jewish Classical Academy"
  ├── Admin users (org role: "admin")
  ├── Teacher users (org role: "teacher")
  └── Parent users (org role: "parent")
```

### Request Flow

```
Browser Request
    │
    ▼
middleware.ts
    │
    ├── Is route public? (/, /demo, /api/public/*) → pass through
    │
    ├── Is route protected? (/portfolio/*, /dashboard/*, /admin/*, /api/dashboard/*, /api/admin/*)
    │       │
    │       ▼
    │   Clerk session exists?
    │       │
    │       ├── No → redirect to /
    │       │
    │       ├── Yes → extract org_id from session
    │       │         │
    │       │         ▼
    │       │     lookup school_id from schools table (cached)
    │       │         │
    │       │         ▼
    │       │     attach school_id + role to request headers
    │       │         │
    │       │         ▼
    │       │     pass to route handler
    │
    └── Is route /demo? → check DEMO_PASSWORD cookie → gate or pass
```

### Role-Based Access

| Action | Admin | Teacher | Parent |
|--------|-------|---------|--------|
| View any student portfolio | ✅ | Only assigned students | Only own children |
| Upload content | ✅ | ✅ | Only to Parent Uploads section |
| Edit/delete content | ✅ | ✅ (own uploads) | ❌ |
| Review AI drafts | ✅ | ✅ | ❌ |
| Accept AI drafts | ✅ | ✅ | ❌ |
| View AI drafts (pre-acceptance) | ✅ | ✅ | ❌ |
| Manage teacher profiles | ✅ | Own profile only | ❌ |
| School settings | ✅ | ❌ | ❌ |
| State of the Union | ✅ | ❌ | ❌ |

### Parent Access Logic

```typescript
// In getStudentPortfolio() or API route:
function canParentViewStudent(clerkUserId: string, student: Student): boolean {
  return student.parent_user_ids.includes(clerkUserId);
}
```

---

## 5. API Route Map

All API routes are server-side only. `school_id` is derived from the authenticated user's Clerk org — never sent from the client.

### Public Routes (no auth)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/public/health` | GET | Health check |

### Dashboard Routes (teacher + admin, Clerk auth required)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/dashboard/students` | GET | List students for this school |
| `/api/dashboard/students/[id]` | GET | Get single student with all content |
| `/api/dashboard/students` | POST | Create student |
| `/api/dashboard/students/[id]` | PATCH | Update student |
| `/api/dashboard/assessments` | POST | Add assessment score |
| `/api/dashboard/assessments/[id]` | PATCH | Update assessment |
| `/api/dashboard/readings` | POST | Add book to reading list |
| `/api/dashboard/readings/[id]` | PATCH | Update reading entry |
| `/api/dashboard/writing-samples` | POST | Upload writing sample |
| `/api/dashboard/writing-samples/[id]` | PATCH | Update writing sample |
| `/api/dashboard/handwriting` | POST | Upload handwriting sample |
| `/api/dashboard/videos` | POST | Upload/link video |
| `/api/dashboard/character-awards` | POST | Award virtue badge |
| `/api/dashboard/photos` | POST | Upload photo |
| `/api/dashboard/ai-drafts/[id]` | PATCH | Edit and accept/reject AI draft |
| `/api/dashboard/upload` | POST | Generic file upload to storage |

### Admin Routes (admin only, Clerk auth required)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/school` | GET | Get school settings |
| `/api/admin/school` | PATCH | Update school settings (theme, sections) |
| `/api/admin/teachers` | POST | Create teacher profile |
| `/api/admin/teachers/[id]` | PATCH | Update teacher profile |
| `/api/admin/scope-sequence` | POST | Upload scope & sequence document |
| `/api/admin/state-of-union` | POST | Generate/save State of the Union (V2) |

### Parent Routes (parent, Clerk auth required)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/parent/uploads` | POST | Upload art/stories/poems from home |
| `/api/parent/uploads` | GET | List own uploads for own child |

### Every API Route Must

1. Validate input with Zod
2. Derive `school_id` from Clerk org (never from request body)
3. Check role authorization
4. Filter all queries by `school_id`
5. Return consistent error shapes: `{ error: string, code: string }`

---

## 6. Data Flow

### Portfolio Render (Parent View)

```
Parent visits /portfolio/[studentId]
    │
    ▼
middleware.ts verifies Clerk session + org membership
    │
    ▼
Server Component calls getStudentPortfolio(studentId, schoolId)
    │
    ▼
getStudentPortfolio() runs parallel queries:
    ├── students WHERE id = $id AND school_id = $schoolId
    ├── assessments WHERE student_id = $id AND school_id = $schoolId
    ├── readings WHERE student_id = $id AND school_id = $schoolId
    ├── writing_samples WHERE student_id = $id AND school_id = $schoolId
    ├── handwriting_samples WHERE student_id = $id AND school_id = $schoolId
    ├── videos WHERE student_id = $id AND school_id = $schoolId
    ├── character_awards WHERE student_id = $id AND school_id = $schoolId
    ├── photos WHERE student_id = $id AND school_id = $schoolId
    ├── parent_uploads WHERE student_id = $id AND school_id = $schoolId
    ├── ai_drafts WHERE student_id = $id AND school_id = $schoolId AND status = 'accepted'
    └── teachers via student-teacher join
    │
    ▼
Returns typed PortfolioData object
    │
    ▼
Server Component passes slices to each section component via props
    │
    ▼
Section components render (client components where interactivity needed)
```

### Key Types

```typescript
// lib/types.ts — shared type definitions

interface PortfolioData {
  student: Student;
  school: SchoolConfig;
  assessments: Assessment[];
  readings: Reading[];
  writingSamples: WritingSample[];
  handwritingSamples: HandwritingSample[];
  videos: Video[];
  characterAwards: CharacterAward[];
  photos: Photo[];
  parentUploads: ParentUpload[];
  teachers: Teacher[];
  aiDrafts: AiDraft[];  // only accepted drafts for parent view
}

interface SchoolConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: ThemeConfig;
  enabledSections: SectionType[];
  websiteUrl: string | null;
}

interface ThemeConfig {
  colors: Record<string, string>;  // CSS variable overrides
  fonts?: Record<string, string>;  // font family overrides
  logoUrl?: string;
}

type SectionType =
  | 'student_header'
  | 'academic_scores'
  | 'reading_bookshelf'
  | 'writing'
  | 'handwriting'
  | 'rhetoric'
  | 'virtue_badges'
  | 'photos'
  | 'parent_uploads'
  | 'teacher_profiles'
  | 'scope_sequence'
  | 'state_of_union';

type UserRole = 'admin' | 'teacher' | 'parent';

type AiDraftStatus = 'draft' | 'accepted' | 'rejected';
```

---

## 7. Component Architecture

### Directory Structure

```
app/
  page.tsx                          # Landing page (public)
  page.css
  layout.tsx                        # Root layout — ClerkProvider, fonts, ThemeProvider
  globals.css                       # Canonical CSS variables (Hadar defaults)
  demo/
    page.tsx                        # Password-gated demo
    portfolio.css
  portfolio/
    [studentId]/
      page.tsx                      # Server component — calls getStudentPortfolio()
  teachers/
    page.tsx                        # School-wide teacher profiles
  dashboard/
    page.tsx                        # Teacher/admin content management
    students/
      [studentId]/
        page.tsx                    # Edit student content
  admin/
    page.tsx                        # School settings, teacher management
  api/
    public/
      health/route.ts
    dashboard/
      students/route.ts
      assessments/route.ts
      readings/route.ts
      writing-samples/route.ts
      handwriting/route.ts
      videos/route.ts
      character-awards/route.ts
      photos/route.ts
      ai-drafts/[id]/route.ts
      upload/route.ts
    admin/
      school/route.ts
      teachers/route.ts
      scope-sequence/route.ts
    parent/
      uploads/route.ts

components/
  portfolio/                        # Section components — one per section
    StudentHeader.tsx
    AcademicScores.tsx
    ReadingBookshelf.tsx
    WritingSection.tsx
    HandwritingTimeline.tsx
    RhetoricSection.tsx
    VirtueBadges.tsx                # was CharacterArc.tsx
    PhotoGallery.tsx
    ParentUploads.tsx
    SideNav.tsx
    PortfolioFooter.tsx
  charts/
    MapsChart.tsx
    AvantChart.tsx
    LexileBar.tsx
    BenchmarkBars.tsx
  shared/                           # School-agnostic reusable components
    AiDraftEditor.tsx               # The universal edit-and-accept pattern
    DateAgeGradeBadge.tsx           # Shared metadata display
    OrnamentCorners.tsx             # Decorative corner elements
    SectionDivider.tsx              # Ruled divider between sections
    BookCard.tsx                    # Single book in the bookshelf
    FlipBook.tsx                    # Writing sample flip-book
    TimelineSlider.tsx              # Handwriting progression slider
    FileUpload.tsx                  # Generic upload component
  theme/
    ThemeProvider.tsx                # Reads school config, sets CSS variables
    ThemeContext.tsx                 # React context for theme values

lib/
  supabase.ts                       # Client-side Supabase (anon key)
  supabaseAdmin.ts                  # Server-side Supabase (service role key)
  getStudentPortfolio.ts            # Single data-fetch entry point
  getSchoolConfig.ts                # Fetch school settings + theme
  types.ts                          # Shared TypeScript types
  validation.ts                     # Zod schemas for API input validation
  auth.ts                           # Clerk helpers — getSchoolId(), getRole()
  constants.ts                      # Section type enums, role enums

middleware.ts                       # Clerk auth + route protection
```

### Component Rules

1. **Section components** receive their data slice as typed props — they never fetch data themselves.
2. **Section components** check `school.enabledSections` before rendering — if the section isn't enabled, return `null`.
3. **Shared components** are fully school-agnostic — no school name, no hardcoded colors, no Hadar-specific content.
4. **`AiDraftEditor`** is a single shared component used by every AI-assisted section. It handles the draft/edit/accept flow. Sections don't rebuild this.
5. **Client components** (`'use client'`) are used only where interactivity is required (charts, flip-book, timeline slider, forms). Server components are the default.
6. **No component over 300 lines.** Split into sub-components at that threshold.

---

## 8. Theming System

### How It Works

```
1. School logs in → Clerk org identified → school_id resolved
2. getSchoolConfig(schoolId) fetches school settings including theme_json
3. ThemeProvider reads theme_json and injects CSS variables into :root
4. All components use CSS variables — never hardcoded hex values
```

### ThemeProvider Pattern

```typescript
// components/theme/ThemeProvider.tsx (conceptual)

export function ThemeProvider({ school, children }: { school: SchoolConfig; children: React.ReactNode }) {
  const cssVars = {
    '--navy': school.theme.colors?.navy || '#1B3A6B',
    '--gold': school.theme.colors?.gold || '#C49A2A',
    '--cream': school.theme.colors?.cream || '#F7F4EE',
    // ... all tokens with Hadar defaults as fallbacks
  };

  return (
    <div style={cssVars}>
      <SchoolContext.Provider value={school}>
        {children}
      </SchoolContext.Provider>
    </div>
  );
}
```

### What's Themeable vs. Fixed

| Aspect | Themeable per school? | Notes |
|--------|----------------------|-------|
| Colors (navy, gold, cream, ink, rule) | ✅ Yes | Via `theme_json.colors` |
| Logo | ✅ Yes | Via `schools.logo_url` |
| School name | ✅ Yes | Via `schools.name` |
| Display font | ✅ Yes (V2) | Via `theme_json.fonts` — defer to Sprint 5 |
| Section labels | ✅ Yes | Via `schools.enabled_sections` config |
| Layout structure | ❌ No | Same grid, same section order, same nav |
| Animation patterns | ❌ No | Bookshelf, flip-book, timeline — consistent UX |
| AI layer UX | ❌ No | Same edit-and-accept pattern everywhere |
| Corner ornaments | ✅ Yes (V2) | Schools can upload custom ornament images |

---

## 9. Design Bible

> This section captures the emotional register and visual language. It supplements the design tokens in the master brief. Read this before writing any CSS or creating any UI component.

### The Metaphor

**This is a book.** Not an app, not a dashboard, not a portal. It is a beautifully bound book that a family opens to see their child's intellectual and moral story unfold. Every design decision must pass this test: *would this feel right on a page of a book?*

### Emotional Register

**C.S. Lewis meets classical literature.** The feeling of opening an old book that matters — gilt-edged pages, a linen cover, serif typography that breathes, illustrations framed in gold. The Narnia endpapers. The Mishneh Torah. A first edition you'd pass down to your children.

This is not sterile. It is not minimalist. It is not "clean." It is *warm, literate, and reverent* — toward the child, toward the teachers, toward the act of learning itself.

### Visual Principles

**1. The Book Spine Metaphor**
The left side of the landing page is the book cover — navy linen, gold tooling, an illustration. The right side is the first page — parchment, classical type, an invitation to open. Once inside the portfolio, the sidenav is the spine. Scrolling through sections is turning pages. The footer is the colophon.

**2. Warmth Over Sterility**
Cream and parchment, never white. Linen textures on navy surfaces, never flat. If a background feels like a screen instead of paper, it's wrong.

**3. Gold is Gilding**
Gold is the accent. It lives on edges: borders, ornament outlines, active states, the glint on a heading. It never fills a large surface. It never competes with content.

**4. Typography Is the Design**
The fonts carry the aesthetic more than any other element. Cinzel Decorative for the school name — monumental, rare, used once. Playfair Display for section headings — elegant, readable. Lora for body text — warm, bookish. DM Mono for labels and data — precise marginalia. The font sizes should be generous. The line heights should breathe. This is a book, not a spreadsheet.

**5. Ornament Is Structural**
Corner ornaments, horizontal rules, decorative dividers — these are the equivalents of tooled borders on a leather binding. They tell you where one section ends and another begins. They frame content like a gilt border frames a plate illustration. They are never clip art.

**6. Quiet Animation**
Content fades in gently as you scroll (`IntersectionObserver` with `opacity` + `translateY`). The bookshelf books ease into place. The handwriting timeline slider is smooth. Nothing bounces. Nothing overshoots. Nothing calls attention to itself. The content is the event — the animation is just the page turning.

**7. No Modern SaaS Aesthetic**
Rounded pill buttons — no. Purple/blue gradients — no. Card shadows and hover lifts — no. Drop shadows — no. The visual vocabulary of Notion, Linear, Stripe, and Tailwind UI defaults does not belong here. If it looks like it came from a template, it's wrong.

### Component-Specific Design Notes

**Bookshelf (§3 Reading):** The highest-impact visual. Books should feel like physical objects — spines with visible titles, slight perspective, warm lighting. Consider a wood-grain shelf texture. Books animate in from the right as the year progresses. Each book opens to reveal its card (why chosen, values, skills). This is the moment a parent smiles. Get it right.

**Handwriting Timeline (§5):** The second highest-impact visual. A horizontal slider showing samples from September through May. The writing should be the hero — large, centered, with the teacher's notes below in a softer weight. Parents drag through the year and watch their child's hand develop. This is an emotional moment. The UI should be invisible; only the handwriting matters.

**Writing Flip-Book (§4):** The physical page-turn metaphor. Writing samples flip like pages in a notebook. The AI mechanics summary sits in a subtle sidebar or footnote position — it's marginalia, not the main text.

**AI Draft Editor:** The edit-and-accept UI. A clean text area with the AI draft pre-filled. A small "AI draft — pending teacher review" label in DM Mono. An "Accept" button in gold outline. A "Reject" link in ink-light. When the teacher accepts, the label disappears and the content becomes part of the portfolio. This component is used everywhere — make it feel like natural marginalia, not a form.

**Virtue Badges (§7):** Gold-bordered medallions or seals. Hebrew text prominent, transliteration and English below. The brief teacher note (when present) appears as a small italic line beneath — like a scribe's annotation.

---

## 10. AI Layer Architecture

### Pipeline

```
Teacher uploads content (PDF, image, text)
    │
    ▼
API route receives + stores the raw content
    │
    ▼
Background job (or synchronous for MVP) calls Claude API:
    ├── OCR (writing samples, handwriting, test score PDFs)
    ├── Mechanics analysis (punctuation, spelling, handwriting quality)
    ├── Critique summary (rhetoric, writing structure)
    ├── Score extraction + validation (standardized tests)
    │
    ▼
AI output stored in ai_drafts table:
    - section_type: which section this draft belongs to
    - reference_id: FK to the content row
    - content_draft: the AI's raw output
    - content_final: NULL (teacher hasn't edited yet)
    - status: 'draft'
    │
    ▼
Teacher sees the draft in AiDraftEditor component
    │
    ▼
Teacher edits → hits Accept
    │
    ▼
API route updates ai_drafts:
    - content_final: teacher's edited version
    - status: 'accepted'
    - reviewed_by: teacher's Clerk ID
    - reviewed_at: now()
    │
    ▼
Parent view renders content_final (never content_draft)
```

### AI Validation (Standardized Tests)

Per Tayler: "AI double checks through built-in tests." For score extraction:

1. AI extracts scores from uploaded PDF
2. AI runs self-validation: are scores within valid ranges? Do all expected fields have values? Do math scores sum correctly?
3. Validation results are surfaced alongside the draft: "Extracted MAPS Math RIT: 215 ✓ (valid range 140-300)"
4. Teacher reviews both the extraction and the validation before accepting

### Cost Architecture

- One-time processing on upload (not on every view)
- Raw extracted text stored in the content table (e.g., `writing_samples.ocr_text`)
- AI draft stored in `ai_drafts`
- Accepted content stored in `ai_drafts.content_final`
- No re-processing unless teacher explicitly requests it

---

## 11. File & Storage Architecture

### Supabase Storage Buckets

| Bucket | Contents | Access |
|--------|----------|--------|
| `videos` | Student video uploads (mp4, mov) | Private — signed URLs |
| `portfolio-assets` | Images, thumbnails, PDFs, writing scans | Private — signed URLs |

### Path Convention

```
{bucket}/{school_id}/{student_id}/{section}/{filename}

Examples:
portfolio-assets/abc123/def456/writing/essay-fall-2025.pdf
portfolio-assets/abc123/def456/photos/classroom-oct-2025.jpg
portfolio-assets/abc123/def456/handwriting/sample-sept-2025.png
portfolio-assets/abc123/def456/profile/headshot.jpg
videos/abc123/def456/rhetoric/presentation-spring-2026.mp4
```

### Upload Flow

```
Teacher selects file in dashboard
    │
    ▼
Client-side: validate file type + size
    │
    ▼
POST /api/dashboard/upload with file + metadata
    │
    ▼
Server: validate with Zod, check auth + role
    │
    ▼
Server: upload to Supabase Storage at school_id/student_id/section/filename
    │
    ▼
Server: insert row in content table with storage_path
    │
    ▼
Server: if AI-eligible (writing, handwriting, test scores) → trigger AI pipeline
    │
    ▼
Return success + new content ID
```

---

## 12. Deployment & Infrastructure

### Current

- **Hosting:** Vercel (free tier)
- **Database:** Supabase (free tier)
- **Auth:** Clerk (free tier)
- **Domain:** `hadar-living-portfolio.vercel.app` (temporary)

### Production Targets

- **Custom domain:** Linked from main Hadar website (e.g., `portfolio.hadaracademy.org`)
- **Vercel Pro:** When real student data enters the system
- **Supabase Pro:** When storage needs exceed free tier (video uploads will push this)
- **Sentry:** Error tracking before parent accounts go live
- **Upstash:** Rate limiting on API routes (match Webman Law pattern)

### Multi-School Deployment (V2+)

Two options when licensing begins:

1. **Single deployment, multi-tenant** (recommended) — One Vercel deployment, one Supabase project, `school_id` isolation. Schools are org tenants. This is what the architecture is designed for.
2. **Per-school deployments** — Each school gets its own Vercel + Supabase. More isolation, more ops burden. Only if a school demands it.

---

## 13. Testing Strategy

### Test Pyramid

```
Unit tests (most)
    └── Zod schemas validate correctly
    └── getStudentPortfolio returns typed data
    └── canParentViewStudent logic
    └── AI draft status transitions
    └── Theme variable merging

Integration tests (middle)
    └── API routes return correct data for correct roles
    └── RLS policies block cross-school access
    └── Upload pipeline stores + records correctly
    └── AI pipeline stores draft correctly

E2E tests (least — defer to Sprint 5)
    └── Parent can log in and view child's portfolio
    └── Teacher can upload content and accept AI draft
    └── Admin can manage school settings
```

### Multi-Tenancy Tests (Critical)

Every test suite must include a two-school fixture:

- School A (Hadar) with students, content, teachers
- School B (Mock School) with its own students, content, teachers
- Tests verify that School A users cannot see School B data and vice versa
- Tests verify that RLS policies block direct Supabase queries across schools

### CI Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install dependencies
      - TypeScript type-check (tsc --noEmit)
      - Lint (ESLint)
      - Run tests (Jest)
      - Build (next build)
```

---

## 14. Security Checklist

Aligned with Webman Law security posture. Check every item before going live with real student data.

### Auth & Access

- [ ] Clerk installed and configured with Organizations
- [ ] `middleware.ts` protects all non-public routes
- [ ] Role-based access enforced at API level (not just UI)
- [ ] `school_id` derived from Clerk org — never from client
- [ ] Parent access limited to own children via `parent_user_ids`
- [ ] Demo route gated by `DEMO_PASSWORD` env var
- [ ] No real student PII accessible without authentication

### Database

- [ ] RLS enabled on every table (already done)
- [ ] RLS policies written and enforce `school_id` isolation
- [ ] Service role key only in `lib/supabaseAdmin.ts`, only imported in `app/api/`
- [ ] No service role key in client bundles (verify with `next build` output)
- [ ] Storage buckets set to private (not public)
- [ ] Storage RLS policies enforce `school_id` path prefix

### Input & API

- [ ] Zod validation on every API route
- [ ] Rate limiting on all API routes (Upstash)
- [ ] File upload validation: type whitelist, size limits
- [ ] No SQL injection vectors (Supabase parameterized queries handle this)
- [ ] Consistent error responses — never leak stack traces or internal state

### Secrets

- [ ] `.env.local` in `.gitignore` (already done)
- [ ] No secrets in `CLAUDE.md` or any committed file
- [ ] Supabase service role key rotated before first real user
- [ ] Clerk secret key never exposed client-side

### Compliance (Student Data)

- [ ] FERPA awareness — student education records require parental consent for disclosure
- [ ] Only parents of record (in `parent_user_ids`) can view their child's data
- [ ] Teachers see only their assigned students (or all, depending on school policy — configurable)
- [ ] No student data in error logs or Sentry breadcrumbs
- [ ] Data export/deletion capability for school admin (FERPA right of access)

---

*Architecture Document v1 · March 27, 2026*
*Companion to: Hadar Living Portfolio — Master Brief v3*
