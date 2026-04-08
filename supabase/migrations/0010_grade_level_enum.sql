-- ============================================================
-- 0010_grade_level_enum.sql
--
-- Standardise the grade_level column on the students table.
-- The old free-text column is renamed to grade_level_legacy
-- and kept intact. A new grade_level column is added with a
-- CHECK constraint. Existing rows are migrated by extracting
-- the canonical value; unparseable rows are left NULL.
-- ============================================================

begin;

-- 1. Preserve the original free-text values
alter table students rename column grade_level to grade_level_legacy;

-- 2. New constrained column (nullable so bad rows stay NULL, not rejected)
alter table students
  add column grade_level text
  check (grade_level in (
    'pre-k','k',
    '1','2','3','4','5','6',
    '7','8','9','10','11','12'
  ));

-- 3. Migrate existing values
--    Rules (applied in order):
--      "Pre-K" / "pre k"  → 'pre-k'
--      "Kinder…"          → 'k'
--      any string with a digit 1-12  → that digit as text
--      anything else                 → NULL (logged below)
update students
set grade_level = case
  when grade_level_legacy ~* 'pre[- ]?k'
    then 'pre-k'
  when grade_level_legacy ~* '\bkinder'
    then 'k'
  when (regexp_match(grade_level_legacy, '\d+'))[1] is not null
    and (regexp_match(grade_level_legacy, '\d+'))[1]::int between 1 and 12
    then (regexp_match(grade_level_legacy, '\d+'))[1]
  else null
end;

-- 4. Log any rows that could not be mapped
do $$
declare
  unparsed integer;
begin
  select count(*) into unparsed
  from students
  where grade_level is null
    and grade_level_legacy is not null
    and grade_level_legacy <> '';

  if unparsed > 0 then
    raise notice
      '[0010] % student row(s) could not be mapped to a standard grade — '
      'grade_level left NULL. Inspect grade_level_legacy for the originals.',
      unparsed;
  end if;
end $$;

commit;
