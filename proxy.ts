import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require a valid Clerk session.
// API routes are intentionally excluded — they handle auth internally
// and return JSON 401/403 responses via authErrorResponse(), not redirects.
const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/dashboard(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
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
