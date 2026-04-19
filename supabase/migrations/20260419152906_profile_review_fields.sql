-- Adds the two columns the Dr. Worth Review Queue needs on profiles:
--   review_feedback — text left by the reviewer when they return a profile
--                     to draft for changes. Cleared on submit and on approve.
--   reviewed_at     — timestamp of the last review action (approve or
--                     request-changes). Sibling to reviewed_by, which already
--                     exists from the initial profile_builder migration.
--
-- The profiles.status CHECK constraint already allows 'in_review' — no change
-- needed there.

alter table profiles
  add column if not exists review_feedback text,
  add column if not exists reviewed_at     timestamptz;

comment on column profiles.review_feedback is
  'Reviewer feedback attached when returning an in_review profile to draft. Cleared on next submit or on approval.';

comment on column profiles.reviewed_at is
  'Timestamp of the last review action (approve or request-changes).';
