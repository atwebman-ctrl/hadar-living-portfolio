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
  // Suppresses source map upload logs during build
  silent: true,
  // Disables automatic release creation — we'll wire this up when Sentry org/project are set
  disableLogger: true,
  // Automatically tree-shake Sentry logger statements in production
  automaticVercelMonitors: false,
})
