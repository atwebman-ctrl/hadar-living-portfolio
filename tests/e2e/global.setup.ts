// ============================================================
// tests/e2e/global.setup.ts
//
// Runs in the `setup` project before any spec. Two jobs:
//   1. Seed the local Supabase with a school row linked to the
//      Clerk test org (idempotent — re-runs are no-ops).
//   2. Sign in as each of the three test users (admin / teacher /
//      parent) and persist their storage state to disk so specs
//      can start authenticated without re-running the sign-in flow.
//
// `clerkSetup()` is intentionally NOT called here — it runs in
// playwright.global-setup.ts (the Playwright globalSetup hook),
// which fires before any worker spawns so the resulting CLERK_FAPI
// env var is inherited by every test process.
//
// Specs declare which role they want via:
//   test.use({ storageState: '.auth/teacher.json' })
// ============================================================

import { test as setup, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'
import { seedE2eSchool } from './helpers/seedE2eSchool'
import path from 'node:path'
import fs from 'node:fs'

const AUTH_DIR = path.resolve(__dirname, '../../.auth')

setup('seed school', async () => {
  await seedE2eSchool()
  fs.mkdirSync(AUTH_DIR, { recursive: true })
})

const ROLES = [
  { role: 'admin',   emailVar: 'E2E_ADMIN_EMAIL',   passVar: 'E2E_ADMIN_PASSWORD'   },
  { role: 'teacher', emailVar: 'E2E_TEACHER_EMAIL', passVar: 'E2E_TEACHER_PASSWORD' },
  { role: 'parent',  emailVar: 'E2E_PARENT_EMAIL',  passVar: 'E2E_PARENT_PASSWORD'  },
] as const

for (const { role, emailVar, passVar } of ROLES) {
  setup(`sign in as ${role}`, async ({ page }) => {
    const identifier = required(emailVar)
    const password   = required(passVar)

    // The sign-in page hosts the Clerk widget; navigating here lets
    // @clerk/testing's helpers bind to the in-page Clerk instance.
    //
    // NOTE: each Clerk test user must have `bypass_client_trust: true`
    // set via the Backend API (PATCH /v1/users/{id}). Without it Clerk's
    // adaptive-MFA fires on every Playwright run (fresh browser context
    // = "new device"), the sign-in completes the password factor but
    // returns status `needs_second_factor`, and no session cookie is
    // ever set. See CLAUDE.md → "E2E Clerk setup" for the full curl.
    await page.goto('/sign-in')
    await clerk.signIn({ page, signInParams: { strategy: 'password', identifier, password } })

    // Land on /dashboard so the org context resolves before we snapshot.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)

    await page.context().storageState({ path: path.join(AUTH_DIR, `${role}.json`) })
  })
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `Missing E2E env var: ${name}. ` +
      `Fill in .env.test with the Clerk dev test users (see CLAUDE.md → E2E setup).`,
    )
  }
  return v
}
