import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * File-upload endpoint for form attachments (careers résumé, host-tournament
 * documents, fan video). The client POSTs the raw file body with a
 * `?filename=` query param; we store it in Vercel Blob and return its public
 * URL, which the form then submits as the field value so the notification
 * email + sheet row carry a link.
 *
 * Env: BLOB_READ_WRITE_TOKEN — set automatically once a Blob store is linked
 * to the Vercel project; locally, add it to .env.local to test uploads.
 */
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = /\.(pdf|docx?|png|jpe?g|gif|mp4|mov|webm|txt|csv|xlsx?)$/i;

export async function POST(request: Request) {
  const filename = new URL(request.url).searchParams.get("filename");
  if (!filename || !ALLOWED.test(filename)) {
    return NextResponse.json({ error: "Unsupported or missing file type" }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[form-upload] BLOB_READ_WRITE_TOKEN unset — cannot store file");
    return NextResponse.json({ error: "Uploads not configured" }, { status: 503 });
  }
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (25 MB max)" }, { status: 413 });
  }
  if (!request.body) {
    return NextResponse.json({ error: "Empty upload" }, { status: 400 });
  }

  try {
    const blob = await put(`form-uploads/${filename}`, request.body, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[form-upload] blob put failed", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
