-- ============================================================
-- 20260509152332_harden_data_durability.sql
--
-- Three coordinated changes to harden data durability:
--
-- 1. Convert every student_id FK from ON DELETE CASCADE to ON DELETE RESTRICT.
--    A student row cannot be hard-deleted while child content (assessments,
--    photos, videos, etc.) still references it. Soft-delete remains the
--    only deletion path and is enforced at the schema level. Matches the
--    posture already used on school_id FKs.
--
-- 2. Add students.deleted_at to align with the soft-delete column used by
--    the other six mandated tables. Backfill from the legacy archived_at
--    column. archived_at is left in place for one release; a follow-up
--    migration will drop it once all app code reads/writes deleted_at.
--
-- 3. Add compound (school_id, student_id) indexes on the per-student
--    content tables. The portfolio loader filters on both columns on every
--    query; without the compound index Postgres scans two single-column
--    indexes. Negligible at 100 students, painful at 1000+.
--
-- All statements are idempotent. Safe to re-apply.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Student FK cascade → restrict
-- ----------------------------------------------------------------
do $$
declare
  child_table text;
  fk_name text;
begin
  foreach child_table in array array[
    'assessments',
    'character_awards',
    'readings',
    'writing_samples',
    'videos',
    'handwriting_samples',
    'photos',
    'parent_uploads',
    'teacher_notes',
    'scope_and_sequence',
    'ai_drafts',
    'student_videos',
    'profiles',
    'parent_students',
    'report_cards'
  ]
  loop
    -- Skip tables that don't exist (defensive against ghost migrations).
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = child_table
    ) then
      continue;
    end if;

    -- Find the FK constraint targeting students(id) on this table.
    select conname into fk_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_class r on r.oid = c.confrelid
    where t.relname = child_table
      and r.relname = 'students'
      and c.contype = 'f'
    limit 1;

    if fk_name is null then
      continue;
    end if;

    execute format('alter table %I drop constraint %I', child_table, fk_name);
    execute format(
      'alter table %I add constraint %I foreign key (student_id) references students(id) on delete restrict',
      child_table, fk_name
    );
  end loop;
end$$;

-- ----------------------------------------------------------------
-- 2. students.deleted_at: add column, backfill from archived_at
-- ----------------------------------------------------------------
alter table students add column if not exists deleted_at timestamptz null;

update students
set deleted_at = archived_at
where archived_at is not null and deleted_at is null;

create index if not exists idx_students_school_deleted
  on students(school_id, deleted_at)
  where deleted_at is null;

-- ----------------------------------------------------------------
-- 3. Compound (school_id, student_id) indexes on per-student tables
-- ----------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'assessments',
    'character_awards',
    'readings',
    'writing_samples',
    'videos',
    'handwriting_samples',
    'photos',
    'parent_uploads',
    'teacher_notes',
    'scope_and_sequence',
    'student_videos',
    'report_cards'
  ]
  loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    execute format(
      'create index if not exists idx_%s_school_student on %I (school_id, student_id)',
      t, t
    );
  end loop;
end$$;
