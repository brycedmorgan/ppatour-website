/**
 * POST /api/ambassadors/preview  { email }
 *
 * Off-production ONLY (previewEnabled). Signs the reviewer straight in as a
 * roster/demo ambassador without an email round-trip, so /ambassadors can be
 * clicked through on staging with no SendGrid/Blob setup. On the production
 * indexable domain this always 404s — the only way in there is the real link.
 */
import { NextResponse } from "next/server";
import { previewEnabled } from "@/lib/ambassadors/config";
import { emailIsAmbassador, normEmail } from "@/lib/ambassadors/portal";
import { makeSessionValue, SESSION_COOKIE, sessionCookieOptions } from "@/lib/ambassadors/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!previewEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const email = normEmail(typeof body.email === "string" ? body.email : "");
  if (!email || !(await emailIsAmbassador(email))) {
    return NextResponse.json({ error: "unknown preview user" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, makeSessionValue(email), sessionCookieOptions());
  return res;
}
