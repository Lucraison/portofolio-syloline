import { NextResponse } from "next/server";
import { getUploadSignature } from "@/lib/cloudinary";

// Returns a one-shot signed payload that the browser uses to upload
// directly to Cloudinary. Authenticated by middleware.ts — only an
// admin can hit this route, otherwise the cloud account would be
// open for spam uploads.
//
// The returned signature is valid for ~1 hour; the browser must use
// it before then.
export async function GET() {
  try {
    const sig = getUploadSignature();
    return NextResponse.json(sig);
  } catch (err) {
    console.error("upload-signature error", err);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
