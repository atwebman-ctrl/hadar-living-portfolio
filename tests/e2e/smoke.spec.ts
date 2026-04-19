// ============================================================
// tests/e2e/smoke.spec.ts
//
// Minimal end-to-end smoke: boot next dev, fetch the public
// landing page, assert it rendered. Proves the Playwright +
// Next.js pipeline is wired up. Future specs build on this.
// ============================================================

import { expect, test } from '@playwright/test'

test('landing page renders', async ({ page }) => {
  const resp = await page.goto('/')
  expect(resp?.status()).toBe(200)
  const title = await page.title()
  expect(title.length).toBeGreaterThan(0)
})
