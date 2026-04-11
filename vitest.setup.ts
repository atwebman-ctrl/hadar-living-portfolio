// Global test setup — mocks Next.js server-only APIs that throw outside
// the Next.js runtime. All test files inherit these mocks automatically.

import { vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidateTag:   vi.fn(),
  unstable_cache:  vi.fn((fn: () => unknown) => fn),
  revalidatePath:  vi.fn(),
}))
