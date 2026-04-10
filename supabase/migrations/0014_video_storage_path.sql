-- ============================================================
-- 0014_video_storage_path.sql
--
-- Extends student_videos to support direct file uploads in
-- addition to YouTube/Vimeo URLs.
--
-- Changes:
--   1. Make video_url nullable (was NOT NULL) — existing rows
--      retain their values; new rows can omit it when a file
--      is uploaded instead.
--   2. Add video_storage_path — Supabase Storage path inside
--      the portfolio-assets bucket for directly uploaded files.
--   3. Add check constraint — at least one source must be set.
--
-- Apply via Supabase SQL Editor. Safe to run once.
-- Prerequisites: 0008_student_videos.sql
-- ============================================================

begin;

-- 1. Allow video_url to be null (for file-upload rows)
alter table student_videos
  alter column video_url drop not null;

-- 2. Storage path for directly uploaded video files
alter table student_videos
  add column if not exists video_storage_path text;

-- 3. Every row must have at least one source
alter table student_videos
  drop constraint if exists student_videos_source_check;

alter table student_videos
  add constraint student_videos_source_check
  check (video_url is not null or video_storage_path is not null);

commit;
