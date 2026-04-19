// ============================================================
// playwright.config.ts
//
// Minimal config: chromium only, single worker, starts `next dev`
// before running. Tests live under tests/e2e/ and use .env.test
// for Supabase/Clerk env vars (loaded via dotenv at config time).
// ============================================================

import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({ path: path.resolve(__dirname, '.env.test'), override: true })

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
