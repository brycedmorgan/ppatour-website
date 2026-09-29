/**
 * POST /api/ambassadors/adminlink  { email }
 *   Authorization: Bearer <AMBASSADOR_DATA_SECRET>
 * Admin-only: mint a one-time sign-in token for a roster ambassador (support /
 * HQ view-as). Gated by the admin data secret. Preview branch only.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { emailIsAmbassador, normEmail } from "@/lib/ambassadors/portal";
import { createSignInToken } from "@/lib/ambassadors/tokens";
import { dataSecret } from "@/lib/ambassadors/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerOk(header: string | null): boolean {
  const secret = dataSecret();
  if (!secret) return false;
  const got = (header ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got); const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!bearerOk(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { email?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 }); }
  const email = normEmail(typeof body.email === "string" ? body.email : "");
  if (!email || !(await emailIsAmbassador(email))) {
    return NextResponse.json({ ok: false, error: "not on roster" }, { status: 404 });
  }
  const token = await createSignInToken(email);
  return NextResponse.json({ ok: true, path: `/ambassadors/verify?token=${encodeURIComponent(token)}` });
}
