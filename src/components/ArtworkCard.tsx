import Link from "next/link";
import Image from "next/image";
import type { ArtworkDTO } from "@/lib/artworks";

// Single tile in the artwork grid. Wraps next/image so we get
// automatic responsive sizing and lazy loading. The Cloudinary URL
// is fed straight in — Cloudinary serves the optimized variant.
export function ArtworkCard({
  artwork,
  featured = false,
}: {
  artwork: ArtworkDTO;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/work/${artwork.slug}`}
      className={[
        "group relative block overflow-hidden rounded-lg border border-white/10 bg-surface",
        "hover:border-brand-hi/60 transition-colors",
        featured ? "sm:col-span-2 aspect-[16/10]" : "aspect-[4/3]",
      ].join(" ")}
    >
      <Image
        src={artwork.cloudinaryUrl}
        alt={artwork.title}
        fill
        sizes={featured ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {/* Title overlay — appears on hover, keeps the grid quiet by default */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <h3 className="font-serif text-lg text-text">{artwork.title}</h3>
        {artwork.tags.length > 0 && (
          <p className="text-xs text-muted mt-1">{artwork.tags.join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}
