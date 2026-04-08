-- ============================================================
-- Hadar Living Portfolio — 0008: student_videos
-- ============================================================
-- Stores YouTube / Vimeo links for student portfolio sections.
-- Primarily used by The Rhetoric Room to embed video performance
-- recordings. Each row is a pasted external URL with metadata.
--
-- Category values (snake_case, shown as display labels in the UI):
--   hebrew_speaking       → Hebrew Speaking
--   poetry_recitation     → Poetry Recitation
--   socratic_reflection   → Socratic Reflection
--   immersion             → Immersion
--   other                 → Other
--
-- Prerequisites: 0001 → 0007
-- ============================================================

create table student_videos (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id)   on delete restrict,
  student_id  uuid        not null references students(id)  on delete cascade,
  title       text        not null,
  video_url   text        not null,
  grade_level text        not null,
  term        text        not null,   -- e.g. "Fall 2025"
  category    text        not null
              check (category in (
                'hebrew_speaking',
                'poetry_recitation',
                'socratic_reflection',
                'immersion',
                'other'
              )),
  created_at  timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index on student_videos(student_id);
create index on student_videos(school_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table student_videos enable row level security;

-- Admins + teachers: read all videos in their school
create policy "student_videos: admins and teachers read"
on public.student_videos for select to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

-- Parents: read only their own children's videos
create policy "student_videos: parents read own children"
on public.student_videos for select to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = student_videos.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

-- Admins + teachers: insert
create policy "student_videos: admins and teachers insert"
on public.student_videos for insert to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

-- Admins + teachers: update
create policy "student_videos: admins and teachers update"
on public.student_videos for update to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

-- Admins only: delete
create policy "student_videos: admins delete"
on public.student_videos for delete to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);
