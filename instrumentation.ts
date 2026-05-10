// Next.js calls this on server/edge boot. We branch on runtime
// because Sentry's server and edge SDKs are different packages
// and the client config is loaded separately by withSentryConfig.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
