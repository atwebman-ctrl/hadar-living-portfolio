// Sentry client-side init — bundled into the browser. The DSN must
// use the NEXT_PUBLIC_ prefix to be accessible client-side.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  enabled: Boolean(dsn),

  // Replays let us see a recording of the user session leading up to
  // the error. Free tier includes 50 replays/month — only record on
  // error in prod, sample 5% of regular sessions to catch silent issues.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default — student PII must never
      // leave the school's tenant.
      maskAllText:    true,
      blockAllMedia:  true,
    }),
  ],
})
