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

/**
 * Returns the school_id for the authenticated user's Clerk org.
 * Throws if the user is not authenticated or their org has no
 * matching school record.
 *
 * Note: no module-level cache — a per-module Map is not safe across
 * requests in a long-lived Node.js worker (multiple orgs could share
 * the same process and receive each other's cached school_id).
 * The schools table lookup is a single indexed query; the cost is
 * negligible.
 */
export async function getSchoolId(): Promise<string> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("AUTH_NO_ORG: User is not a member of any organization.");
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
 *
 * Primary source: Clerk orgRole claim (org:admin | org:teacher | org:parent).
 *
 * Fallback: if orgRole is absent, 'org:member' (Clerk default), or any other
 * unrecognized value, the school_members table is queried. This handles users
 * who have been provisioned in the DB but not yet assigned a custom Clerk role.
 *
 * Throws AUTH_INVALID_ROLE if neither source yields a valid role.
 */
export async function getRole(): Promise<UserRole> {
  const { orgRole, userId } = await auth();

  if (!userId) {
    throw new Error("AUTH_UNAUTHENTICATED: No active Clerk session.");
  }

  // Happy path — recognized Clerk org role
  if (orgRole) {
    const stripped = orgRole.replace(/^org:/, "");
    if (["admin", "teacher", "parent"].includes(stripped)) {
      return stripped as UserRole;
    }
  }

  // Fallback — orgRole is undefined, 'org:member', or unrecognized.
  // Check school_members for an explicitly provisioned role.
  const schoolId = await getSchoolId();

  const { data } = await supabaseAdmin
    .from("school_members")
    .select("role")
    .eq("clerk_user_id", userId)
    .eq("school_id", schoolId)
    .limit(1)
    .single();

  if (data?.role && ["admin", "teacher", "parent"].includes(data.role as string)) {
    return data.role as UserRole;
  }

  throw new Error(
    `AUTH_INVALID_ROLE: No valid role found for user "${userId}". ` +
    `Assign org:admin, org:teacher, or org:parent in Clerk, ` +
    `or add a row to school_members.`
  );
}

/**
 * Convenience helper — returns userId, schoolId, and role together.
 * Use this in API routes that need all three to avoid three separate awaits.
 *
 * getSchoolId() and getRole() both call auth() internally; Clerk memoises
 * the JWT parse within the same request so there is no redundant work.
 * If getRole() falls back to the school_members query it will call
 * getSchoolId() a second time — two cheap indexed lookups, acceptable.
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
