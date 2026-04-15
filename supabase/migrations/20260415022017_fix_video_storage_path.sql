-- Ensure student_videos.video_storage_path exists.
-- Idempotent; safe to re-run against any environment.

alter table student_videos
  add column if not exists video_storage_path text;
