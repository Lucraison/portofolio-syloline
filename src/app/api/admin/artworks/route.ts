import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createArtwork, listArtworks } from "@/lib/artworks";

// GET /api/admin/artworks — list (admin)
// Same data as the public homepage, but exposed as an API so the
// admin client can refresh after mutations without a full reload.
export async function GET() {
  const items = await listArtworks();
  return NextResponse.json({ items });
}

// POST /api/admin/artworks — create
// Body: { title, description?, tags?, cloudinaryPublicId,
//         cloudinaryUrl, width, height }
// The image upload to Cloudinary already happened on the client —
// this route only persists the metadata.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const created = await createArtwork(parsed.data);

  // Bust the homepage and detail-page caches so the new artwork
  // appears immediately for visitors.
  revalidatePath("/");
  revalidatePath(`/work/${created.slug}`);

  return NextResponse.json({ artwork: created }, { status: 201 });
}

// ---------- helpers ----------
type CreateBody = {
  title: string;
  description?: string;
  tags?: string[];
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  width: number;
  height: number;
};

function parseCreateBody(
  raw: unknown
): { ok: true; data: CreateBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object" };
  const r = raw as Record<string, unknown>;

  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!title) return { ok: false, error: "title is required" };

  const cloudinaryPublicId =
    typeof r.cloudinaryPublicId === "string" ? r.cloudinaryPublicId : "";
  const cloudinaryUrl =
    typeof r.cloudinaryUrl === "string" ? r.cloudinaryUrl : "";
  if (!cloudinaryPublicId || !cloudinaryUrl) {
    return { ok: false, error: "cloudinary fields are required" };
  }

  const width = typeof r.width === "number" ? r.width : 0;
  const height = typeof r.height === "number" ? r.height : 0;
  if (width <= 0 || height <= 0) {
    return { ok: false, error: "width and height must be positive numbers" };
  }

  const description = typeof r.description === "string" ? r.description : "";
  const tags = Array.isArray(r.tags)
    ? r.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  return {
    ok: true,
    data: { title, description, tags, cloudinaryPublicId, cloudinaryUrl, width, height },
  };
}
