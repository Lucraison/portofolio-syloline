"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ArtworkDTO } from "@/lib/artworks";

// One row in the admin list. Includes a delete button that calls
// DELETE /api/admin/artworks/[id] then refreshes the route to drop
// the row from the UI.
//
// Confirmation is intentionally a window.confirm — minimal admin UI
// for a single user, no need for a custom modal.
export function AdminArtworkRow({ artwork }: { artwork: ArtworkDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${artwork.title}"? This removes the image from Cloudinary too.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/artworks/${artwork.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Delete failed");
      return;
    }

    // router.refresh() re-runs the server component for /admin so the
    // deleted row disappears without a full page reload.
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-4 p-3 border border-white/10 rounded hover:border-white/20 transition-colors">
      <div className="relative w-16 h-16 shrink-0 bg-surface rounded overflow-hidden">
        <Image
          src={artwork.cloudinaryUrl}
          alt={artwork.title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-serif text-base truncate">{artwork.title}</p>
        <p className="text-xs text-muted truncate">
          {artwork.tags.length > 0 ? artwork.tags.join(" · ") : "no tags"}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/work/${artwork.slug}`}
          target="_blank"
          className="text-xs text-muted hover:text-brand-hi"
        >
          view
        </Link>
        <Link
          href={`/admin/${artwork.id}/edit`}
          className="text-xs text-muted hover:text-text px-2 py-1 border border-white/10 rounded"
        >
          edit
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-white/10 rounded disabled:opacity-50"
        >
          {isPending ? "…" : "delete"}
        </button>
      </div>
    </div>
  );
}
