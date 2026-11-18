import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/sso/session";
import { getSignedInProfile } from "@/lib/sso/user";

/**
 * GET /api/me/ — who is signed in, for client components on static pages.
 * { signedIn: false } or { signedIn: true, email, profile }. `profile` is the
 * public subset only (lib/sso/user.ts); null when the user API call failed.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ signedIn: false });

  let profile = null;
  try {
    profile = await getSignedInProfile();
  } catch (e) {
    console.error("[sso] /api/me profile:", e instanceof Error ? e.message : e);
  }
  // Token refresh failed → the session is gone.
  if (!profile && !(await getSessionUser())) return json({ signedIn: false });
  return json({ signedIn: true, email: user.email, profile });
}

function json(body: object) {
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
