// ============================================================
// tests/e2e/helpers/clerkUsers.ts
//
// Looks up a Clerk user's id by email via the Backend API. Used
// by fixtures that need to pre-link a parent_students row to the
// real parent test user without hardcoding the user_id (which
// changes if Clerk users are re-provisioned).
// ============================================================

export async function clerkUserIdByEmail(email: string): Promise<string> {
  const secret = requireEnv('CLERK_SECRET_KEY')
  const url = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
  if (!res.ok) {
    throw new Error(`Clerk user lookup failed (${res.status}): ${await res.text()}`)
  }
  const users = await res.json()
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`No Clerk user found for email "${email}"`)
  }
  return users[0].id as string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}
