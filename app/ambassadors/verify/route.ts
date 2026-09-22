/**
 * GET /ambassadors/verify?token=…  — the destination of the one-time sign-in
 * link (spec §3). Redeems the token, sets the session cookie, and redirects to
 * the dashboard. Invalid/expired/used tokens go back to sign-in with a notice.
 *
 * This lives as a route handler (not a page) because only a route handler /
 * server action may set a cookie.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { consumeSignInToken } from "@/lib/ambassadors/tokens";
import { makeSessionValue, SESSION_COOKIE, sessionCookieOptions } from "@/lib/ambassadors/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const email = await consumeSignInToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/ambassadors?e=link", request.url));
  }

  const res = NextResponse.redirect(new URL("/ambassadors/dashboard", request.url));
  res.cookies.set(SESSION_COOKIE, makeSessionValue(email), sessionCookieOptions());
  return res;
}
