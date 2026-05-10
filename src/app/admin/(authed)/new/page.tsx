import { ArtworkForm } from "@/components/admin/ArtworkForm";

// Upload page — wraps the shared ArtworkForm in "create" mode.
// Keeping this page tiny on purpose; all the logic lives in the
// reusable form component so /admin/[id]/edit can use the same one.
export default function NewArtworkPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-8">New artwork</h1>
      <ArtworkForm mode="create" />
    </div>
  );
}
