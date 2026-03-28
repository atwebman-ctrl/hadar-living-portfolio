import { NextRequest, NextResponse } from 'next/server'

// POST /api/demo/auth
// Validates the demo password against the DEMO_PASSWORD env var.
// On success, sets an httpOnly cookie and returns 200.
// The actual password value is never logged or returned.
export async function POST(req: NextRequest) {
  const demoPassword = process.env.DEMO_PASSWORD

  if (!demoPassword) {
    console.error('DEMO_PASSWORD env var is not set')
    return NextResponse.json(
      { error: 'Demo access is not configured.', code: 'DEMO_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).password !== 'string'
  ) {
    return NextResponse.json(
      { error: 'password is required.', code: 'MISSING_PASSWORD' },
      { status: 400 }
    )
  }

  const submitted = (body as { password: string }).password

  // Constant-time string comparison to avoid timing attacks.
  // Passwords are short so this is a simple character-by-character compare
  // padded to equal length.
  if (!timingSafeEqual(submitted, demoPassword)) {
    return NextResponse.json(
      { error: 'Incorrect password.', code: 'INVALID_PASSWORD' },
      { status: 401 }
    )
  }

  const res = NextResponse.json({ ok: true }, { status: 200 })

  res.cookies.set('demo_session', 'authenticated', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    // Session cookie — expires when the browser closes.
    // Set maxAge if you want it to persist across sessions.
    path: '/',
  })

  return res
}

// Simple constant-time comparison for short strings.
// Avoids early exit that could reveal password length via timing.
function timingSafeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  const paddedA = a.padEnd(maxLen, '\0')
  const paddedB = b.padEnd(maxLen, '\0')
  let mismatch = a.length !== b.length ? 1 : 0
  for (let i = 0; i < maxLen; i++) {
    mismatch |= paddedA.charCodeAt(i) ^ paddedB.charCodeAt(i)
  }
  return mismatch === 0
}
