/**
 * Ambassador sessions: a stateless, HMAC-signed cookie holding the ambassador's
 * email. No server-side session store — every request re-checks the email
 * against the current portal.json (lib/ambassadors/portal.ts), so a removed
 * ambassador loses access at the next refresh even though the cookie is valid.
 *
 * Cookie: httpOnly, Secure, SameSite=Lax, 30 days.
 */
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "amb_session";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.AMBASSADOR_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AMBASSADOR_SESSION_SECRET is not set (need 16+ chars).");
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}
function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Build the signed cookie value for an email. */
export function makeSessionValue(email: string): string {
  const body = b64url(Buffer.from(JSON.stringify({ e: email.toLowerCase().trim(), t: Date.now() })));
  return `${body}.${sign(body)}`;
}

/** Verify a cookie value and return the email, or null. Constant-time compare. */
export function readSessionValue(value: string | undefined | null): string | null {
  if (!value || !value.includes(".")) return null;
  const [body, mac] = value.split(".");
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const { e, t } = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof e !== "string" || typeof t !== "number") return null;
    if (Date.now() - t > MAX_AGE_S * 1000) return null;
    return e;
  } catch {
    return null;
  }
}

/** Cookie options for `cookies().set(...)` / NextResponse cookies.
 *  `secure` is production-only so the cookie still sets on http://localhost. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Path "/" so the cookie reaches BOTH the /ambassadors pages and the
    // /api/ambassadors/* routes. It's httpOnly + signed; the API still returns
    // data only for the email inside it.
    path: "/",
    maxAge: MAX_AGE_S,
  };
}

export function clearedCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

/** Read the session email off a NextRequest (used in route handlers). */
export function emailFromRequest(req: NextRequest): string | null {
  return readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
}
