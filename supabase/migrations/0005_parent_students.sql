-- ============================================================
-- Hadar Living Portfolio — Sprint 4: Parent-Student Invitations
-- ============================================================
-- Creates the parent_students table that tracks which parents
-- have been invited to view which student portfolios.
--
-- Flow:
--   1. Admin/teacher POSTs to invite-parent → row inserted here
--      with status='pending', parent_clerk_user_id=NULL.
--   2. Clerk org invitation email is sent to invited_email.
--   3. On parent's first portfolio visit, the server matches
--      their Clerk email to invited_email, sets
--      parent_clerk_user_id and flips status to 'active'.
--
-- Design decisions:
--   - parent_clerk_user_id is nullable (unknown at invite time).
--   - Unique constraint on (school_id, student_id, invited_email)
--     prevents duplicate invitations.
--   - student_id FK uses ON DELETE CASCADE so invitations are
--     cleaned up automatically when a student is removed.
--   - school_id FK uses ON DELETE RESTRICT (same as all tables).
--   - All writes go through supabaseAdmin (service role); RLS
--     policies cover anon-key read paths.
--
-- Prerequisites:
--   0001_initial_schema.sql
--   0002_multi_tenancy.sql
--   0003_rls_policies.sql  (helper functions: current_school_id,
--                           current_clerk_user_id, current_org_role)
-- ============================================================

create table parent_students (
  id                   uuid        primary key default gen_random_uuid(),
  school_id            uuid        not null references schools(id)   on delete restrict,
  student_id           uuid        not null references students(id)  on delete cascade,
  parent_clerk_user_id text,                  -- null until parent first logs in
  invited_email        text        not null,
  status               text        not null default 'pending'
                                   check (status in ('pending', 'active')),
  created_at           timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────

-- Unique: prevent duplicate invitations per parent+student
create unique index parent_students_unique_invite
  on parent_students (school_id, student_id, invited_email);

-- Fast email lookups (first-login linking path)
create index parent_students_email_idx
  on parent_students (invited_email);

-- Fast user-ID lookups (subsequent visit access checks)
create index parent_students_user_id_idx
  on parent_students (parent_clerk_user_id)
  where parent_clerk_user_id is not null;

-- ── Row-Level Security ────────────────────────────────────────
-- INSERT / UPDATE / DELETE: service role only (supabaseAdmin in
-- API routes). No authenticated write policies = implicit deny.
-- SELECT: admins/teachers see all rows for their school;
--   parents see only their own rows.

alter table parent_students enable row level security;

create policy "parent_students: admins and teachers read"
on public.parent_students
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() in ('org:admin', 'org:teacher')
);

create policy "parent_students: parents read own rows"
on public.parent_students
for select
to authenticated
using (
  school_id = current_school_id()
  and current_org_role() = 'org:parent'
  and parent_clerk_user_id = current_clerk_user_id()
);
