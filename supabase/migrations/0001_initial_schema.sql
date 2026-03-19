-- ============================================================
-- Hadar Living Portfolio — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. students
-- ============================================================
create table students (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  grade_level   text not null,                -- e.g. "3rd Grade"
  academic_year text not null,                -- e.g. "2025-2026"
  parent_user_ids text[] not null default '{}', -- Clerk user IDs
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. assessments
-- ============================================================
create table assessments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  assessment_type text not null,  -- 'maps_math' | 'maps_english' | 'avant_speaking' | 'avant_reading' | 'avant_listening' | 'avant_writing' | 'lexile'
  score         numeric,
  percentile    numeric,
  rit_score     numeric,          -- MAPS-specific
  lexile_value  text,             -- e.g. "820L"
  term          text not null,    -- e.g. "Fall 2025" | "Winter 2026" | "Spring 2026"
  academic_year text not null,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 3. character_awards
-- ============================================================
create table character_awards (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  virtue_hebrew   text not null,          -- Hebrew text of the virtue
  virtue_transliteration text not null,   -- e.g. "Chesed"
  virtue_english  text not null,          -- e.g. "Loving-Kindness"
  award_date      date not null,
  description     text,                   -- teacher's note for the award
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 4. readings
-- ============================================================
create table readings (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  title         text not null,
  author        text,
  academic_year text not null,
  completed     boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 5. videos
-- ============================================================
create table videos (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  video_type    text not null,   -- e.g. 'rhetoric' | 'reading_aloud' | 'hebrew_speech' | 'presentation'
  title         text not null,
  description   text,
  storage_path  text,            -- path in Supabase 'videos' bucket (mutually exclusive with external_url)
  external_url  text,            -- YouTube / Vimeo URL (mutually exclusive with storage_path)
  thumbnail_path text,           -- path in 'portfolio-assets' bucket
  recorded_at   date,
  academic_year text not null,
  created_at    timestamptz not null default now(),
  constraint videos_has_one_source check (
    (storage_path is not null)::int + (external_url is not null)::int = 1
  )
);

-- ============================================================
-- 6. writing_samples
-- ============================================================
create table writing_samples (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  language      text not null check (language in ('english', 'hebrew')),
  grade_level   text not null,
  title         text not null,
  body          text,            -- plain text or markdown
  storage_path  text,            -- optional PDF in 'portfolio-assets' bucket
  academic_year text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index on assessments(student_id);
create index on assessments(assessment_type);
create index on character_awards(student_id);
create index on readings(student_id);
create index on videos(student_id);
create index on writing_samples(student_id);

-- ============================================================
-- Row-Level Security (enable; policies added per-feature)
-- ============================================================
alter table students        enable row level security;
alter table assessments     enable row level security;
alter table character_awards enable row level security;
alter table readings        enable row level security;
alter table videos          enable row level security;
alter table writing_samples enable row level security;

-- ============================================================
-- Storage buckets (run via Supabase dashboard or CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
-- insert into storage.buckets (id, name, public) values ('portfolio-assets', 'portfolio-assets', false);
