-- 0007_book_catalog.sql
-- School-wide book catalog for The Canon / reading list picker.
-- Teachers add approved titles here; ReadingForm lets teachers select
-- a book from the catalog to auto-fill title and author.

CREATE TABLE book_catalog (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           uuid        NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  title               text        NOT NULL,
  author              text        NOT NULL,
  grade_level         text        NOT NULL,
  year_published      int,
  page_count          int,
  learning_objectives text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX book_catalog_school_id_idx ON book_catalog(school_id);
-- Case-insensitive title search index
CREATE INDEX book_catalog_title_lower_idx ON book_catalog(school_id, lower(title));

ALTER TABLE book_catalog ENABLE ROW LEVEL SECURITY;

-- All school members (admin, teacher, parent) may read the catalog
CREATE POLICY "school members read book_catalog"
  ON book_catalog FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_members
      WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Only admin and teacher may add books
CREATE POLICY "teacher insert book_catalog"
  ON book_catalog FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_members
      WHERE clerk_user_id = auth.uid()::text
        AND role IN ('admin', 'teacher')
    )
  );
