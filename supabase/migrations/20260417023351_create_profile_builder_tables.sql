-- ============================================================
-- Learning Profile Builder — schema foundation
--
-- Three new tables for the per-student, per-semester profile
-- assembly workflow:
--
--   1. profiles
--        One row per student per (academic_year, season).
--        Status flow: draft → in_review → published → unpublished.
--   2. profile_sections
--        Per-profile sections (12 required + N optional). Holds
--        AI-drafted narrative, teacher-final narrative, and
--        references to the data sources / teacher_notes used.
--   3. profile_section_attachments
--        Photos / videos / certificates / documents attached to
--        a specific section. Storage paths point at portfolio-assets.
--
-- Patterns mirror existing tables:
--   - school_id FK schools(id) ON DELETE RESTRICT
--   - student_id FK students(id) ON DELETE CASCADE (only on profiles;
--     downstream rows cascade through profile_id)
--   - audit columns: created_by, updated_by (Clerk user IDs as text)
--   - soft delete: deleted_at; partial indexes exclude deleted rows
--   - RLS enabled, helper functions from 0003 (current_school_id,
--     current_clerk_user_id, current_org_role)
--
-- All DDL is idempotent so the migration is safe to re-run.
-- ============================================================

begin;

-- ── 1. profiles ─────────────────────────────────────────────

create table if not exists profiles (
  id                  uuid        primary key default gen_random_uuid(),
  school_id           uuid        not null references schools(id)         on delete restrict,
  student_id          uuid        not null references students(id)        on delete cascade,
  academic_year_id    uuid        not null references academic_years(id)  on delete restrict,
  term                text        not null,
  season              text        not null check (season in ('fall', 'spring')),
  status              text        not null default 'draft'
                                  check (status in ('draft', 'in_review', 'published', 'unpublished')),
  drafted_by          text,
  reviewed_by         text,
  published_at        timestamptz,
  unpublished_at      timestamptz,
  unpublish_reason    text,
  created_by          text,
  updated_by          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  constraint profiles_student_year_season_unique
    unique (student_id, academic_year_id, season)
);

-- ── 2. profile_sections ─────────────────────────────────────

create table if not exists profile_sections (
  id                  uuid        primary key default gen_random_uuid(),
  profile_id          uuid        not null references profiles(id) on delete cascade,
  school_id           uuid        not null references schools(id)  on delete restrict,
  section_kind        text        not null
                                  check (section_kind in (
                                    'maps_scores',
                                    'lexile',
                                    'avant_hebrew',
                                    'hebrew_comparison',
                                    'canon_reading',
                                    'english_composition',
                                    'hebrew_composition',
                                    'character_middot',
                                    'poetry_recitation',
                                    'art_projects',
                                    'field_trips',
                                    'custom'
                                  )),
  section_order       int         not null default 0,
  is_required         boolean     not null default true,
  status              text        not null default 'not_started'
                                  check (status in ('not_started', 'in_progress', 'awaiting_review', 'complete')),
  narrative_text      text,
  narrative_draft     text,
  teacher_notes_used  jsonb       not null default '[]'::jsonb,
  data_sources        jsonb       not null default '{}'::jsonb,
  created_by          text,
  updated_by          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- ── 3. profile_section_attachments ──────────────────────────

create table if not exists profile_section_attachments (
  id                  uuid        primary key default gen_random_uuid(),
  profile_section_id  uuid        not null references profile_sections(id) on delete cascade,
  school_id           uuid        not null references schools(id)          on delete restrict,
  attachment_kind     text        not null
                                  check (attachment_kind in ('photo', 'video', 'certificate', 'document')),
  storage_path        text        not null,
  caption             text,
  display_order       int         not null default 0,
  uploaded_by         text        not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- ── Indexes ─────────────────────────────────────────────────

create index if not exists idx_profiles_school_student
  on profiles (school_id, student_id) where deleted_at is null;

create index if not exists idx_profiles_status
  on profiles (school_id, status) where deleted_at is null;

create index if not exists idx_profile_sections_profile
  on profile_sections (profile_id) where deleted_at is null;

create index if not exists idx_profile_sections_status
  on profile_sections (status) where deleted_at is null;

create index if not exists idx_profile_section_attachments_section
  on profile_section_attachments (profile_section_id) where deleted_at is null;

-- ── Row-Level Security ──────────────────────────────────────

alter table profiles                    enable row level security;
alter table profile_sections            enable row level security;
alter table profile_section_attachments enable row level security;

-- ── RLS policies — profiles ─────────────────────────────────

drop policy if exists "profiles: admins and teachers read" on public.profiles;
create policy "profiles: admins and teachers read"
on public.profiles
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profiles: parents read own children's published" on public.profiles;
create policy "profiles: parents read own children's published"
on public.profiles
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and status = 'published'
  and exists (
    select 1 from public.students s
    where s.id = profiles.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

drop policy if exists "profiles: admins and teachers insert" on public.profiles;
create policy "profiles: admins and teachers insert"
on public.profiles
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profiles: admins and teachers update" on public.profiles;
create policy "profiles: admins and teachers update"
on public.profiles
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

drop policy if exists "profiles: admins delete" on public.profiles;
create policy "profiles: admins delete"
on public.profiles
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ── RLS policies — profile_sections ─────────────────────────
-- Parent read: section's parent profile must be published AND the
-- student must list the parent in parent_user_ids.

drop policy if exists "profile_sections: admins and teachers read" on public.profile_sections;
create policy "profile_sections: admins and teachers read"
on public.profile_sections
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profile_sections: parents read own children's published" on public.profile_sections;
create policy "profile_sections: parents read own children's published"
on public.profile_sections
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1
    from public.profiles p
    join public.students s on s.id = p.student_id
    where p.id = profile_sections.profile_id
      and p.school_id = current_school_id()
      and p.status = 'published'
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

drop policy if exists "profile_sections: admins and teachers insert" on public.profile_sections;
create policy "profile_sections: admins and teachers insert"
on public.profile_sections
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profile_sections: admins and teachers update" on public.profile_sections;
create policy "profile_sections: admins and teachers update"
on public.profile_sections
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

drop policy if exists "profile_sections: admins delete" on public.profile_sections;
create policy "profile_sections: admins delete"
on public.profile_sections
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ── RLS policies — profile_section_attachments ──────────────
-- Parent read: walk attachment → section → profile (must be
-- published) → student (must include parent in parent_user_ids).

drop policy if exists "profile_section_attachments: admins and teachers read" on public.profile_section_attachments;
create policy "profile_section_attachments: admins and teachers read"
on public.profile_section_attachments
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profile_section_attachments: parents read own children's published" on public.profile_section_attachments;
create policy "profile_section_attachments: parents read own children's published"
on public.profile_section_attachments
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1
    from public.profile_sections ps
    join public.profiles p on p.id = ps.profile_id
    join public.students s on s.id = p.student_id
    where ps.id = profile_section_attachments.profile_section_id
      and ps.school_id = current_school_id()
      and p.status = 'published'
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

drop policy if exists "profile_section_attachments: admins and teachers insert" on public.profile_section_attachments;
create policy "profile_section_attachments: admins and teachers insert"
on public.profile_section_attachments
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

drop policy if exists "profile_section_attachments: admins and teachers update" on public.profile_section_attachments;
create policy "profile_section_attachments: admins and teachers update"
on public.profile_section_attachments
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

drop policy if exists "profile_section_attachments: admins delete" on public.profile_section_attachments;
create policy "profile_section_attachments: admins delete"
on public.profile_section_attachments
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ── updated_at trigger ──────────────────────────────────────
-- No prior set_updated_at / handle_updated_at function exists in
-- supabase/migrations/. Create one and attach to all three tables.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists profile_sections_set_updated_at on profile_sections;
create trigger profile_sections_set_updated_at
  before update on profile_sections
  for each row execute function set_updated_at();

drop trigger if exists profile_section_attachments_set_updated_at on profile_section_attachments;
create trigger profile_section_attachments_set_updated_at
  before update on profile_section_attachments
  for each row execute function set_updated_at();

commit;
