import { listArtworks } from "@/lib/artworks";
import { ArtworkGrid } from "@/components/ArtworkGrid";
import { BioColumn } from "@/components/BioColumn";
import { BrandHeader } from "@/components/BrandHeader";

// Server Component — runs on the server on every request, fetches
// artworks directly from MongoDB. No public API needed.
// Set `revalidate` to cache for 60s; admin actions can revalidate the
// path explicitly when content changes.
export const revalidate = 60;

export default async function HomePage() {
  const artworks = await listArtworks();

  return (
    <main className="min-h-screen">
      <BrandHeader />
      <div className="mx-auto max-w-page px-6 py-16 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12">
        <BioColumn />
        <ArtworkGrid artworks={artworks} />
      </div>
    </main>
  );
}
