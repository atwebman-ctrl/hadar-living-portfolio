// One-shot Sentry smoke test endpoint. Hit /api/sentry-test after
// deploy to confirm the server-side SDK is wired up; the captured
// error should appear in the Sentry dashboard within ~30 seconds.
// Safe to leave deployed — does nothing except throw.
export async function GET() {
  throw new Error('Sentry smoke test — server route')
}
