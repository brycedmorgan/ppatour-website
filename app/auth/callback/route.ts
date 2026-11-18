import { NextResponse, type NextRequest } from "next/server";

import { finishLogin, LOGIN_COOKIE, SsoError, ssoConfigured } from "@/lib/sso/oidc";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/sso/session";

/**
 * GET /auth/callback/ — where Pickleball SSO sends the browser back.
 * ⚠ THIS EXACT URL (trailing slash included) must be registered on the SSO
 * client for each environment; see SSO_REDIRECT_URI in lib/sso/oidc.ts.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/auth/?error=${encodeURIComponent(code)}`, origin));
    res.cookies.delete({ name: LOGIN_COOKIE, path: "/auth/" });
    return headers(res);
  };
  if (!ssoConfigured()) return fail("not_configured");

  try {
    const { sub, email, returnTo, tokens } = await finishLogin(
      request.nextUrl.searchParams,
      request.cookies.get(LOGIN_COOKIE)?.value,
    );
    const session = await createSession({ sub, email }, tokens);
    const res = NextResponse.redirect(new URL(returnTo, origin));
    res.cookies.delete({ name: LOGIN_COOKIE, path: "/auth/" });
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions);
    return headers(res);
  } catch (e) {
    const code = e instanceof SsoError ? e.code : "sign_in_failed";
    console.error("[sso] callback failed:", code, e instanceof Error ? e.message : e);
    return fail(code);
  }
}

function headers(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store");
  // The URL carries a one-time code: keep it out of any Referer.
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
