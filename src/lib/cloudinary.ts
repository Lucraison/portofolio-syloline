import { v2 as cloudinary } from "cloudinary";

// Configure once on module load. The Node SDK is needed only for
// server-side operations: signing upload requests and (optionally)
// deleting assets. The browser uploads directly to Cloudinary using
// the signed params we hand it — see /api/admin/upload-signature.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadSignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Generates a one-shot signed upload payload. The browser POSTs this
 * (along with the file) to https://api.cloudinary.com/v1_1/{cloud}/image/upload
 * and Cloudinary verifies the signature against the timestamp+folder.
 * The signature is short-lived (Cloudinary rejects timestamps > 1h old).
 */
export function getUploadSignature(folder = "syloline"): UploadSignature {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Cloudinary env vars missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  return { timestamp, signature, apiKey, cloudName, folder };
}

/**
 * Deletes an asset by its Cloudinary public_id. Used when an admin
 * deletes an artwork — keeps the Cloudinary library tidy and avoids
 * paying for storage we no longer reference.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
