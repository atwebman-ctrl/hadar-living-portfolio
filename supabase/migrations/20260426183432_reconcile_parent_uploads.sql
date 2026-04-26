-- Reconcile parent_uploads with verified production state (2026-04-26).
--
-- Production drift summary:
--   1. Added column: category text (nullable)
--   2. Added column: updated_by text (nullable)
--   3. Added column: updated_at timestamptz (nullable)
--   4. Added column: deleted_at timestamptz (nullable)
--   5. Dropped original upload_type CHECK constraint
--   6. Added new CHECK on category column with relaxed vocabulary
--
-- All ALTER statements use IF NOT EXISTS / IF EXISTS so this migration is
-- idempotent — safe to run against production (changes already present)
-- and against fresh local DB (changes will land).
--
-- Note: The duality between upload_type and category is data-model debt
-- to address in a future refactor. Reconciliation here matches prod
-- exactly; no consolidation.

-- 1. Add ghost columns
alter table parent_uploads add column if not exists category text;
alter table parent_uploads add column if not exists updated_by text;
alter table parent_uploads add column if not exists updated_at timestamptz;
alter table parent_uploads add column if not exists deleted_at timestamptz;

-- 2. Drop the original upload_type CHECK (inline check from 0004 with
--    a system-generated name). Use a DO block to drop whichever name exists.
do $$
declare
  cons_name text;
begin
  select conname into cons_name
  from pg_constraint
  where conrelid = 'public.parent_uploads'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%upload_type%';

  if cons_name is not null then
    execute format('alter table parent_uploads drop constraint %I', cons_name);
  end if;
end $$;

-- 3. Add CHECK on category column matching production exactly
alter table parent_uploads
  drop constraint if exists parent_uploads_category_check;

alter table parent_uploads
  add constraint parent_uploads_category_check
  check (category = any (array[
    'art_craft'::text,
    'home_project'::text,
    'recording'::text,
    'certificate'::text,
    'photo'::text,
    'other'::text
  ]));
