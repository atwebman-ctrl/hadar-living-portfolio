import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require a valid Clerk session.
// API routes are intentionally excluded — they handle auth internally
// and return JSON 401/403 responses via authErrorResponse(), not redirects.
const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/dashboard(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  // Only require authentication (userId), not an active organization.
  // Users authenticated without an active org are allowed through to
  // /dashboard where OrgPickerScreen handles the org-selection flow.
  // auth.protect() is intentionally avoided here because it also gates
  // on org presence and would redirect to /sign-in before the user can
  // reach the picker.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    // Run middleware on all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes
    "/(api|trpc)(.*)",
  ],
};
