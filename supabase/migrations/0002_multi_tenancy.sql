-- ============================================================
-- Hadar Living Portfolio — Sprint 1.5: Multi-Tenancy Foundation
-- ============================================================
-- This migration:
--   1. Creates the `schools` table (multi-tenancy anchor)
--   2. Seeds the Hadar school record with a fixed UUID
--   3. Adds `school_id` to all six existing tables (nullable first,
--      then backfills from the Hadar seed, then sets NOT NULL + FK)
--   4. Adds missing columns called out in architecture doc §3
--   5. Creates `ai_drafts` table
--   6. Adds indexes and enables RLS on new tables
-- ============================================================

-- ============================================================
-- 1. schools
-- ============================================================
create table schools (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,          -- url-safe identifier, e.g. "hadar"
  logo_url         text,
  theme_json       jsonb not null default '{}',   -- overridable design tokens per school
  enabled_sections text[] not null default '{
    "academic_scores",
    "reading",
    "writing",
    "handwriting",
    "rhetoric",
    "virtue_badges",
    "photos",
    "parent_uploads",
    "teacher_profiles",
    "scope_sequence"
  }',
  clerk_org_id     text unique,                   -- Clerk Organization ID for this school
  website_url      text,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 2. Hadar seed record (fixed UUID so all backfills are stable)
-- ============================================================
-- theme_json stores the canonical Hadar design tokens.
-- When the ThemeProvider is wired up in Sprint 2, it reads from here.
insert into schools (
  id,
  name,
  slug,
  theme_json,
  website_url,
  created_at
) values (
  'a1000000-0000-0000-0000-000000000001',
  'Hadar Jewish Classical Academy',
  'hadar',
  '{
    "colors": {
      "navy":       "#1B3A6B",
      "navyDeep":   "#152A47",
      "gold":       "#C49A2A",
      "goldLight":  "#D4AF6A",
      "cream":      "#F7F4EE",
      "parchment":  "#F2E8CC",
      "ink":        "#1C1917",
      "inkMid":     "#44403C",
      "inkLight":   "#78716C",
      "rule":       "#D6D0C4"
    },
    "fonts": {
      "display":  "Cinzel Decorative",
      "heading":  "Playfair Display",
      "body":     "Lora",
      "mono":     "DM Mono"
    }
  }',
  'https://hadar.edu',
  now()
);

-- ============================================================
-- 3. Add school_id to existing tables
-- Add as nullable first so we can backfill before enforcing NOT NULL.
-- ============================================================

alter table students         add column school_id uuid;
alter table assessments      add column school_id uuid;
alter table character_awards add column school_id uuid;
alter table readings         add column school_id uuid;
alter table videos           add column school_id uuid;
alter table writing_samples  add column school_id uuid;

-- ============================================================
-- 4. Backfill all existing rows with the Hadar school_id
-- ============================================================
update students         set school_id = 'a1000000-0000-0000-0000-000000000001';
update assessments      set school_id = 'a1000000-0000-0000-0000-000000000001';
update character_awards set school_id = 'a1000000-0000-0000-0000-000000000001';
update readings         set school_id = 'a1000000-0000-0000-0000-000000000001';
update videos           set school_id = 'a1000000-0000-0000-0000-000000000001';
update writing_samples  set school_id = 'a1000000-0000-0000-0000-000000000001';

-- ============================================================
-- 5. Enforce NOT NULL + FK now that every row has a school_id
-- ============================================================
alter table students
  alter column school_id set not null,
  add constraint students_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

alter table assessments
  alter column school_id set not null,
  add constraint assessments_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

alter table character_awards
  alter column school_id set not null,
  add constraint character_awards_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

alter table readings
  alter column school_id set not null,
  add constraint readings_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

alter table videos
  alter column school_id set not null,
  add constraint videos_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

alter table writing_samples
  alter column school_id set not null,
  add constraint writing_samples_school_id_fkey
    foreign key (school_id) references schools(id) on delete restrict;

-- ============================================================
-- 6. Add missing columns to existing tables (architecture doc §3)
-- ============================================================

-- students: profile photo + summary paragraph (Student Header section)
alter table students
  add column profile_photo_path text,   -- path in 'portfolio-assets' bucket
  add column summary             text;  -- student narrative summary

-- readings: bookshelf spec columns (Tayler requirement)
alter table readings
  add column why_chosen    text,        -- why this book was selected
  add column values_skills text,        -- values and skills it builds
  add column page_count    integer;

-- writing_samples: OCR pipeline columns (Sprint 4 prep)
alter table writing_samples
  add column image_path text,           -- original handwritten image in 'portfolio-assets'
  add column ocr_text   text;           -- AI-extracted transcription

-- ============================================================
-- 7. school_members
-- Maps Clerk user IDs to schools with roles.
-- Complements Clerk org roles — used for server-side school_id derivation.
-- ============================================================
create type school_member_role as enum ('admin', 'teacher', 'parent');

create table school_members (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  clerk_user_id text not null,
  role          school_member_role not null,
  created_at    timestamptz not null default now(),
  unique (school_id, clerk_user_id, role)  -- one record per user per role per school; a user may hold multiple roles
);

-- ============================================================
-- 8. ai_drafts
-- Shared table for all AI-generated content across sections.
-- Nothing AI-generated is parent-visible without teacher acceptance.
-- ============================================================
create type ai_draft_status as enum ('draft', 'accepted', 'rejected');

create table ai_drafts (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete restrict,
  student_id     uuid not null references students(id) on delete cascade,
  section_type   text not null,    -- e.g. 'writing' | 'rhetoric' | 'assessment' | 'handwriting'
  reference_id   uuid not null,    -- polymorphic FK to the content row (disambiguated by section_type)
  content_draft  text not null,    -- AI-generated output, unedited
  content_final  text,             -- teacher-edited version (null until accepted)
  status         ai_draft_status not null default 'draft',
  reviewed_by    text,             -- Clerk user ID of the reviewing teacher/admin
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  -- Enforce that accepted/rejected drafts always have a reviewer
  constraint ai_drafts_reviewed_when_decided check (
    status = 'draft' or (reviewed_by is not null and reviewed_at is not null)
  )
);

-- ============================================================
-- 9. Indexes
-- ============================================================

-- school_id indexes on all tables (required for multi-tenant query performance)
create index on students(school_id);
create index on assessments(school_id);
create index on character_awards(school_id);
create index on readings(school_id);
create index on videos(school_id);
create index on writing_samples(school_id);
create index on school_members(school_id);
create index on school_members(clerk_user_id);
create index on ai_drafts(school_id);
create index on ai_drafts(student_id);
create index on ai_drafts(reference_id);
create index on ai_drafts(status);

-- ============================================================
-- 10. Row-Level Security on new tables
-- ============================================================
alter table schools        enable row level security;
alter table school_members enable row level security;
alter table ai_drafts      enable row level security;

-- ============================================================
-- RLS policies are written in a separate migration (0003_rls_policies.sql)
-- once Clerk JWT integration is configured. Service role bypasses RLS
-- for all API routes in app/api/ — client-side Supabase client is
-- governed by anon key + these policies.
-- ============================================================
