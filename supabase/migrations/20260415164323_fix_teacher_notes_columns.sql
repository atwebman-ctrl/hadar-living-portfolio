-- ============================================================
-- 20260415164323_fix_teacher_notes_columns.sql
--
-- Backfill ghost columns on teacher_notes that the TS layer
-- (types, mappers, API route, InlineTeacherNoteForm, TeacherJournal)
-- already references but were never landed in a tracked migration.
-- Also adds section_anchor for the upcoming inline-section-comments
-- "View in context" deep link.
--
-- All DDL is idempotent so this is safe whether production already
-- had these columns from a dashboard-applied patch or not.
-- ============================================================

alter table teacher_notes add column if not exists section_category   text;
alter table teacher_notes add column if not exists term               text;
alter table teacher_notes add column if not exists highlight_quote    text;
alter table teacher_notes add column if not exists visible_to_parents boolean not null default true;
alter table teacher_notes add column if not exists section_anchor     text;
