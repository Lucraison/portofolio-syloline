import { notFound } from "next/navigation";
import { getArtworkById } from "@/lib/artworks";
import { ArtworkForm } from "@/components/admin/ArtworkForm";

type Props = { params: { id: string } };

// Edit page — same form as /admin/new but in "edit" mode with the
// artwork's existing values prefilled.
export default async function EditArtworkPage({ params }: Props) {
  const artwork = await getArtworkById(params.id);
  if (!artwork) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-8">Edit · {artwork.title}</h1>
      <ArtworkForm mode="edit" artwork={artwork} />
    </div>
  );
}
