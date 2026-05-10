import Link from "next/link";
import { listArtworks } from "@/lib/artworks";
import { AdminArtworkRow } from "@/components/admin/AdminArtworkRow";

// Admin index — table of every artwork with edit/delete controls.
// Server Component; reads directly from MongoDB.
export const dynamic = "force-dynamic";

export default async function AdminListPage() {
  const artworks = await listArtworks();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl">All work</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 rounded border border-white/20 hover:border-brand-hi hover:text-brand-hi transition-colors text-sm"
        >
          + New artwork
        </Link>
      </div>

      {artworks.length === 0 ? (
        <p className="text-muted text-sm">
          No artwork yet. <Link href="/admin/new" className="underline hover:text-brand-hi">Upload the first piece →</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {artworks.map((art) => (
            <AdminArtworkRow key={art.id} artwork={art} />
          ))}
        </div>
      )}
    </div>
  );
}
