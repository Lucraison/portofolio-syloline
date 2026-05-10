import { signIn } from "@/auth";

// Sign-in page is the ONE admin route not gated by middleware (see
// middleware.ts matcher — it explicitly excludes /admin/signin).
//
// Uses a server action to call NextAuth's signIn(). The action runs
// on the server, so we don't need a client component or the auth.js
// client SDK here.

type Props = {
  searchParams?: { callbackUrl?: string; error?: string };
};

export default function SignInPage({ searchParams }: Props) {
  const callbackUrl = searchParams?.callbackUrl ?? "/admin";
  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <h1 className="font-serif text-3xl tracking-[0.2em]">[ ADMIN ]</h1>

        {error && (
          <p className="text-sm text-red-400">
            Sign-in failed. Only the configured admin email is allowed.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full px-4 py-3 rounded border border-white/20 hover:border-brand-hi hover:text-brand-hi transition-colors text-sm tracking-wider"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-xs text-muted">
          Only the registered admin account can sign in.
        </p>
      </div>
    </main>
  );
}
