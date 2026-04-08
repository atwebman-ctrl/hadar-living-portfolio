-- ============================================================
-- 0009_writing_samples.sql
--
-- Extends the existing writing_samples table with the fields
-- needed for the inline Creative Evolution data-entry form:
--   genre, excerpt, teacher_comments, term, file_path
--
-- All new columns are nullable — existing rows are not affected.
-- ============================================================

alter table writing_samples
  add column if not exists genre            text,
  add column if not exists excerpt          text,
  add column if not exists teacher_comments text,
  add column if not exists term             text,
  add column if not exists file_path        text;

-- Index on term for year-over-year filtering
create index if not exists writing_samples_term_idx
  on writing_samples (student_id, term);
