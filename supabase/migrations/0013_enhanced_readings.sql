-- ============================================================
-- Migration 0013: Enhanced readings table
--
-- Adds richer metadata columns to the readings table:
-- teacher_notes, reading_difficulty, student_rating,
-- date_started, date_finished, key_quote, curriculum_connection
--
-- Apply in Supabase SQL Editor.
-- ============================================================

begin;

alter table readings
  add column if not exists teacher_notes        text,
  add column if not exists reading_difficulty   text
    check (reading_difficulty in ('below_level','on_level','above_level','stretch')),
  add column if not exists student_rating       integer
    check (student_rating between 1 and 5),
  add column if not exists date_started         date,
  add column if not exists date_finished        date,
  add column if not exists key_quote            text,
  add column if not exists curriculum_connection text
    check (curriculum_connection in (
      'torah_studies','history','science','literature','free_choice','class_read_aloud'
    ));

commit;
