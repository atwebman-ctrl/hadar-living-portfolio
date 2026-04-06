-- ============================================================
-- 0006_student_archived_at.sql
--
-- Adds soft-delete support to the students table.
-- Archived students are excluded from dashboard queries.
-- ============================================================

alter table students add column if not exists archived_at timestamptz null;

-- Index for the common query pattern: unarchived students per school
create index if not exists idx_students_school_archived
  on students(school_id, archived_at)
  where archived_at is null;
