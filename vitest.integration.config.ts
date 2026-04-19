import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

// Load .env.test BEFORE the config evaluates so the integration
// suite never accidentally inherits .env.local (which points at prod).
loadEnv({ path: path.resolve(__dirname, '.env.test'), override: true })

// Integration tests — hit the local Supabase container on port 54321.
// Slower than the unit suite; run separately via `npm run test:integration`.
// The unit suite (vitest.config.ts) continues to run offline.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./vitest.integration.setup.ts'],
    // Integration tests share a live DB; run serially to avoid row collisions.
    // Vitest 4 flattened the old poolOptions; `pool: 'forks'` + the top-level
    // `maxConcurrency: 1` is the replacement for singleFork.
    pool: 'forks',
    fileParallelism: false,
    maxConcurrency: 1,
    // Give the DB round-trips headroom.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
