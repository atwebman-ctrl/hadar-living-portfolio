-- Add progress_summary column to students.
-- Teacher/admin-editable narrative shown in the dashboard hub's Progress Summary banner.
-- Distinct from `summary` (hero biographical blurb). Idempotent.

alter table students add column if not exists progress_summary text;
