/**
 * POST /api/ambassadors/assets — upload the graphic/logo images the data file
 * references, so they're served same-origin (required for canvas save).
 *
 *   Authorization: Bearer <AMBASSADOR_DATA_SECRET>
 *   Body: { assets: [ { path: "t/daytona-flyer.webp", contentBase64, contentType } ] }
 *
 * `path` is confined to the t/ and logos/ folders. Files are then reachable at
 * /ambassadors/<path> via the same-origin image route.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { putBytes } from "@/lib/ambassadors/store";
import { dataSecret } from "@/lib/ambassadors/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerOk(header: string | null): boolean {
  const secret = dataSecret();
  if (!secret) return false;
  const got = (header ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Only these folders, only safe characters — no path traversal.
// `blob/` holds HQ graphic assets keyed by opaque assetId (served via
// /ambassadors/asset/<id>, i.e. the /_blob/<id> rewrite).
const SAFE = /^(t|logos|blob)\/[A-Za-z0-9._-]+$/;

export async function POST(request: Request) {
  if (!bearerOk(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { assets?: { path: string; contentBase64: string; contentType?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const assets = Array.isArray(body.assets) ? body.assets : [];
  let count = 0;
  for (const a of assets) {
    if (!a || typeof a.path !== "string" || !SAFE.test(a.path) || typeof a.contentBase64 !== "string") {
      return NextResponse.json({ ok: false, error: `bad asset path: ${a?.path}` }, { status: 400 });
    }
    await putBytes(a.path, Buffer.from(a.contentBase64, "base64"), a.contentType || "application/octet-stream");
    count += 1;
  }
  return NextResponse.json({ ok: true, count });
}
