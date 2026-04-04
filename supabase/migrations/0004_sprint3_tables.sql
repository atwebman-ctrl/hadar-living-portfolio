-- ============================================================
-- Hadar Living Portfolio — Sprint 3: New Content Tables
-- ============================================================
-- This migration creates five Sprint 3 content tables:
--   1. handwriting_samples
--   2. photos
--   3. parent_uploads
--   4. teacher_notes
--   5. scope_and_sequence
--
-- Every table follows the same structural rules as Sprint 1/2:
--   - school_id FK → schools(id)  ON DELETE RESTRICT
--       (a school cannot be deleted while content rows exist)
--   - student_id FK → students(id) ON DELETE CASCADE
--       (deleting a student wipes their content automatically)
--   - RLS enabled; policies follow the 0003 pattern exactly
--   - Indexes on school_id and student_id for multi-tenant queries
--
-- Not included here: `teachers` table (separate migration).
--
-- Prerequisites:
--   0001_initial_schema.sql
--   0002_multi_tenancy.sql   (schools table + school_id columns)
--   0003_rls_policies.sql    (helper functions: current_school_id,
--                             current_clerk_user_id, current_org_role)
-- ============================================================

-- ============================================================
-- 1. handwriting_samples
-- ============================================================
-- Stores scanned handwriting images with optional teacher
-- observations. Sprint 4 will add OCR-extracted text via
-- the AI pipeline.
-- ============================================================
create table handwriting_samples (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id)   on delete restrict,
  student_id    uuid        not null references students(id)  on delete cascade,
  image_path    text        not null,   -- path in 'portfolio-assets' bucket
  ocr_text      text,                  -- AI-extracted transcription (Sprint 4)
  teacher_notes text,                  -- qualitative observation from teacher
  term          text        not null,  -- e.g. "Fall 2025" | "Winter 2026" | "Spring 2026"
  academic_year text        not null,  -- e.g. "2025-2026"
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 2. photos
-- ============================================================
-- School-life photos submitted by teachers or admins.
-- Parents may view photos of their own children.
-- ============================================================
create table photos (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id)   on delete restrict,
  student_id    uuid        not null references students(id)  on delete cascade,
  storage_path  text        not null,  -- path in 'portfolio-assets' bucket
  caption       text,
  date_taken    date,
  grade_level   text        not null,  -- grade when photo was taken
  academic_year text        not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 3. parent_uploads
-- ============================================================
-- Artifacts submitted by parents (art, stories, recordings, etc.).
-- Parents can INSERT for their own children (see policy below).
-- Admins and teachers can read all uploads within their school.
-- ============================================================
create table parent_uploads (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id)   on delete restrict,
  student_id    uuid        not null references students(id)  on delete cascade,
  upload_type   text        not null check (upload_type in ('art', 'story', 'poem', 'recording', 'other')),
  title         text        not null,
  storage_path  text        not null,  -- path in 'portfolio-assets' bucket
  description   text,
  date          date,                  -- when the work was created (not upload date)
  grade_level   text        not null,
  academic_year text        not null,
  uploaded_by   text        not null,  -- Clerk user ID of the uploading parent
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 4. teacher_notes
-- ============================================================
-- Teacher-authored qualitative narratives, one per section per
-- student. Not AI-generated — written directly by the teacher.
-- Parents can read their own children's notes.
-- ============================================================
create table teacher_notes (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id)   on delete restrict,
  student_id    uuid        not null references students(id)  on delete cascade,
  section_type  text        not null,  -- e.g. 'academic_scores' | 'writing' | 'virtue_badges'
  author_name   text        not null,  -- denormalized display name for rendering
  text          text        not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 5. scope_and_sequence
-- ============================================================
-- Per-subject curriculum progress for a student within a grade
-- and academic year. Displayed in the ScopeAndSequence section.
-- ============================================================
create table scope_and_sequence (
  id             uuid        primary key default gen_random_uuid(),
  school_id      uuid        not null references schools(id)   on delete restrict,
  student_id     uuid        not null references students(id)  on delete cascade,
  subject        text        not null,  -- e.g. "Mathematics"
  unit           text,                  -- e.g. "Fractions & Decimals"
  completion_pct integer     not null default 0
                             check (completion_pct between 0 and 100),
  notes          text,
  grade_level    text        not null,
  academic_year  text        not null,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
-- student_id: primary access pattern (fetching all content for one student)
-- school_id:  required for multi-tenant query performance

create index on handwriting_samples(student_id);
create index on handwriting_samples(school_id);

create index on photos(student_id);
create index on photos(school_id);

create index on parent_uploads(student_id);
create index on parent_uploads(school_id);
create index on parent_uploads(uploaded_by);  -- parent lookups by Clerk user ID

create index on teacher_notes(student_id);
create index on teacher_notes(school_id);
create index on teacher_notes(section_type);

create index on scope_and_sequence(student_id);
create index on scope_and_sequence(school_id);

-- ============================================================
-- Row-Level Security (enable)
-- ============================================================
alter table handwriting_samples enable row level security;
alter table photos               enable row level security;
alter table parent_uploads       enable row level security;
alter table teacher_notes        enable row level security;
alter table scope_and_sequence   enable row level security;

-- ============================================================
-- RLS Policies — handwriting_samples
-- ============================================================
-- Admins + teachers: full access within their school.
-- Parents: read only their own children's samples.
-- ============================================================

create policy "handwriting_samples: admins and teachers read"
on public.handwriting_samples
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "handwriting_samples: parents read own children"
on public.handwriting_samples
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = handwriting_samples.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "handwriting_samples: admins and teachers insert"
on public.handwriting_samples
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "handwriting_samples: admins and teachers update"
on public.handwriting_samples
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "handwriting_samples: admins delete"
on public.handwriting_samples
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- RLS Policies — photos
-- ============================================================

create policy "photos: admins and teachers read"
on public.photos
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "photos: parents read own children"
on public.photos
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = photos.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "photos: admins and teachers insert"
on public.photos
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "photos: admins and teachers update"
on public.photos
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "photos: admins delete"
on public.photos
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- RLS Policies — parent_uploads
-- ============================================================
-- Parents get an additional INSERT policy so they can submit
-- artifacts for their own children. See 0003 note at bottom.
-- ============================================================

create policy "parent_uploads: admins and teachers read"
on public.parent_uploads
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "parent_uploads: parents read own children"
on public.parent_uploads
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = parent_uploads.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "parent_uploads: admins and teachers insert"
on public.parent_uploads
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

-- Parents may upload artifacts for their own children only.
-- The application layer sets uploaded_by = current_clerk_user_id().
create policy "parent_uploads: parents insert for own children"
on public.parent_uploads
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = parent_uploads.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "parent_uploads: admins and teachers update"
on public.parent_uploads
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "parent_uploads: admins delete"
on public.parent_uploads
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- RLS Policies — teacher_notes
-- ============================================================
-- Teachers author notes; parents read their children's notes.
-- ============================================================

create policy "teacher_notes: admins and teachers read"
on public.teacher_notes
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "teacher_notes: parents read own children"
on public.teacher_notes
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = teacher_notes.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "teacher_notes: admins and teachers insert"
on public.teacher_notes
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "teacher_notes: admins and teachers update"
on public.teacher_notes
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "teacher_notes: admins delete"
on public.teacher_notes
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- RLS Policies — scope_and_sequence
-- ============================================================

create policy "scope_and_sequence: admins and teachers read"
on public.scope_and_sequence
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "scope_and_sequence: parents read own children"
on public.scope_and_sequence
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = scope_and_sequence.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "scope_and_sequence: admins and teachers insert"
on public.scope_and_sequence
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "scope_and_sequence: admins and teachers update"
on public.scope_and_sequence
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "scope_and_sequence: admins delete"
on public.scope_and_sequence
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- Notes for Sprint 3 follow-up:
--   - `teachers` table is a separate migration (0005).
--   - Once 0004 is applied and seed.ts is re-run, remove the
--     safeQuery wrappers for these tables in getStudentPortfolio.ts
--     and wire the scope_and_sequence query + mapper.
--   - Storage bucket policies for portfolio-assets already cover
--     photos, parent_uploads, and handwriting_samples paths
--     (0003 policies match on bucket_id = 'portfolio-assets').
-- ============================================================
