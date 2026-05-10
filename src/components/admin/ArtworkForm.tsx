"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArtworkDTO } from "@/lib/artworks";

type Props =
  | { mode: "create"; artwork?: undefined }
  | { mode: "edit"; artwork: ArtworkDTO };

// Shared form for create + edit. In create mode the user picks a file
// which uploads directly to Cloudinary, then we POST the metadata. In
// edit mode the image is fixed (we don't let the user replace it —
// that would orphan a Cloudinary asset and add a lot of UX complexity
// for little gain). They can change title/description/tags only.
export function ArtworkForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [title, setTitle] = useState(isEdit ? props.artwork.title : "");
  const [description, setDescription] = useState(
    isEdit ? props.artwork.description : ""
  );
  const [tagsInput, setTagsInput] = useState(
    isEdit ? props.artwork.tags.join(", ") : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    isEdit ? props.artwork.cloudinaryUrl : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setSubmitting(true);

      if (isEdit) {
        const res = await fetch(`/api/admin/artworks/${props.artwork.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title, description, tags }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      } else {
        if (!file) throw new Error("Pick an image first");
        const uploaded = await uploadToCloudinary(file);

        const res = await fetch("/api/admin/artworks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            tags,
            cloudinaryPublicId: uploaded.publicId,
            cloudinaryUrl: uploaded.url,
            width: uploaded.width,
            height: uploaded.height,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-white/20 file:bg-transparent file:text-text file:hover:border-brand-hi file:hover:text-brand-hi"
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="mt-3 max-h-64 rounded border border-white/10"
            />
          )}
        </Field>
      )}

      <Field label="Title">
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-hi outline-none"
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-hi outline-none"
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="illustration, character design"
          className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-hi outline-none"
        />
      </Field>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded border border-white/20 hover:border-brand-hi hover:text-brand-hi transition-colors text-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted mb-2">{label}</span>
      {children}
    </label>
  );
}

// ---------- Cloudinary direct upload ----------

type Uploaded = {
  publicId: string;
  url: string;
  width: number;
  height: number;
};

/**
 * Two-step direct upload:
 *   1. Ask our backend for a signed payload (timestamp + signature).
 *   2. POST the file + that payload to Cloudinary directly.
 * Cloudinary returns the canonical URL and intrinsic dimensions,
 * which we pass back to the form to persist alongside the metadata.
 */
async function uploadToCloudinary(file: File): Promise<Uploaded> {
  const sigRes = await fetch("/api/admin/upload-signature");
  if (!sigRes.ok) throw new Error("Failed to get upload signature");
  const sig = await sigRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await res.json();
  return {
    publicId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height,
  };
}
