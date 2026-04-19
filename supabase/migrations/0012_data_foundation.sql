-- ============================================================
-- 0012_data_foundation.sql
--
-- Data foundation for K–12 longitudinal tracking.
--
-- 1. Audit columns  (created_by, updated_by, updated_at) on 6 tables
-- 2. Soft delete    (deleted_at) on the same 6 tables
-- 3. Partial indexes for soft-delete queries
-- 4. academic_years — canonical year registry per school
-- 5. enrollment_records — enrollment history per student
-- 6. class_assignments  — student ↔ teacher assignments per year
--
-- Apply via Supabase SQL Editor. Safe to run twice (IF NOT EXISTS / IF EXISTS guards).
-- ============================================================

begin;

-- ── 1 & 2. Audit + soft-delete columns on 6 content tables ───────────────────
--
-- created_by / updated_by store the Clerk user ID (text) of the acting user.
-- updated_at is set manually by the API on every mutation.
-- deleted_at is NULL for live rows; set to now() on soft delete.

alter table assessments
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

alter table readings
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

alter table writing_samples
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

alter table student_videos
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

alter table teacher_notes
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

alter table character_awards
  add column if not exists created_by  text,
  add column if not exists updated_by  text,
  add column if not exists updated_at  timestamptz,
  add column if not exists deleted_at  timestamptz;

-- ── 3. Partial indexes — fast soft-delete exclusion ─────────────────────────
--
-- These cover the standard SELECT pattern:
--   .eq('student_id', …).eq('school_id', …).is('deleted_at', null)

create index if not exists assessments_not_deleted_idx
  on assessments (student_id, school_id) where (deleted_at is null);

create index if not exists readings_not_deleted_idx
  on readings (student_id, school_id) where (deleted_at is null);

create index if not exists writing_samples_not_deleted_idx
  on writing_samples (student_id, school_id) where (deleted_at is null);

create index if not exists student_videos_not_deleted_idx
  on student_videos (student_id, school_id) where (deleted_at is null);

create index if not exists teacher_notes_not_deleted_idx
  on teacher_notes (student_id, school_id) where (deleted_at is null);

create index if not exists character_awards_not_deleted_idx
  on character_awards (student_id, school_id) where (deleted_at is null);

-- ── 4. academic_years ────────────────────────────────────────────────────────
--
-- Canonical list of academic years per school.
-- label:       '2025-2026' (matches the ACADEMIC_YEAR_OPTIONS constant)
-- is_current:  true for the active year — enforced unique per school
-- Supports future admin UI for year management.

create table if not exists academic_years (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete restrict,
  label       text        not null,
  start_date  date        not null,
  end_date    date        not null,
  is_current  boolean     not null default false,
  created_at  timestamptz not null default now(),
  constraint  academic_years_school_label_unique unique (school_id, label)
);

-- Only one current year allowed per school
create unique index if not exists academic_years_one_current_per_school
  on academic_years (school_id)
  where (is_current = true);

-- ── 5. enrollment_records ────────────────────────────────────────────────────
--
-- Tracks each enrollment period for a student.
-- Multiple rows per student represent re-enrollments or transfers.
-- withdrawn_date is null while the student is actively enrolled.

create table if not exists enrollment_records (
  id              uuid        primary key default gen_random_uuid(),
  school_id       uuid        not null references schools(id) on delete restrict,
  student_id      uuid        not null references students(id) on delete restrict,
  academic_year   text        not null,
  enrolled_date   date        not null,
  withdrawn_date  date,
  status          text        not null default 'active'
                  check (status in ('active', 'withdrawn', 'graduated', 'transferred')),
  notes           text,
  created_by      text,
  created_at      timestamptz not null default now()
);

create index if not exists enrollment_records_student_idx
  on enrollment_records (student_id);

create index if not exists enrollment_records_school_year_idx
  on enrollment_records (school_id, academic_year);

-- ── 6. class_assignments ─────────────────────────────────────────────────────
--
-- Maps a student to a teacher for a given academic year and optional subject.
-- subject = null means homeroom / all-subjects assignment.
-- teacher_user_id is the Clerk user ID of the assigned teacher.

create table if not exists class_assignments (
  id               uuid        primary key default gen_random_uuid(),
  school_id        uuid        not null references schools(id) on delete restrict,
  student_id       uuid        not null references students(id) on delete restrict,
  teacher_user_id  text        not null,
  academic_year    text        not null,
  subject          text,
  created_by       text,
  created_at       timestamptz not null default now()
);

-- Unique enforcement via index, not table constraint: PostgreSQL rejects
-- COALESCE() expressions in UNIQUE table constraints. Production already
-- runs this as an index with the name class_assignments_unique_idx.
create unique index if not exists class_assignments_unique_idx
  on public.class_assignments (school_id, student_id, teacher_user_id, academic_year, coalesce(subject, ''));

create index if not exists class_assignments_student_idx
  on class_assignments (student_id);

create index if not exists class_assignments_teacher_idx
  on class_assignments (teacher_user_id, school_id, academic_year);

commit;
