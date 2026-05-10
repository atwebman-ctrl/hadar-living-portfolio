// ============================================================
// tests/e2e/profileBuilder.spec.ts
//
// Profile Builder happy path — exercises the multi-role review
// state machine end-to-end:
//
//   1. A profile is seeded in `in_review` status (skipping the
//      teacher's per-section UI since that surface is covered by
//      unit + integration tests).
//   2. Admin (Dr. Worth) signs in, opens /dashboard/review-queue,
//      clicks into the seeded profile, and clicks Approve & Publish.
//   3. Parent signs in (storage state) and lands on the published
//      portfolio for that student — proving the published-state
//      RLS + parent_students linkage are wired correctly.
//
// Auth comes from .auth/<role>.json storage state files produced
// by global.setup.ts. Fixture rows are created service-role and
// torn down in afterAll.
// ============================================================

import { test, expect } from '@playwright/test'
import { seedReadyProfile, cleanupProfileFixture, type ProfileFixture } from './helpers/profileFixtures'
import { clerkUserIdByEmail } from './helpers/clerkUsers'
import { seedE2eSchool } from './helpers/seedE2eSchool'

let fixture: ProfileFixture

test.beforeAll(async () => {
  const school = await seedE2eSchool()
  const parentEmail = required('E2E_PARENT_EMAIL')
  const parentClerkUserId = await clerkUserIdByEmail(parentEmail)
  fixture = await seedReadyProfile({
    schoolId: school.id,
    parentClerkUserId,
    parentEmail,
  })
})

test.afterAll(async () => {
  if (fixture) await cleanupProfileFixture(fixture)
})

test('admin approves in_review profile, parent then sees it published', async ({ browser }) => {
  // ── Admin: review queue → preview → Approve & Publish ──────
  const adminCtx  = await browser.newContext({ storageState: '.auth/admin.json' })
  const adminPage = await adminCtx.newPage()

  await adminPage.goto('/dashboard/review-queue')
  await expect(adminPage.getByRole('heading', { name: /Profiles awaiting your review/ }))
    .toBeVisible()

  // The list renders one Link per pending profile, with the student's
  // first + last name as the heading. Match by last_name (unique per run).
  await adminPage.getByRole('link', { name: new RegExp(fixture.studentLastName) }).click()
  await expect(adminPage).toHaveURL(new RegExp(`/dashboard/review-queue/${fixture.profileId}`))

  // Approve uses a native confirm() — auto-accept it before clicking.
  adminPage.once('dialog', (d) => d.accept())
  await adminPage.getByRole('button', { name: /Approve & Publish/ }).click()

  // After approval the action bar's loading state ('Approving…') resolves
  // and the page revalidates. Wait for the network to settle before moving on.
  await adminPage.waitForLoadState('networkidle')
  await adminCtx.close()

  // ── Parent: portfolio hub renders for the now-published student ──
  const parentCtx  = await browser.newContext({ storageState: '.auth/parent.json' })
  const parentPage = await parentCtx.newPage()

  await parentPage.goto(`/portfolio/${fixture.studentId}`)
  // No redirect to /sign-in (parent_students linkage holds) and the
  // hub renders the student's name somewhere. The last name appears in
  // multiple places (SideNav + body), so .first() avoids strict-mode failures.
  await expect(parentPage).toHaveURL(new RegExp(`/portfolio/${fixture.studentId}`))
  await expect(parentPage.getByText(fixture.studentLastName).first()).toBeVisible()

  // Direct link to the full published profile must also resolve (status='published').
  await parentPage.goto(`/portfolio/${fixture.studentId}/full/${fixture.profileId}`)
  await expect(parentPage).not.toHaveURL(/\/sign-in/)

  await parentCtx.close()
})

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing E2E env var: ${name}`)
  return v
}
