import { cookies } from 'next/headers'
import DemoPortfolio from './DemoPortfolio'
import DemoGate from './DemoGate'

// Server component — no 'use client'.
// Checks the demo_session cookie before rendering the portfolio.
// The cookie is set by /api/demo/auth after password validation.
export default async function DemoPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('demo_session')
  const isAuthenticated = session?.value === 'authenticated'

  if (!isAuthenticated) {
    return <DemoGate />
  }

  return <DemoPortfolio />
}
