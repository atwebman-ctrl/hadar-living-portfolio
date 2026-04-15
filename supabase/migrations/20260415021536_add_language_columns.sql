-- Add language columns to writing_samples and student_videos.
-- Idempotent so it is safe to re-run against any environment.

alter table writing_samples
  add column if not exists language text not null default 'english'
  check (language in ('english', 'hebrew'));

alter table student_videos
  add column if not exists language text not null default 'english'
  check (language in ('english', 'hebrew'));
