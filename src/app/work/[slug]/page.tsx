import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug } from "@/lib/artworks";
import { BrandHeader } from "@/components/BrandHeader";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

// Per-page metadata so each artwork has its own title and OG image
// when shared. The OG image is just the artwork itself (Cloudinary
// already serves an optimized version).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const art = await getArtworkBySlug(params.slug);
  if (!art) return { title: "Not found · Syloline" };

  return {
    title: `${art.title} · Syloline`,
    description: art.description || `Artwork by Syloline.`,
    openGraph: {
      title: art.title,
      description: art.description,
      images: [{ url: art.cloudinaryUrl, width: art.width, height: art.height }],
      type: "article",
    },
  };
}

export default async function ArtworkDetailPage({ params }: Props) {
  const art = await getArtworkBySlug(params.slug);
  if (!art) notFound();

  return (
    <main className="min-h-screen">
      <BrandHeader />
      <article className="mx-auto max-w-page px-6 py-16">
        <Link
          href="/"
          className="text-sm text-muted hover:text-brand-hi transition-colors"
        >
          ← back
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-[1fr_280px]">
          {/* Image */}
          <div className="relative w-full">
            <Image
              src={art.cloudinaryUrl}
              alt={art.title}
              width={art.width}
              height={art.height}
              priority
              sizes="(min-width: 1024px) 900px, 100vw"
              className="w-full h-auto rounded-lg border border-white/10"
            />
          </div>

          {/* Metadata */}
          <aside className="space-y-8 text-sm leading-relaxed">
            <header>
              <h1 className="font-serif text-3xl text-text">{art.title}</h1>
              {art.tags.length > 0 && (
                <p className="text-xs text-muted mt-2 tracking-wider uppercase">
                  {art.tags.join(" · ")}
                </p>
              )}
            </header>

            {art.description && (
              <p className="text-text/90 whitespace-pre-wrap">{art.description}</p>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
