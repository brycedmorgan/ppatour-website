/**
 * POST /api/hq/preview — off-production only. Signs a reviewer into the HQ
 * preview (read-only) without Google SSO, so /hq is clickable on staging before
 * the OAuth client exists. Refused on the production indexable domain.
 */
import { NextResponse } from "next/server";
import { previewEnabled } from "@/lib/ambassadors/config";
import { HQ_COOKIE, makeStaffValue, hqCookieOptions } from "@/lib/hq/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!previewEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HQ_COOKIE, makeStaffValue("preview@pickleball.com"), hqCookieOptions());
  return res;
}
