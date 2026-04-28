-- Reconcile audit-column drift on handwriting_samples and photos.
-- These columns exist in prod (added via Supabase dashboard SQL editor)
-- but were never captured in source migrations.
--
-- Verbatim attributes pulled from prod via information_schema.columns and
-- pg_constraint on Apr 27, 2026.
--
-- Coverage:
--   handwriting_samples: created_by, updated_by, updated_at, deleted_at
--   photos:              term, category, updated_at, updated_by, deleted_at
--   photos_category_check CHECK constraint
--
-- Refs: schema drift audit, Apr 27, 2026.
-- Pattern follows 20260426183432_reconcile_parent_uploads.sql.

-- ── handwriting_samples ──────────────────────────────────────────────────────
ALTER TABLE public.handwriting_samples
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ── photos ───────────────────────────────────────────────────────────────────
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS term text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ── photos_category_check ────────────────────────────────────────────────────
-- Verbatim from prod pg_constraint definition.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'photos_category_check'
      AND conrelid = 'public.photos'::regclass
  ) THEN
    ALTER TABLE public.photos
      ADD CONSTRAINT photos_category_check
      CHECK ((category = ANY (ARRAY[
        'classroom'::text,
        'field_trip'::text,
        'project'::text,
        'performance'::text,
        'celebration'::text,
        'portrait'::text,
        'other'::text
      ])));
  END IF;
END $$;
