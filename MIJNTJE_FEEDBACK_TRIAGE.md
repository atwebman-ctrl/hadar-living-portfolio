# Mijntje's Detailed Test — Triage

**Source:** Mijntje's written walkthrough of Quire on 2026-04-20 (54 numbered items).
**Context:** Systematic click-through of the platform by COO-level user with no prior
context. First structured external QA pass on Quire since Tayler's Spring feedback.
**Triaged:** 2026-04-23. Revised 2026-04-23 after targeted codebase verification.

---

## Headline

About 70% of the 54 items collapse into five cross-cutting themes. Solve the
themes and the list shrinks dramatically. One real Tayler ↔ Mijntje conflict
(percentile color coding) — **resolved 2026-04-23, see commit e182b2a**.
Several items Mijntje classified as bugs turned out on inspection to be
deeper architectural gaps (see §"Architectural realities discovered during
verification" below). The session sequence has been re-scoped to match.

---

## Cross-cutting themes

Each theme folds in 3-10 individual items. Fixing the theme fixes the symptoms.

### Theme 1 — Sidebar persistence
Mijntje's biggest complaint by volume. Left sidebar disappears on Year in
Review, Notes, Settings, and sub-sections of individual student portfolio.
She cannot reground herself in the platform.

**Architectural reality (verified 2026-04-23):** There is no shared authenticated
layout today. `app/layout.tsx` is just `<ClerkProvider>` + font setup. There is
no `app/dashboard/layout.tsx` or `app/portfolio/layout.tsx`. The sidebar Mijntje
is missing is `PedagogicalSidebar`, which is rendered from within
`app/dashboard/StudentGrid.tsx:118` — i.e. it is content inside the dashboard
home page, not navigation chrome. Every other authenticated route
(`/dashboard/review-queue`, `/dashboard/settings`, `/portfolio/[studentId]/*`)
renders with no shell at all. This is not "sidebar persistence" — it's
"introduce a shared authenticated shell for the first time, and decide what
lives inside it."

**Fix:** New `AppShell` layout applied to an `(authenticated)` route group.
Decide whether the sidebar's contents are navigation (portfolio tabs, Quire
sections) or context (current sidebar's pedagogical-school + grade filters),
because those two things can't both live in the same slot. `PedagogicalSidebar`
as it exists is content-specific to the student roster view — it does not
generalize unmodified. Design decision needed before implementation.

**Items:** 1, 4, 8, 12, 14, 15.

### Theme 2 — Typography floor
"Font too small" appears at least six times. Teachers spend the day in
large-font kid materials; adult UI feels harder to read by contrast.

**Architectural reality:** `app/globals.css` defines font-family variables
only. **There is no font-size token scale** (no `--text-xs`/`--text-sm`/etc.).
Every component writes inline `fontSize: 15` or `fontSize: '0.9rem'` directly.
Top offenders have 15+ inline `fontSize` sites per file; across the components
tree this is roughly 200 touch points. "Establish tokens + audit" is not a
tweak — the token scale has to be built from zero, and the audit is a
multi-session refactor.

**Revised fix:** Build a font-size scale + refactor top-impact surfaces
(dashboard cards, hero strip, section titles, Canon rows) in Session D2.
Defer exhaustive audit across every inline style to post-demo.
**Items:** 17, 18, 23, 34, 38, 44.

### Theme 3 — Form consistency
Academic Year drop-down should come before Term. MAP / AVANT / Character
Award pop-ups should share layout so teachers don't re-learn each form.

**Architectural reality:** **No shared `Modal` / `Dialog` / `Form` primitive
exists.** Every form (12+ of them: 7 `Inline*Form` components + `AddStudentForm`
+ `EditStudentForm` + `ParentUploadForm` + `NoteSlideOver` + `InviteParentButton`)
rolls its own modal shell, style-constant block, and error display. Each defines
`const S = { input, label, btn }` locally with slightly-different tokens.

**Revised fix (two shapes):**
- **Demo-scope:** standardize field **order** (Academic Year → Term → Score →
  Percentile) and title-bar style across the MAP / AVANT / Character forms.
  Accept structural duplication. 2-3 hrs.
- **Post-demo:** extract `<FormShell>` + `<FormField>` + `<Modal>` primitives
  and migrate incrementally. 5-6 hrs.

**Items:** 33, 41, 46.

### Theme 4 — Add-note consistency
Add-note is yellow in Math, white in English; prominent in some places,
"looks like text" in others. Mijntje also proposes a floating always-visible
notes button that pre-populates with current student context.

**Architectural reality:** Smaller than originally framed. There is **one**
inline form (`InlineTeacherNoteForm`), **one** global slide-over
(`NoteSlideOver`, already wired on the dashboard), and **one** dashboard mode
(`QuickNotesMode`). The "yellow vs. white vs. text-like" inconsistency is not
in the form itself — it's in the **trigger button** styling inside each
parent section (`MathSection`, `EnglishSection`, `HebrewSection` etc.), which
each style the open-form button with their own inline styles.

**Revised fix:**
- Trigger-button standardization across sections (1-2 hrs, pure styling).
- Floating-button promotion: `NoteSlideOver` already exists; promoting it to
  AppShell is blocked on Session D (shell must exist) **and** the Notes+YiR
  merger decision (which determines what the floating button actually saves).

**Items:** 22, 31, 40, 47.

### Theme 5 — Logo / header standardization
Top-left should be Quire logo (as home button); top-right should be school
logo. Heights should match. Consistent across entire platform.

**Fix:** Shared header component in AppShell layout (depends on Session D).
**Items:** 2, 16.

---

## Resolved conflicts

### Percentile color coding — Tayler vs Mijntje (Mijntje #21)
**Tayler:** Color-code percentiles. 95+ dark, 50-80 gold, <50 red.
**Mijntje:** Don't color-code. Red invites parent anxiety. Puts tests on a
pedestal. Per-tenant thresholds create complexity. Not demo-critical.

**Decision:** Two-tier scheme (Option B). 95+ → gold (celebration). All
else → neutral ink. Null → ink-mid.

**Rationale:** Keeps Tayler's celebration signal for top performers. Drops
Mijntje's parent-panic concern on the red case. Avoids per-tenant
configuration complexity. Re-visit with Tayler if/when a school requests
a variant.

**Status:** Shipped 2026-04-23 (commit e182b2a, verified on main). Helper at
`lib/percentileColor.ts`. Tests at `lib/percentileColor.test.ts` (9/9 passing).

---

## Demo-readiness tiers

Lens: classical school demos starting in ~1-2 weeks. What would embarrass
us in front of a prospect?

### Tier 1 — Must-fix before any external demo (embarrassment risk)
Broken functionality a prospect would hit in the first 10 minutes. Revised
with verification-pass findings — several items are bigger or differently-
shaped than the first-pass description suggested.

| # | Item | Real root cause + fix shape |
|---|------|---|
| 10 | Add Student silent fail | **DB schema mismatch.** Form and API both surface errors correctly — `AddStudentForm.tsx:166-170` displays `apiError`. The POST handler at `app/api/dashboard/students/route.ts:130-145` returns a generic 500 `'Failed to create student record.'` when the insert fails. Insert payload includes `gender`, `date_of_birth`, `enrollment_status`, `updated_at` — columns from the ghost-migration range (CLAUDE.md flags 0001-0014 as possibly unapplied). Prod DB likely missing one of them. **Fix:** audit prod `students` columns, ship idempotent migration adding any missing ones, then consider surfacing `dbError.message` during staging only. **Budget: 1-2h.** |
| 5 | Add Milestone button | **Feature unbuilt end-to-end** — no DB table, no API route, UI is a `<button disabled>` inside a placeholder view (`components/dashboard/YearInReviewView.tsx`, line 4 comment confirms). This is not a wiring bug. Building standalone milestone infrastructure before the Notes+YiR merger decision (Tier 4) would create throw-away work. **Fix:** remove the button, keep the empty-state text. Revisit as part of the Notes+YiR architecture conversation. **Budget: 5 min.** |
| 53 | Lost Compass 404 on Gallery | Diagnose before fixing. `public/images/compass.png` exists. The demo item in `ParentUploads.tsx:52` has `publicUrl: null, showImg: false` — so the 404 is coming from a different code path. Reproduce the exact failure and trace its src before patching. |
| 25 | Canon book covers slow / Aladdin missing | **Architecture-level problem.** `CanonBookDetail.tsx:60` builds covers as live title-based lookups against Open Library (`covers.openlibrary.org/b/title/{title}-M.jpg`). No cache, no retry, no `onError` fallback. Title-based lookups on OL are known-flaky. Aladdin specifically: the seed uses `'Aladdin and the Arabian Nights'` but other scripts reference `'Aladdin & other Stories from the Arabian Nights'` — **title drift inside our own data**. Three fix paths: (a) add `onError` fallback rendering a title-card placeholder + fix Aladdin's seed title — **30-60 min demo fix**, (b) switch to ISBN/OLID lookup — 2-3 hrs, requires ISBN column, (c) upload covers to Supabase storage with manual mapping — several hours, correct long-term. **Recommend (a) for demo.** |
| 49 | Teacher Journal categories don't match rest of platform | **Schema legacy with embedded product call.** `TeacherJournal.tsx:14-37` has 18 labels across 7 new `section_category` values + 11 legacy `section_type` values, including obsolete tabs ("Rhetoric Room", "Knowledge") and omitting "English" entirely. Line 15 comment confirms this is copied from `TeacherNotes.tsx` "until TeacherNotes is retired" (retirement plan undefined). Legacy values are real data from pre-migration notes. Remapping needs a product call — e.g. should legacy `handwriting` notes now bucket under "Composition"? **Blocked on Tayler/Dr. Worth conversation**, then 1-2h to collapse to the current 5-tab taxonomy + centralize into `lib/` so both files stop drifting. |
| 51 | "View in Context" buttons don't work | **Verify before fixing.** `components/portfolio/TeacherJournal.tsx:133-147` intentionally renders a disabled span when a note has no computed `href` (no section context). Mijntje may have hit legitimately-disabled links, not broken ones. Alt: href-generation is dropping cases it should handle. Reproduce with a specific note before treating as bug. |
| 54 | Gallery upload silent fail + no size limit communicated | **Two-layer problem.** API (`app/api/dashboard/students/[studentId]/uploads/route.ts:32,92-97`) caps at 20 MB and returns a descriptive 413. Client (`components/shared/UploadButton.tsx:125-133,190-202`) surfaces server errors. **But** no client-side pre-validation, no UI text announcing the limit, and **probable platform body-size limit** (Vercel default ~4.5 MB for serverless functions) — a 20 MB POST never reaches the handler, XHR falls back to generic `'Upload failed'`. **Demo fix:** add client-side `file.size` pre-check against a shared const + visible limit hint (15 min) **and** raise the route's body limit via Next.js route config **or** switch to direct-to-Supabase signed URLs (longer, correct long-term). **Budget: ~1h for the demo fix; signed-URL migration is post-demo.** |
| 36 | Hebrew handwriting samples not loading | **Different mechanism than #25** — this resolves through Supabase storage (`lib/getStudentPortfolio.ts:223-226` via `storagePublicUrl(imagePath)`). Needs diagnosis before fix. Three possibilities: (a) no real Hebrew handwriting seeded for Athena — falls back to demo placeholders with null `imageUrl` (`HandwritingSamples.tsx:19-23`), (b) rows exist but `image_path` is null, (c) `portfolio-assets` bucket isn't serving the path. Start by checking what's in the `handwriting_samples` table. **Budget: 30-90 min depending on cause.** |

(Note: #15 — stuck active state on sidebar — **moved out of Tier 1**. Folded into
Session D: the sidebar rebuild replaces `aria-current` logic wholesale, making
a standalone fix throwaway work.)

### Tier 2 — Cross-cutting polish (high leverage)
One well-scoped refactor solves many Mijntje items at once.

- Theme 1 (sidebar persistence — new layout, see Session D)
- Theme 2 (typography floor — build token scale from scratch)
- Theme 3 (form field ordering — demo-scope version)
- Theme 4a (trigger-button styling consistency)
- Theme 5 (logo/header standardization)
- Canon stats ordering + title + star rating fix (24, 27, 29)

### Tier 3 — Real feedback, not demo-critical
Polish that can ship post-first-demo.

- MAP assessment form cleanup (41) — bug + polish combo
- AVANT graph colors (35)
- Soulcraft awards click-through (45)
- Handwriting upload UX (37) — fold into Tayler's Composition+Handwriting merger
- "Manage Catalog" role-gating (28)
- Canon viewing pane redesign (26)
- Form consistency right-fix (extract FormShell primitive — Theme 3 post-demo)

### Tier 4 — Architecture decisions (do NOT rush)
Needs dedicated design session, probably with Tayler and/or Dr. Worth.

- **Notes + Year in Review merger (5, 7, 22)** — Mijntje's best structural idea.
  Teachers input once; platform sorts into milestone vs observation.
  Downstream effects on global notes button, Teacher Journal, published profile,
  and the Add Milestone feature (#5). Do not build standalone milestone infra
  before this conversation.
- **Settings expansion (13)** — admin persona work. Users, notifications,
  support contact, school name immutability.
- **Collapsible sidebar submenus (39)** — improves power-user navigation.
- **Math categories like English has (32)** — product question for Tayler + Dr. Worth.

---

## Dependencies

- **Session D1 design → before any Tier 2 nav/shell work.** Otherwise we
  wire twice.
- **Typography token scale → before per-section font tweaks.** One source
  of truth, then targeted audit.
- **Notes+YiR merger decision → before global floating notes button and
  before #5 milestone feature build.**
- **Tayler/Dr. Worth call on legacy journal categories → before #49 fix.**

---

## Proposed session sequence

~2 weeks to demo-readiness. Revised with verification-pass findings.

| Session | Scope | Estimate |
|---------|-------|----------|
| B (done) | Percentile revert ✅ | Shipped e182b2a |
| C | Tier 1 bugs (8 items after #15 moved out) — #10 migration audit, #5 button removal, #53 diagnosis, #25 onError + seed fix, #51 verify, #54 client validation + body-limit fix, #36 diagnosis + fix; **#49 blocked on Tayler call** | 5-7 hours active work + one Tayler conversation, likely split across 2 sittings |
| D1 | Design session: shell architecture, two-zone sidebar (nav vs. context), route group structure. Possibly no code. | 1-2 hours |
| D2 | Implementation: AppShell + route migration + font-size token scale + refactor top-impact surfaces | 6-8 hours |
| E | Trigger-button note consistency + form field ordering (demo-scope) + logo/header standardization | 3-4 hours |
| F (with Tayler's Tier 2) | Composition + Handwriting merger + Mijntje 36/37/43 | 4-5 hours |

**Session D split rationale:** The doc originally estimated Session D at 3-4
hours. Verification found there is no shared authenticated layout today and no
font-size token scale. D1 separates the design decisions (what goes in the
shell, how PedagogicalSidebar decomposes, whether to use a route group) from
the implementation work, because getting those wrong forces a second pass.

Architecture decisions (Notes+YiR, Settings expansion, viewing pane) —
separate design conversations, scheduled after first demo.

---

## Architectural realities discovered during verification

Findings from the 2026-04-23 verification pass that shape how to approach the
remaining work. These aren't items to fix directly — they're the ground truth
the plan has to account for.

1. **No shared authenticated layout exists.** `app/layout.tsx` is just
   `<ClerkProvider>` + fonts. Every dashboard and portfolio sub-route is a
   standalone page. Mijntje's "sidebar disappears" complaint is accurate at
   the mechanism level, not just the UX level.

2. **`PedagogicalSidebar` is page content, not chrome.** Rendered from
   `StudentGrid.tsx:118`. Its contents (pedagogical-school + grade filter)
   are specific to the roster view. It cannot be lifted into a shared shell
   unchanged — a product decision is needed about what the sidebar contains
   on portfolio / review-queue / settings routes.

3. **No font-size token scale.** `app/globals.css` has only font-family
   variables. Every component writes inline `fontSize` strings. ~200 touch
   points across the codebase. Theme 2's "enforce tokens" framing
   understates scope by an order of magnitude.

4. **No shared Modal / Form primitive.** 12+ forms each roll their own
   modal shell, style-constant block, and error display. Theme 3's "reuse
   a shared form shell" assumes a shell exists.

5. **Open Library cover lookup is fundamentally unreliable.** Title-based,
   cached only by the browser, no fallback. This is the real cause of both
   "slow covers" and "missing Aladdin" — not isolated bugs.

6. **CLAUDE.md's ghost-migration warning under-guards current code.** The
   Add Student route has a comment explicitly omitting `profile_photo_path`
   and `summary` because migrations 0011/0019 "may not be applied" — but the
   same insert then writes `gender`, `date_of_birth`, `enrollment_status`,
   `updated_at`, which are from the same ghost range. #10's "silent fail"
   is the predictable consequence. The guard needs to be applied more
   consistently, or the migration audit finished for real.

7. **`TeacherNotes.tsx` vs. `TeacherJournal.tsx` is two-file maintenance
   with an undefined retirement plan.** `TeacherJournal.tsx:15` says
   `SECTION_LABELS` is "copied from TeacherNotes.tsx so the two stay in
   lockstep until TeacherNotes is retired." No owner, no deadline, and both
   files are live in the product. Resolving #49 should include a decision
   on which file survives.

---

## Open product questions (for Tayler / Dr. Worth)

1. Notes + Year in Review — one page with observation/milestone toggle?
2. Math monitoring categories — what maps to English's spelling/grammar/composition?
3. Invite-parent use case and frequency?
4. Board members as a user role (viewer-only admin)?
5. Support contact surface — email form, or external?
6. Legacy Teacher Journal categories — how should `handwriting`, `writing`,
   `rhetoric`, `scope_sequence`, `academic_progress`, `social_development`,
   `behavioral`, `participation` remap to the current 5-tab taxonomy?

---

## Cleanup items noticed during verification

Small hygiene items discovered while investigating the main findings.
Non-blocking; roll into a sweep when convenient.

- **Dead `parentUserIds` prop in Add Student schema.** `app/api/dashboard/students/route.ts:120`
  defaults `parent_user_ids: input.parentUserIds ?? []`, but `AddStudentForm.tsx`
  has no such field. The Zod schema carries a prop nothing fills. Remove the
  field from `CreateStudentSchema` or drop the default.
- **`TeacherNotes.tsx` retirement undefined.** Both `TeacherNotes.tsx` and
  `TeacherJournal.tsx` are live. The comment in Journal says Notes will be
  retired, but there's no timeline. Fold into #49 resolution.
- **`UploadButton` accepts a MIME filter that's client-only.** `accept="image/*"`
  hints the file picker, but there's no server-side MIME check in the uploads
  route. A malicious or broken client could send any file type within the
  20 MB limit. Add a server-side content-type allowlist.

---

## Appendix — Full item-to-bucket mapping

Every Mijntje item classified by tier + theme.

**Tier 1 (must-fix):** 5, 10, 25, 36, 49, 51, 53, 54
**Folded into Session D:** 15 (sidebar active state — replaced by shell rebuild)
**Tier 2 (cross-cutting):** 1, 2, 4, 8, 12, 14, 16, 17, 18, 22, 23, 24, 27,
29, 31, 33, 34, 38, 40, 41, 44, 46, 47
**Tier 3 (post-demo polish):** 28, 35, 37, 45
**Tier 4 (architecture decisions):** 7, 13, 32, 39
**Resolved:** 21 (percentile coloring — commit e182b2a)

Sub-items not individually listed but inherit their parent's tier:
3, 6, 9, 11, 19, 20, 26, 30, 42, 43, 48, 50, 52.
