/**
 * POST /api/hq/data — uploads the assembled Ambassador HQ bundle (hq.json).
 *
 *   Authorization: Bearer <AMBASSADOR_DATA_SECRET>
 *   Content-Type: application/json
 *   Body: the { docs, colls } bundle the /hq page reads (see app/hq/route.ts).
 *
 * Companion to /api/ambassadors/data (which uploads portal.json). Stored
 * privately via lib/ambassadors/store — never publicly readable; the /hq page
 * still gates on the staff session. This lets the weekly refresh push real HQ
 * numbers without committing them to the repo.
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

export async function POST(request: Request) {
  if (!bearerOk(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const raw = Buffer.from(await request.arrayBuffer());
  let parsed: { docs?: unknown; colls?: unknown };
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  if (parsed.docs === null || typeof parsed.docs !== "object" || parsed.colls === null || typeof parsed.colls !== "object") {
    return NextResponse.json({ ok: false, error: "expected { docs, colls }" }, { status: 400 });
  }

  try {
    await putBytes("hq.json", raw, "application/json");
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        name: e instanceof Error ? e.name : undefined,
        hasBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
      { status: 500 },
    );
  }

  const docs = Object.keys(parsed.docs as object).length;
  const colls = Object.keys(parsed.colls as object).length;
  return NextResponse.json({ ok: true, docs, colls });
}
