-- Add optional PDF/document storage path to assessments table.
-- Stores the Supabase Storage path for uploaded MAP score reports.
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS pdf_path text;
