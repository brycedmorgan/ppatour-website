/**
 * POST /api/ambassadors/data — the morning refresh uploads portal.json here.
 *
 *   Authorization: Bearer <AMBASSADOR_DATA_SECRET>
 *   Content-Type: application/json
 *   Body: portal.json (must have version: 1)
 *
 * Stored privately (lib/ambassadors/store) — never publicly readable. Returns
 * { ok, ambassadors }. Companion image upload: /api/ambassadors/assets.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { putBytes } from "@/lib/ambassadors/store";
import { bustPortalCache } from "@/lib/ambassadors/portal";
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
  let parsed: { version?: unknown; ambassadors?: Record<string, unknown> };
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  if (parsed.version !== 1) {
    return NextResponse.json({ ok: false, error: "version must be 1" }, { status: 400 });
  }

  await putBytes("portal.json", raw, "application/json");
  bustPortalCache();

  const ambassadors = parsed.ambassadors ? Object.keys(parsed.ambassadors).length : 0;
  return NextResponse.json({ ok: true, ambassadors });
}
