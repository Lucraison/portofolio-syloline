import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Edge middleware that gates everything under /admin and /api/admin.
// Any unauthenticated visitor is bounced to /admin/signin with the
// originally-requested path preserved as ?callbackUrl=... so we can
// send them back after a successful sign-in.
//
// NOTE: /admin/signin itself is excluded from the matcher so visitors
// can actually reach the sign-in page.
export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/admin/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Gate the admin UI — but exclude the sign-in page so it's reachable.
    "/admin/((?!signin).*)",
    "/admin",
    // Gate every admin API route.
    "/api/admin/:path*",
  ],
};
