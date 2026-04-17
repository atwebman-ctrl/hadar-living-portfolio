-- ============================================================
-- 20260417035409_repair_ghost_columns_from_0012.sql
--
-- Repair for the partial application of 0012_data_foundation.sql.
--
-- Audit on 2026-04-17 found that the 6 content tables listed in
-- 0012 (assessments, readings, writing_samples, student_videos,
-- teacher_notes, character_awards) all received their audit +
-- soft-delete columns. However, 0012 NEVER listed `students` in
-- its ALTER block, so the soft-delete query patterns introduced
-- across the codebase (.is('deleted_at', null)) were silently
-- broken for that table.
--
-- Audit results (verbatim):
--   students         — ✗ deleted_at  ✗ created_by  ✗ updated_by  ✓ updated_at
--   character_awards — ✓ all four columns
--   readings         — ✓ all four columns
--   writing_samples  — ✓ all four columns
--   teacher_notes    — ✓ all four columns
--   student_videos   — ✓ all four columns
--
-- Scope of this repair:
--   - Add deleted_at, created_by, updated_by to students
--   - Skip updated_at on students (already present)
--   - Add the matching partial index on students (school_id)
--     where deleted_at is null, mirroring 0012's index pattern
--
-- 0012 did not attach any updated_at triggers — the doc string
-- explicitly says "updated_at is set manually by the API on
-- every mutation". So no trigger work here either.
--
-- All DDL is idempotent — re-running this migration is a no-op.
-- ============================================================

begin;

alter table public.students
  add column if not exists deleted_at  timestamptz,
  add column if not exists created_by  text,
  add column if not exists updated_by  text;

-- Mirror the 0012 partial-index pattern. Students don't have a
-- student_id column, so the index keys on (school_id) only —
-- which is the column most queries scope by anyway.
create index if not exists students_not_deleted_idx
  on public.students (school_id) where (deleted_at is null);

commit;
