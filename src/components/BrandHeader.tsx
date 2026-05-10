import Link from "next/link";

// Top bar — matches the sketch's header. The brand sits between two
// thin horizontal rules and uses the bracket-bracket style to echo
// the [SYLOLINE] handwritten lettering. The serif font font carries
// the brand identity.
export function BrandHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="border-b border-white/5" />
      <div className="mx-auto max-w-page px-6 py-8 flex items-center justify-center">
        <Link
          href="/"
          className="font-serif text-3xl md:text-4xl tracking-[0.25em] text-text hover:text-brand-hi transition-colors"
        >
          [ SYLOLINE ]
        </Link>
      </div>
      <div className="border-t border-white/5" />
    </header>
  );
}
