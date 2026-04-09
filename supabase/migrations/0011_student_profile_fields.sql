-- ============================================================
-- 0011_student_profile_fields.sql
--
-- Adds three profile fields to the students table:
--   gender           — 'boy' | 'girl' (nullable)
--   date_of_birth    — date (nullable; age is always computed)
--   enrollment_status — 'active' | 'withdrawn' | 'graduated' | 'transferred'
--                       defaults to 'active' for all existing rows
-- ============================================================

begin;

alter table students
  add column gender text
    check (gender in ('boy', 'girl')),

  add column date_of_birth date,

  add column enrollment_status text not null default 'active'
    check (enrollment_status in ('active', 'withdrawn', 'graduated', 'transferred'));

commit;
