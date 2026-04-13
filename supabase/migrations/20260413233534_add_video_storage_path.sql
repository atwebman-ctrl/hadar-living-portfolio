-- ============================================================
-- 20260413233534_add_video_storage_path.sql
--
-- Adds video_storage_path to student_videos so direct file
-- uploads (Supabase Storage) can be recorded alongside the
-- existing YouTube/Vimeo video_url column.
--
-- Idempotent: 0014_video_storage_path.sql was tracked as
-- applied on the remote but the column never actually landed
-- (historical migration marked without being run). `if not
-- exists` makes this safe whether or not the column is there.
-- ============================================================

alter table student_videos
  add column if not exists video_storage_path text;
