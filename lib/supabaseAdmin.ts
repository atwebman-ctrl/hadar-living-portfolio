import { createClient } from "@supabase/supabase-js";

// ⚠️  SERVER-SIDE ONLY — never import this in client components.
// The service role key bypasses RLS. This file must only ever be
// imported inside app/api/ routes, which run exclusively on the server.
//
// Rule enforced in CLAUDE.md and verified by:
//   grep -r "supabaseAdmin" --include="*.tsx" | grep -v "app/api/"
//   → should return nothing

if (typeof window !== "undefined") {
  throw new Error(
    "supabaseAdmin must not be imported in client-side code. Move your data access into an API route."
  );
}

export const supabaseAdmin = createClient(
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
