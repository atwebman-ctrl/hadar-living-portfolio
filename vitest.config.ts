import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    // Default environment for .test.ts (API routes, lib utilities).
    // React component tests (.test.tsx) use // @vitest-environment jsdom
    // at the top of the file.
    environment: 'node',
  },
})
