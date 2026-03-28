-- ============================================================
-- Hadar Living Portfolio — Sprint 1.5: RLS Policies
-- ============================================================
-- Prerequisites:
--   - 0001_initial_schema.sql  (tables + RLS enabled)
--   - 0002_multi_tenancy.sql   (schools table, school_id columns)
--   - Clerk configured as a JWT third-party provider in Supabase
--     (Dashboard → Authentication → Third-party Auth → Add Clerk).
--     Once configured, auth.jwt() returns the Clerk JWT payload.
--
-- Clerk JWT claims used here:
--   auth.jwt() ->> 'sub'       → Clerk user ID
--   auth.jwt() ->> 'org_id'    → Clerk organization ID
--   auth.jwt() ->> 'org_role'  → e.g. 'org:admin' | 'org:teacher' | 'org:parent'
--
-- Service role (used by lib/supabaseAdmin.ts) bypasses all RLS.
-- These policies govern the anon-key client (lib/supabase.ts).
--
-- Tables covered (Sprint 1 + 1.5 tables only):
--   schools, school_members, students, assessments,
--   character_awards, readings, videos, writing_samples, ai_drafts
--
-- Sprint 3 tables (photos, parent_uploads, handwriting_samples,
-- teachers) will receive policies in their own migration.
-- ============================================================

-- ============================================================
-- Helper functions
-- Centralise JWT claim extraction so every policy stays readable.
-- SECURITY DEFINER + search_path = '' prevents privilege escalation.
-- current_school_id() is SECURITY DEFINER so it can query schools
-- without triggering the schools SELECT policy (avoids circularity).
-- ============================================================

create or replace function current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.schools
  where clerk_org_id = (auth.jwt() ->> 'org_id')
  limit 1
$$;

create or replace function current_clerk_user_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select auth.jwt() ->> 'sub'
$$;

create or replace function current_org_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select auth.jwt() ->> 'org_role'
$$;

-- ============================================================
-- 1. schools
-- ============================================================
-- Users may read their own school record.
-- INSERT: service role only (provisioning via admin tooling).
-- UPDATE: admins only (school settings page).
-- DELETE: service role only (deprovisioning).
-- ============================================================

create policy "schools: authenticated users read own school"
on public.schools
for select
to authenticated
using (id = current_school_id());

create policy "schools: admins update own school"
on public.schools
for update
to authenticated
using (
  id = current_school_id()
  and current_org_role() = 'org:admin'
)
with check (id = current_school_id());

-- ============================================================
-- 2. school_members
-- ============================================================
-- All authenticated school members can read the member list.
-- Only admins can manage memberships.
-- ============================================================

create policy "school_members: read members of own school"
on public.school_members
for select
to authenticated
using (school_id = current_school_id());

create policy "school_members: admins insert members"
on public.school_members
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

create policy "school_members: admins update members"
on public.school_members
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
)
with check (school_id = current_school_id());

create policy "school_members: admins delete members"
on public.school_members
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 3. students
-- ============================================================
-- Admins + teachers: read/write all students within their school.
-- Parents: read only their own children (Clerk user ID in parent_user_ids).
-- INSERT/UPDATE/DELETE: admins only (teachers view; admin manages roster).
-- ============================================================

create policy "students: admins and teachers read"
on public.students
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "students: parents read own children"
on public.students
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and current_clerk_user_id() = any(parent_user_ids)
);

create policy "students: admins insert"
on public.students
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

create policy "students: admins update"
on public.students
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
)
with check (school_id = current_school_id());

create policy "students: admins delete"
on public.students
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 4. assessments
-- ============================================================
-- Admins + teachers: full read/write for their school.
-- Parents: read only their own children's rows.
-- DELETE: admins only.
-- ============================================================

create policy "assessments: admins and teachers read"
on public.assessments
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "assessments: parents read own children"
on public.assessments
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = assessments.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "assessments: admins and teachers insert"
on public.assessments
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "assessments: admins and teachers update"
on public.assessments
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "assessments: admins delete"
on public.assessments
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 5. character_awards
-- ============================================================

create policy "character_awards: admins and teachers read"
on public.character_awards
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "character_awards: parents read own children"
on public.character_awards
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = character_awards.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "character_awards: admins and teachers insert"
on public.character_awards
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "character_awards: admins and teachers update"
on public.character_awards
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "character_awards: admins delete"
on public.character_awards
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 6. readings
-- ============================================================

create policy "readings: admins and teachers read"
on public.readings
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "readings: parents read own children"
on public.readings
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = readings.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "readings: admins and teachers insert"
on public.readings
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "readings: admins and teachers update"
on public.readings
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "readings: admins delete"
on public.readings
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 7. videos
-- ============================================================

create policy "videos: admins and teachers read"
on public.videos
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "videos: parents read own children"
on public.videos
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = videos.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "videos: admins and teachers insert"
on public.videos
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "videos: admins and teachers update"
on public.videos
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "videos: admins delete"
on public.videos
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 8. writing_samples
-- ============================================================

create policy "writing_samples: admins and teachers read"
on public.writing_samples
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "writing_samples: parents read own children"
on public.writing_samples
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id = writing_samples.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "writing_samples: admins and teachers insert"
on public.writing_samples
for insert
to authenticated
with check (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "writing_samples: admins and teachers update"
on public.writing_samples
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "writing_samples: admins delete"
on public.writing_samples
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- 9. ai_drafts
-- ============================================================
-- Admins + teachers: read all drafts (including 'draft' status),
--   can update (accept/reject/edit).
-- Parents: read ONLY accepted drafts for their own children.
--   Never see draft or rejected content.
-- INSERT: service role only (the AI pipeline creates drafts).
--   No INSERT policy for authenticated role = implicit deny.
-- DELETE: admins only.
-- ============================================================

create policy "ai_drafts: admins and teachers read all"
on public.ai_drafts
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "ai_drafts: parents read accepted drafts for own children"
on public.ai_drafts
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and status = 'accepted'
  and exists (
    select 1 from public.students s
    where s.id = ai_drafts.student_id
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "ai_drafts: admins and teachers update"
on public.ai_drafts
for update
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
)
with check (school_id = current_school_id());

create policy "ai_drafts: admins delete"
on public.ai_drafts
for delete
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- Storage bucket policies (run after enabling RLS on buckets
-- in the Supabase dashboard or via CLI).
-- Path format: {bucket}/{school_id}/{student_id}/...
-- ============================================================

-- videos bucket
create policy "storage videos: admins and teachers read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "storage videos: parents read own children"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id::text = (storage.foldername(name))[2]
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "storage videos: admins and teachers insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "storage videos: admins delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() = 'org:admin'
);

-- portfolio-assets bucket
create policy "storage portfolio-assets: admins and teachers read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "storage portfolio-assets: parents read own children"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() = 'org:parent'
  and exists (
    select 1 from public.students s
    where s.id::text = (storage.foldername(name))[2]
      and s.school_id = current_school_id()
      and current_clerk_user_id() = any(s.parent_user_ids)
  )
);

create policy "storage portfolio-assets: admins and teachers insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "storage portfolio-assets: admins delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = current_school_id()::text
  and current_org_role() = 'org:admin'
);

-- ============================================================
-- Notes for Sprint 3:
--   When photos, parent_uploads, handwriting_samples, and
--   teachers tables are created, add their policies following
--   the same pattern above. parent_uploads will need an
--   additional INSERT policy for 'org:parent' role (parents
--   can write to their own child's section only).
-- ============================================================
