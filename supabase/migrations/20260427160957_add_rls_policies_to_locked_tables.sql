-- Add RLS policies to 6 tables that have RLS enabled but zero policies.
-- These tables are currently in fail-closed state for non-service-role traffic.
-- Patterns mirror existing healthy tables verified in prod via pg_policies.
--
-- Coverage:
--   student_videos      → mirror videos
--   book_catalog        → school-wide read (no student_id), school-scoped writes
--   academic_years      → school-wide read, admin-only writes
--   class_assignments   → A+T+P(own children) read, admin-only writes
--   enrollment_records  → A+T+P(own children) read, admin-only writes
--   report_cards        → mirror assessments (parents read all of own children's)
--
-- Refs: schema drift audit, Apr 27, 2026.

-- ── student_videos ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "student_videos: admins and teachers insert" ON public.student_videos;
CREATE POLICY "student_videos: admins and teachers insert"
  ON public.student_videos
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "student_videos: admins and teachers read" ON public.student_videos;
CREATE POLICY "student_videos: admins and teachers read"
  ON public.student_videos
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "student_videos: admins and teachers update" ON public.student_videos;
CREATE POLICY "student_videos: admins and teachers update"
  ON public.student_videos
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "student_videos: admins delete" ON public.student_videos;
CREATE POLICY "student_videos: admins delete"
  ON public.student_videos
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

DROP POLICY IF EXISTS "student_videos: parents read own children" ON public.student_videos;
CREATE POLICY "student_videos: parents read own children"
  ON public.student_videos
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:parent'::text) AND (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_videos.student_id
      AND s.school_id = current_school_id()
      AND current_clerk_user_id() = ANY (s.parent_user_ids)
  )));

-- ── book_catalog ──────────────────────────────────────────────────────────────
-- Drop legacy book_catalog policies from migration 0007 (pre-Clerk era).
-- These use auth.uid() and school_members join, both deprecated patterns.
-- Verified dead in prod (prod has 0 policies on book_catalog) and in local
-- evaluate to empty (auth.uid() returns NULL in Clerk-based deployments).
DROP POLICY IF EXISTS "school members read book_catalog" ON public.book_catalog;
DROP POLICY IF EXISTS "teacher insert book_catalog" ON public.book_catalog;

DROP POLICY IF EXISTS "book_catalog: admins and teachers insert" ON public.book_catalog;
CREATE POLICY "book_catalog: admins and teachers insert"
  ON public.book_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "book_catalog: school members read" ON public.book_catalog;
CREATE POLICY "book_catalog: school members read"
  ON public.book_catalog
  FOR SELECT
  TO authenticated
  USING (school_id = current_school_id());

DROP POLICY IF EXISTS "book_catalog: admins and teachers update" ON public.book_catalog;
CREATE POLICY "book_catalog: admins and teachers update"
  ON public.book_catalog
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "book_catalog: admins delete" ON public.book_catalog;
CREATE POLICY "book_catalog: admins delete"
  ON public.book_catalog
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

-- ── academic_years ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "academic_years: school members read" ON public.academic_years;
CREATE POLICY "academic_years: school members read"
  ON public.academic_years
  FOR SELECT
  TO authenticated
  USING (school_id = current_school_id());

DROP POLICY IF EXISTS "academic_years: admins insert" ON public.academic_years;
CREATE POLICY "academic_years: admins insert"
  ON public.academic_years
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

DROP POLICY IF EXISTS "academic_years: admins update" ON public.academic_years;
CREATE POLICY "academic_years: admins update"
  ON public.academic_years
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "academic_years: admins delete" ON public.academic_years;
CREATE POLICY "academic_years: admins delete"
  ON public.academic_years
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

-- ── class_assignments ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "class_assignments: admins and teachers read" ON public.class_assignments;
CREATE POLICY "class_assignments: admins and teachers read"
  ON public.class_assignments
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "class_assignments: parents read own children" ON public.class_assignments;
CREATE POLICY "class_assignments: parents read own children"
  ON public.class_assignments
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:parent'::text) AND (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = class_assignments.student_id
      AND s.school_id = current_school_id()
      AND current_clerk_user_id() = ANY (s.parent_user_ids)
  )));

DROP POLICY IF EXISTS "class_assignments: admins insert" ON public.class_assignments;
CREATE POLICY "class_assignments: admins insert"
  ON public.class_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

DROP POLICY IF EXISTS "class_assignments: admins update" ON public.class_assignments;
CREATE POLICY "class_assignments: admins update"
  ON public.class_assignments
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "class_assignments: admins delete" ON public.class_assignments;
CREATE POLICY "class_assignments: admins delete"
  ON public.class_assignments
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

-- ── enrollment_records ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "enrollment_records: admins and teachers read" ON public.enrollment_records;
CREATE POLICY "enrollment_records: admins and teachers read"
  ON public.enrollment_records
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "enrollment_records: parents read own children" ON public.enrollment_records;
CREATE POLICY "enrollment_records: parents read own children"
  ON public.enrollment_records
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:parent'::text) AND (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = enrollment_records.student_id
      AND s.school_id = current_school_id()
      AND current_clerk_user_id() = ANY (s.parent_user_ids)
  )));

DROP POLICY IF EXISTS "enrollment_records: admins insert" ON public.enrollment_records;
CREATE POLICY "enrollment_records: admins insert"
  ON public.enrollment_records
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

DROP POLICY IF EXISTS "enrollment_records: admins update" ON public.enrollment_records;
CREATE POLICY "enrollment_records: admins update"
  ON public.enrollment_records
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "enrollment_records: admins delete" ON public.enrollment_records;
CREATE POLICY "enrollment_records: admins delete"
  ON public.enrollment_records
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

-- ── report_cards ──────────────────────────────────────────────────────────────
-- Mirrors assessments exactly. Parents read all of own children's report cards.
-- (No published_at column exists; uploads are assumed finalized at upload time.)
DROP POLICY IF EXISTS "report_cards: admins and teachers insert" ON public.report_cards;
CREATE POLICY "report_cards: admins and teachers insert"
  ON public.report_cards
  FOR INSERT
  TO authenticated
  WITH CHECK ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "report_cards: admins and teachers read" ON public.report_cards;
CREATE POLICY "report_cards: admins and teachers read"
  ON public.report_cards
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])));

DROP POLICY IF EXISTS "report_cards: admins and teachers update" ON public.report_cards;
CREATE POLICY "report_cards: admins and teachers update"
  ON public.report_cards
  FOR UPDATE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = ANY (ARRAY['org:admin'::text, 'org:teacher'::text])))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS "report_cards: admins delete" ON public.report_cards;
CREATE POLICY "report_cards: admins delete"
  ON public.report_cards
  FOR DELETE
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:admin'::text));

DROP POLICY IF EXISTS "report_cards: parents read own children" ON public.report_cards;
CREATE POLICY "report_cards: parents read own children"
  ON public.report_cards
  FOR SELECT
  TO authenticated
  USING ((school_id = current_school_id()) AND (current_org_role() = 'org:parent'::text) AND (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = report_cards.student_id
      AND s.school_id = current_school_id()
      AND current_clerk_user_id() = ANY (s.parent_user_ids)
  )));
