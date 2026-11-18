import { NextResponse, type NextRequest } from "next/server";

import { endSession, SESSION_COOKIE } from "@/lib/sso/session";

/**
 * POST /auth/logout/ — "Sign out" is a form POST, not a link, so another site
 * can't sign our users out. Signs out of ppatour.com only: the Pickleball SSO
 * session stays (the SSO has no end_session_endpoint yet).
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const from = request.headers.get("origin");
  if (from && from !== origin) return new NextResponse("Forbidden", { status: 403 });

  try {
    await endSession();
  } catch (e) {
    console.error("[sso] logout:", e instanceof Error ? e.message : e);
  }
  // 303 so the browser follows with a GET.
  const res = NextResponse.redirect(new URL("/", origin), 303);
  res.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
