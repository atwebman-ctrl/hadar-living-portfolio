-- ============================================================
-- Renumber section_order on existing profile_sections rows to
-- match the new classical-education report-card sequence defined
-- in lib/types/profileBuilder.ts. Idempotent: re-running this
-- migration sets the same numbers and is a no-op.
--
-- Only updates the 9 required section_kinds. Optional kinds
-- (art_projects, field_trips, custom) keep whatever section_order
-- they were inserted with.
--
-- The DDL for profile_sections itself lives in
-- 20260417023351_create_profile_builder_tables.sql. This
-- migration is data-only.
-- ============================================================

update public.profile_sections
set section_order = case section_kind
  when 'character_middot'     then 0
  when 'canon_reading'        then 1
  when 'english_composition'  then 2
  when 'avant_hebrew'         then 3
  when 'hebrew_comparison'    then 4
  when 'hebrew_composition'   then 5
  when 'poetry_recitation'    then 6
  when 'lexile'               then 7
  when 'maps_scores'          then 8
  else section_order
end
where section_kind in (
  'character_middot',
  'canon_reading',
  'english_composition',
  'avant_hebrew',
  'hebrew_comparison',
  'hebrew_composition',
  'poetry_recitation',
  'lexile',
  'maps_scores'
);
