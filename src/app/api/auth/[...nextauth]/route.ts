// Re-exports the NextAuth handlers as Next.js Route Handlers.
// All NextAuth routes (sign-in, callback, sign-out, session) are
// served from /api/auth/* through this single file.
//
// Auth.js v5 returns `handlers = { GET, POST }` from NextAuth(...) —
// we destructure here so Next.js sees them as named route exports.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
