import { listArtworks } from "@/lib/artworks";
import { ArtworkGrid } from "@/components/ArtworkGrid";
import { BioColumn } from "@/components/BioColumn";
import { BrandHeader } from "@/components/BrandHeader";

// Server Component — fetch from MongoDB at request time (not at build).
// Avoids Mongoose during `next build` on Vercel; Atlas must still allow
// serverless egress at runtime (e.g. IP allowlist 0.0.0.0/0).
export const dynamic = "force-dynamic";

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
