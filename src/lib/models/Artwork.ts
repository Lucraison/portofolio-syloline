import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

// Schema for a single artwork. One image per piece in v1; multi-image
// support is an additive change (add an `images: [{ ... }]` array
// alongside or in place of the cloudinary* fields) when needed.
const ArtworkSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    tags: { type: [String], default: [], index: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { timestamps: true }
);

export type ArtworkDoc = InferSchemaType<typeof ArtworkSchema> & {
  _id: unknown;
  createdAt: Date;
  updatedAt: Date;
};

// In dev, Next.js hot-reloads modules and would otherwise call
// model() twice with the same name, throwing OverwriteModelError.
// Re-using the cached model on `mongoose.models` avoids this.
export const Artwork: Model<ArtworkDoc> =
  (models.Artwork as Model<ArtworkDoc>) ||
  model<ArtworkDoc>("Artwork", ArtworkSchema);
