-- ============================================================
-- 20260602153615_add_scripture_section_kind.sql
--
-- Add 'scripture' to the allowed values for profile_sections.section_kind.
-- Scripture ships as an OPTIONAL section kind: a placeholder card in the
-- published Profile Builder report announcing memory work, recitations,
-- and devotional reflections are forthcoming. Mirrors the new Scripture
-- tab in the live portfolio.
--
-- Idempotent: drops and re-adds the CHECK constraint by name.
-- ============================================================

alter table profile_sections
  drop constraint if exists profile_sections_section_kind_check;

alter table profile_sections
  add constraint profile_sections_section_kind_check
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
    'custom',
    'scripture'
  ));
