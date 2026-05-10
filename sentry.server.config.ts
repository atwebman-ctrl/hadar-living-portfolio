// Sentry server-side init — loaded by instrumentation.ts on the
// Node runtime (API routes, server components, server actions).
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,

  // Free tier gives 10k perf units/month — keep prod sampling low.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Separates prod / preview / local in the Sentry UI.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // No DSN means no init at all — keeps test runs and DSN-less local
  // dev silent instead of throwing on every captureException call.
  enabled: Boolean(dsn),
})
