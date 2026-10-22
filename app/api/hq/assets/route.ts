/**
 * POST   /api/hq/assets  — upload a graphic image (edit mode only). The raw file
 *                          is the request body; Content-Type is the image type.
 *                          Returns { id, contentType, sizeBytes }; the image is
 *                          then served at /_blob/<id> (private store key blob/<id>).
 * DELETE /api/hq/assets?id=<id> — remove an uploaded image.
 *
 * Requires the HQ editor cookie. Serverless request bodies cap at ~4.5 MB, so
 * the browser shim pre-checks size; this is a backstop.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { putBytes, delKey } from "@/lib/ambassadors/store";
import { editorFromRequest } from "@/lib/hq/editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4_000_000;
const OK_TYPES = /^(image\/(png|jpeg|gif|webp|svg\+xml)|application\/pdf|video\/(mp4|webm))$/;

export async function POST(request: NextRequest) {
  if (!editorFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "edit mode required", code: "invalid_argument" }, { status: 403 });
  }
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!OK_TYPES.test(contentType)) {
    return NextResponse.json({ ok: false, error: "unsupported type", code: "unsupported_type" }, { status: 400 });
  }
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ ok: false, error: "empty", code: "invalid_argument" }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too large", code: "too_large" }, { status: 413 });
  }
  const id = crypto.randomBytes(16).toString("hex");
  try {
    await putBytes(`blob/${id}`, bytes, contentType);
  } catch {
    return NextResponse.json({ ok: false, error: "store failed", code: "quota_or_state" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id, contentType, sizeBytes: bytes.length });
}

export async function DELETE(request: NextRequest) {
  if (!editorFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "edit mode required" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^[A-Za-z0-9._-]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  }
  await delKey(`blob/${id}`);
  return NextResponse.json({ ok: true });
}
