import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "./supabaseAdmin";
import type { UserRole } from "./types";

// ============================================================
// lib/auth.ts — Clerk helpers for server-side auth context
//
// All functions are async and must only be called in:
//   - API route handlers (app/api/)
//   - Server components
//   - middleware.ts
//
// NEVER call these in client components.
// ============================================================

// Cache school_id lookups for the duration of the request.
// This avoids redundant DB round-trips when multiple helpers
// are called in the same API route.
const schoolIdCache = new Map<string, string>();

/**
 * Returns the school_id for the authenticated user's Clerk org.
 * Throws if the user is not authenticated or their org has no
 * matching school record.
 */
export async function getSchoolId(): Promise<string> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("AUTH_NO_ORG: User is not a member of any organization.");
  }

  if (schoolIdCache.has(orgId)) {
    return schoolIdCache.get(orgId)!;
  }

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  if (error || !data) {
    throw new Error(
      `AUTH_NO_SCHOOL: No school found for Clerk org ${orgId}. Has the school been provisioned?`
    );
  }

  schoolIdCache.set(orgId, data.id);
  return data.id;
}

/**
 * Returns the authenticated user's Clerk user ID.
 * Throws if unauthenticated.
 */
export async function getUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("AUTH_UNAUTHENTICATED: No active Clerk session.");
  }

  return userId;
}

/**
 * Returns the user's role within their organization.
 * Clerk org roles map directly to UserRole: admin | teacher | parent.
 * Throws if the role is missing or unrecognized.
 */
export async function getRole(): Promise<UserRole> {
  const { orgRole } = await auth();

  if (!orgRole) {
    throw new Error("AUTH_NO_ROLE: User has no role in the current organization.");
  }

  // Clerk stores org roles as "org:admin", "org:teacher", etc.
  // Strip the "org:" prefix to get our internal role string.
  const role = orgRole.replace(/^org:/, "") as UserRole;

  if (!["admin", "teacher", "parent"].includes(role)) {
    throw new Error(`AUTH_INVALID_ROLE: Unrecognized role "${role}".`);
  }

  return role;
}

/**
 * Convenience helper — returns userId, schoolId, and role together.
 * Use this in API routes that need all three to avoid three separate awaits.
 */
export async function getAuthContext(): Promise<{
  userId: string;
  schoolId: string;
  role: UserRole;
}> {
  const [userId, schoolId, role] = await Promise.all([
    getUserId(),
    getSchoolId(),
    getRole(),
  ]);

  return { userId, schoolId, role };
}

/**
 * Asserts the current user has one of the allowed roles.
 * Throws with a 403-appropriate error if not.
 */
export async function requireRole(...allowed: UserRole[]): Promise<void> {
  const role = await getRole();

  if (!allowed.includes(role)) {
    throw new Error(
      `AUTH_FORBIDDEN: Role "${role}" is not authorized. Required: ${allowed.join(" | ")}.`
    );
  }
}
