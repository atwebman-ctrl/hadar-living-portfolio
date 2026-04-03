import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ⚠️  SERVER-SIDE ONLY — never import this in client components.
// The service role key bypasses RLS. This file must only ever be
// imported inside app/api/ routes, lib/ server helpers (e.g. auth.ts,
// getStudentPortfolio.ts), and server components — never in 'use client' files.
//
// Rule enforced in CLAUDE.md and verified by:
//   grep -r "supabaseAdmin" --include="*.tsx" | grep -v "app/api/"
//   → should return nothing
//
// The client is lazy-initialized on first access so that importing this
// module at build time (e.g. during Next.js static analysis) does not
// throw when SUPABASE_SERVICE_ROLE_KEY is absent from the build environment.

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "supabaseAdmin must not be imported in client-side code. Move your data access into an API route."
    );
  }

  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          // Disable session persistence — this is a server-only client
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return _client;
}

// Proxy so all existing callsites (`supabaseAdmin.from(...)`) work unchanged.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getClient()[prop as keyof SupabaseClient];
  },
});
