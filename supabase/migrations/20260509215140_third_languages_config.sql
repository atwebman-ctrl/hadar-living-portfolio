-- ============================================================
-- Third-language slot generalization.
--
-- Quire was originally Hebrew-coded. Erik Twist's May 7, 2026
-- advisor call surfaced that for non-Hadar tenants (classical
-- Christian schools), the "third language" is typically Latin
-- and/or Greek -- and a single school can teach more than one.
--
-- This migration:
--   1. Adds schools.third_languages JSONB array. Each entry:
--        { code: text, label: text, hasAvantNorms: bool }
--      e.g. Hadar = [{ code: "hebrew", label: "Hebrew", hasAvantNorms: true }]
--           Latin school = [{ code: "latin", label: "Latin", hasAvantNorms: false },
--                           { code: "greek", label: "Greek", hasAvantNorms: false }]
--   2. Loosens writing_samples.language and student_videos.language
--      CHECK constraints so any short lowercase code is valid.
--      Existing rows ('english', 'hebrew') remain valid.
--   3. Seeds Hadar (slug='hadar') with one Hebrew slot.
-- ============================================================

-- 1. schools.third_languages
alter table public.schools
  add column if not exists third_languages jsonb not null default '[]'::jsonb;

comment on column public.schools.third_languages is
  'Per-tenant list of additional languages a school teaches (beyond English). '
  'Shape: [{ code: text, label: text, hasAvantNorms: bool }]. The code is used '
  'as the URL slug and matches writing_samples.language / student_videos.language. '
  'Empty array = English-only school.';

-- 2a. writing_samples.language -- drop old CHECK if present, add permissive one
do $$
declare
  cons_name text;
begin
  select conname into cons_name
  from pg_constraint
  where conrelid = 'public.writing_samples'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%language%';
  if cons_name is not null then
    execute format('alter table public.writing_samples drop constraint %I', cons_name);
  end if;
end $$;

alter table public.writing_samples
  add constraint writing_samples_language_format_check
  check (language ~ '^[a-z][a-z0-9_]{0,31}$');

-- 2b. student_videos.language -- same treatment
do $$
declare
  cons_name text;
begin
  select conname into cons_name
  from pg_constraint
  where conrelid = 'public.student_videos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%language%';
  if cons_name is not null then
    execute format('alter table public.student_videos drop constraint %I', cons_name);
  end if;
end $$;

alter table public.student_videos
  add constraint student_videos_language_format_check
  check (language ~ '^[a-z][a-z0-9_]{0,31}$');

-- 3. Seed Hadar -- only if the row exists and the column is still its default empty array
update public.schools
set third_languages = '[{"code":"hebrew","label":"Hebrew","hasAvantNorms":true}]'::jsonb
where slug = 'hadar'
  and (third_languages is null or third_languages = '[]'::jsonb);
