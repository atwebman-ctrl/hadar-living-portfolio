import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Org + project are needed for source-map upload. Auth token is
  // read from SENTRY_AUTH_TOKEN env var (set in Vercel, never committed).
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress source map upload logs during build (CI-friendly).
  silent: !process.env.CI,

  webpack: {
    // Tree-shake Sentry's verbose logger statements in production builds.
    treeshake: { removeDebugLogging: true },
    // Don't auto-create Vercel cron monitors (we don't use them yet).
    automaticVercelMonitors: false,
  },

  // Delete uploaded source maps from the client bundle after upload —
  // readable stack traces in Sentry, not in browser devtools.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
})
