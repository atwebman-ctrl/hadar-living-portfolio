// ============================================================
// tests/e2e/playwright.global-setup.ts
//
// Wired into playwright.config.ts via the `globalSetup` hook.
// Runs ONCE in the orchestrator process before any workers spawn,
// so env vars set here (notably CLERK_FAPI) are inherited by every
// worker. This is the canonical place for `clerkSetup()` — calling
// it from a setup-project test races worker isolation and produces
// "clerkSetup function … called during global setup" errors in
// downstream sign-in tests.
//
// Two jobs:
//   1. Force-load .env.test into process.env so subsequent imports
//      see the real Clerk dev keys, not whatever is in .env.local.
//   2. Call clerkSetup() to fetch a Testing Token from Clerk's API
//      and stash the Frontend API URL in process.env.CLERK_FAPI.
// ============================================================

import { clerkSetup } from '@clerk/testing/playwright'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

export default async function globalSetup() {
  loadEnv({ path: path.resolve(__dirname, '../../.env.test'), override: true })
  await clerkSetup()
}
