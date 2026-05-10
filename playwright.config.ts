// ============================================================
// playwright.config.ts
//
// Two projects:
//   1. `setup` — runs tests/e2e/global.setup.ts once. Bootstraps
//      @clerk/testing, seeds the local Supabase, and produces
//      .auth/{admin,teacher,parent}.json storage-state files.
//   2. `chromium` — runs every spec under tests/e2e/ except the
//      setup file, with `setup` as a dependency so storage state
//      is always fresh before specs run.
//
// Specs that need a signed-in user declare:
//   test.use({ storageState: '.auth/teacher.json' })
// Specs that test public/unauthenticated flows omit storageState.
// ============================================================

import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({ path: path.resolve(__dirname, '.env.test'), override: true })

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
// Clerk treats 127.0.0.1 and localhost as different origins for cookie
// scope. The Next.js dev server binds both, but if we hit it on 127.0.0.1
// the browser never sends the cookies Clerk set for `localhost`, which
// triggers Clerk's "session token refresh redirect loop" defensive bail.
// Use localhost everywhere — it's the canonical dev hostname.
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: require.resolve('./tests/e2e/playwright.global-setup.ts'),
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts$/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /global\.setup\.ts$/,
    },
  ],
  webServer: {
    // The dev server must inherit .env.test, not .env.local. We pass it
    // through with dotenv-cli so getAuthContext + Supabase point at the
    // local container instead of prod.
    //
    // --webpack: Turbopack (the Next 16 default) drops Set-Cookie headers
    // emitted by clerkMiddleware on its handshake redirects, which traps
    // sign-in in an infinite redirect loop. Webpack mode preserves them.
    // Reassess once @clerk/nextjs publishes a Turbopack-compatible release.
    command: `npx dotenv -e .env.test -- npx next dev --webpack -p ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
