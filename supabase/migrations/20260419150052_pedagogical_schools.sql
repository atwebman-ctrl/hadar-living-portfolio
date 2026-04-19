-- ============================================================
-- Adds pedagogical_schools JSONB column to public.schools.
--
-- Each tenant defines its own pedagogical structure (e.g. Lower
-- School, Grammar School, School of Logic) that organizes grades
-- into buckets. The dashboard sidebar uses this to filter the
-- roster by school → grade.
--
-- Shape: [{ id: string, label: string, grades: string[], order: number }]
-- Empty array = treat all grades as one flat list.
-- ============================================================

alter table public.schools
  add column if not exists pedagogical_schools jsonb not null default '[]'::jsonb;

comment on column public.schools.pedagogical_schools is
  'Per-tenant definition of the pedagogical schools (e.g. Lower School, Grammar School, School of Logic) that organize grades. Shape: [{ id, label, grades, order }]. Empty array = treat all grades as one flat list.';
