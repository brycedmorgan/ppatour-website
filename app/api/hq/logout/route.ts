/** POST /api/hq/logout — clears the HQ staff cookie. */
import { NextResponse } from "next/server";
import { HQ_COOKIE, hqClearedCookieOptions } from "@/lib/hq/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HQ_COOKIE, "", hqClearedCookieOptions());
  return res;
}
