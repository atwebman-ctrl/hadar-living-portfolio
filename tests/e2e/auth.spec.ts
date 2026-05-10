// ============================================================
// tests/e2e/auth.spec.ts
//
// Proves the @clerk/testing harness works end-to-end:
//   - global.setup.ts signed in as each role and persisted
//     storage state to .auth/<role>.json
//   - Each role can boot a fresh page using that storage state,
//     navigate to /dashboard, and the request is authenticated
//     (i.e. NOT redirected to /sign-in)
//
// This is intentionally narrow. Once it's green we know the
// rest of the suite can rely on `test.use({ storageState })`.
// Profile Builder, review queue, parent-view specs build on top.
// ============================================================

import { test, expect } from '@playwright/test'

const ROLES = ['admin', 'teacher', 'parent'] as const

for (const role of ROLES) {
  test.describe(`auth: ${role}`, () => {
    test.use({ storageState: `.auth/${role}.json` })

    test(`${role} can reach /dashboard`, async ({ page }) => {
      const resp = await page.goto('/dashboard')

      // Authenticated requests should land on /dashboard with a 2xx,
      // not bounce to /sign-in. Clerk's redirect would change the URL.
      expect(resp?.status(), 'response status').toBeLessThan(400)
      await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/)
    })
  })
}

test.describe('auth: anonymous', () => {
  // No storageState — clean context with no Clerk session.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated /dashboard redirects to /sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
