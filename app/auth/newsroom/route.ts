import { NextResponse, type NextRequest } from "next/server";

import { getMfa } from "@/lib/newsroom/store";
import { hasFactor } from "@/lib/newsroom/mfa";
import { getSession, startPending } from "@/lib/newsroom/auth";
import { newsroomBase, newsroomUrlKey, pickleballEditorIds } from "@/lib/newsroom/session";
import { ssoConfigured } from "@/lib/sso/oidc";
import { getSessionUser } from "@/lib/sso/session";

/**
 * GET /auth/newsroom/ — "Sign in with Pickleball.com" on the Newsroom login.
 * The SSO sign-in returns here (returnTo); this is step one, and the person
 * goes on to the Newsroom's own second step (passkey or code) as after a
 * password.
 *
 * ⚠ The Newsroom address is secret (repo is public), so this route only ever
 * redirects to it for a listed editor. Anyone else lands on /account/ with a
 * "not an editor" note; signed-out visitors go to sign in first.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const to = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  };

  if (!ssoConfigured() || !newsroomUrlKey()) return to("/account/?error=not_configured");

  // Already signed in to the Newsroom (e.g. "Go to Newsroom" on /account/): straight in.
  if (await getSession()) return to(`${newsroomBase()}/`);

  const user = await getSessionUser();
  if (!user) return to("/auth/login/?returnTo=/auth/newsroom/");

  if (!pickleballEditorIds().has(user.sub.toLowerCase())) {
    console.warn("[newsroom] Pickleball sign-in refused for account", user.sub);
    return to("/account/?error=newsroom_denied");
  }

  // The editor's name in the Newsroom (MFA record, "Last saved by"): their
  // verified email, else the account id.
  const editor = user.email.trim().toLowerCase() || `pickleball:${user.sub.toLowerCase()}`;
  await startPending(editor, user.sub.toLowerCase());
  const m = await getMfa(editor);
  return to(`${newsroomBase()}/${hasFactor(m) ? "verify" : "setup"}/`);
}
