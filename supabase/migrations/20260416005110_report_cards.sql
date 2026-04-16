-- ============================================================
-- report_cards — historical report card / assessment document
-- uploads for a student. A report card may predate the student's
-- enrollment at the current school (imported PDFs from a prior
-- school), so academic_year / term / grade_level are descriptive
-- metadata only, not FKs to enrollment records.
-- ============================================================

CREATE TABLE IF NOT EXISTS report_cards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  academic_year  text NOT NULL,
  term           text,
  grade_level    text,
  storage_path   text NOT NULL,
  file_type      text NOT NULL DEFAULT 'application/pdf',
  uploaded_by    text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_report_cards_student
  ON report_cards(student_id)
  WHERE deleted_at IS NULL;

-- RLS: enable so service role is the only writer.
-- Parent/teacher reads flow through getStudentPortfolio (service role).
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
