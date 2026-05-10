import Link from "next/link";
import { signOut } from "@/auth";

// Wraps every admin page (except /admin/signin which has its own
// minimal layout). Provides shared nav and a sign-out button.
//
// Auth gating happens in middleware.ts — by the time this layout
// renders, we know the user is the allowlisted admin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-page px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-serif text-lg tracking-[0.2em] hover:text-brand-hi transition-colors"
            >
              [ ADMIN ]
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/admin" className="hover:text-text">All work</Link>
              <Link href="/admin/new" className="hover:text-text">+ New</Link>
              <Link href="/" className="hover:text-text">View site →</Link>
            </nav>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted hover:text-brand-hi transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-page px-6 py-10">{children}</main>
    </div>
  );
}
