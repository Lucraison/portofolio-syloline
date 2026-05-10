import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  deleteArtwork,
  getArtworkById,
  updateArtwork,
} from "@/lib/artworks";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

type Ctx = { params: { id: string } };

// PATCH /api/admin/artworks/[id] — update title/description/tags.
// We deliberately do NOT allow changing the image here; replacing the
// image means a new upload + a new artwork record. Keeps this endpoint
// simple and avoids orphan Cloudinary assets.
export async function PATCH(req: Request, { params }: Ctx) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }
  const r = body as Record<string, unknown>;

  const update: { title?: string; description?: string; tags?: string[] } = {};
  if (typeof r.title === "string") update.title = r.title.trim();
  if (typeof r.description === "string") update.description = r.description;
  if (Array.isArray(r.tags)) {
    update.tags = r.tags.filter(
      (t): t is string => typeof t === "string" && t.trim().length > 0
    );
  }

  const updated = await updateArtwork(params.id, update);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath(`/work/${updated.slug}`);

  return NextResponse.json({ artwork: updated });
}

// DELETE /api/admin/artworks/[id] — remove the record AND the
// Cloudinary asset, so we don't leak storage. If the Cloudinary delete
// fails (asset already gone, network blip), we still proceed with the
// DB delete and just log — orphaned DB records would be worse than
// orphaned Cloudinary assets, since the UI breaks but storage doesn't.
export async function DELETE(_req: Request, { params }: Ctx) {
  const existing = await getArtworkById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteCloudinaryAsset(existing.cloudinaryPublicId);
  } catch (err) {
    console.warn("Cloudinary delete failed for", existing.cloudinaryPublicId, err);
  }

  await deleteArtwork(params.id);
  revalidatePath("/");
  revalidatePath(`/work/${existing.slug}`);

  return NextResponse.json({ ok: true });
}
