import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// NextAuth v5 (Auth.js) — single source of truth for auth.
// `auth`, `handlers`, `signIn`, `signOut` are all derived from this
// one config object. Imported from:
//   - app/api/auth/[...nextauth]/route.ts (re-exports handlers)
//   - middleware.ts (uses auth() to gate routes)
//   - admin server components/actions (uses auth() to read session)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // JWT strategy keeps the session data inside an httpOnly cookie
  // signed by NEXTAUTH_SECRET. No DB session table needed.
  session: { strategy: "jwt" },
  pages: {
    // Custom sign-in page lives at /admin/signin — the default
    // NextAuth UI works but doesn't match the design.
    signIn: "/admin/signin",
  },
  callbacks: {
    /**
     * Allowlist gate: only the single ADMIN_EMAIL may sign in.
     * Returning false here causes NextAuth to redirect back to the
     * sign-in page with ?error=AccessDenied.
     */
    async signIn({ user }) {
      const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
      if (!allowed) return false;
      return user.email?.toLowerCase() === allowed;
    },
  },
});
