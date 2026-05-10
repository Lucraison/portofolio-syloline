import type { ArtworkDTO } from "@/lib/artworks";
import { ArtworkCard } from "./ArtworkCard";

// Right side of the sketch — the artwork grid. Two columns on desktop
// (matches the sketch's "one big block + one small block" rhythm) and
// a single column on mobile so each piece gets full attention.
export function ArtworkGrid({ artworks }: { artworks: ArtworkDTO[] }) {
  if (artworks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-white/10 rounded-lg">
        <p className="text-muted text-sm">No work uploaded yet.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-[minmax(220px,auto)]">
      {artworks.map((art, i) => (
        // First piece spans both columns so it reads as a hero — visually
        // matches the "one large block + one smaller block" sketch.
        <ArtworkCard key={art.id} artwork={art} featured={i === 0} />
      ))}
    </section>
  );
}
