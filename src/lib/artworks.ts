import { connectDb } from "./db";
import { Artwork, type ArtworkDoc } from "./models/Artwork";

// Plain DTO returned to React components. Mongoose documents contain
// non-serializable values (ObjectId, Date) that can't cross the
// server-to-client boundary in Next.js App Router, so we serialize
// to a plain object with string IDs and ISO date strings.
export type ArtworkDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

function toDTO(doc: ArtworkDoc | (ArtworkDoc & { _id: unknown })): ArtworkDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? "",
    tags: doc.tags ?? [],
    cloudinaryPublicId: doc.cloudinaryPublicId,
    cloudinaryUrl: doc.cloudinaryUrl,
    width: doc.width,
    height: doc.height,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Public — list every artwork, newest first. */
export async function listArtworks(): Promise<ArtworkDTO[]> {
  await connectDb();
  const docs = await Artwork.find().sort({ createdAt: -1 }).lean<ArtworkDoc[]>();
  return docs.map(toDTO);
}

/** Public — get one artwork by its slug. */
export async function getArtworkBySlug(slug: string): Promise<ArtworkDTO | null> {
  await connectDb();
  const doc = await Artwork.findOne({ slug }).lean<ArtworkDoc | null>();
  return doc ? toDTO(doc) : null;
}

/** Admin — get one artwork by its Mongo _id. */
export async function getArtworkById(id: string): Promise<ArtworkDTO | null> {
  await connectDb();
  const doc = await Artwork.findById(id).lean<ArtworkDoc | null>();
  return doc ? toDTO(doc) : null;
}

export type CreateArtworkInput = {
  title: string;
  description?: string;
  tags?: string[];
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  width: number;
  height: number;
};

/** Admin — create a new artwork. Generates a unique slug from the title. */
export async function createArtwork(input: CreateArtworkInput): Promise<ArtworkDTO> {
  await connectDb();
  const slug = await generateUniqueSlug(input.title);
  const created = await Artwork.create({ ...input, slug });
  return toDTO(created.toObject());
}

export type UpdateArtworkInput = Partial<
  Pick<CreateArtworkInput, "title" | "description" | "tags">
>;

/** Admin — update an existing artwork. Re-generates the slug if title changes. */
export async function updateArtwork(
  id: string,
  input: UpdateArtworkInput
): Promise<ArtworkDTO | null> {
  await connectDb();
  const update: Record<string, unknown> = { ...input };
  if (input.title) {
    update.slug = await generateUniqueSlug(input.title, id);
  }
  const doc = await Artwork.findByIdAndUpdate(id, update, {
    new: true,
  }).lean<ArtworkDoc | null>();
  return doc ? toDTO(doc) : null;
}

/** Admin — delete an artwork by id. Returns whether one was deleted. */
export async function deleteArtwork(id: string): Promise<boolean> {
  await connectDb();
  const res = await Artwork.findByIdAndDelete(id);
  return res !== null;
}

// ---------- helpers ----------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Builds a slug guaranteed unique across the collection. If a
 * collision is found, appends `-2`, `-3`, etc. When updating, pass
 * the document's own id in `excludeId` so we don't collide with
 * ourselves.
 */
async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "untitled";
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Artwork.findOne({ slug: candidate })
      .select({ _id: 1 })
      .lean<{ _id: unknown } | null>();
    if (!existing || (excludeId && String(existing._id) === excludeId)) {
      return candidate;
    }
    candidate = `${base}-${suffix++}`;
  }
}
