import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_COOKIE, ssoConfigured, startLogin } from "@/lib/sso/oidc";

/**
 * GET /auth/login/?returnTo=/somewhere/ — "Sign in" / "Sign up" link target.
 * Sends the browser to the Pickleball SSO sign-in page. lib/sso/oidc.ts.
 */
export async function GET(request: NextRequest) {
  if (!ssoConfigured()) {
    return NextResponse.redirect(new URL("/account/?error=not_configured", request.nextUrl.origin));
  }

  const { url, cookie, maxAge } = await startLogin(
    request.nextUrl.origin,
    request.nextUrl.searchParams.get("returnTo") ?? "/",
  );
  const res = NextResponse.redirect(url);
  res.cookies.set(LOGIN_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax, not Strict: the callback is a cross-site top-level redirect and
    // Strict would drop this cookie on the way back.
    sameSite: "lax",
    path: "/auth/",
    maxAge,
  });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
