/**
 * Signed session tokens for the Newsroom dashboard (/newsroom).
 *
 * Web Crypto only, so the same code runs in proxy.ts (edge) and in server
 * components / actions. Ported from the everyday-zing dashboard.
 *
 * Token: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)
 *
 * ⚠ EMAIL + PASSWORD IS A STOPGAP. Wesley wants pickleball.com SSO (Jason's
 * OIDC client, still pending since 10/1). When it lands, the SSO callback just
 * calls `startSession(email)` (lib/newsroom/auth.ts) for an allowed email; the
 * token, cookie and every guard below stay as they are.
 */

export const NEWSROOM_COOKIE = "ppa_newsroom";
export const NEWSROOM_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** The dashboard's URL. Kept in step with the matcher in proxy.ts. */
export const NEWSROOM_PATH = "/newsroom";

const encoder = new TextEncoder();

/**
 * Editors come from NEWSROOM_ADMINS: one "email=hash" pair per person,
 * separated by commas or new lines. Hashes come from
 * `node scripts/newsroom-hash-password.mjs`. Returns lowercase email → hash.
 *
 * Removing someone from the variable signs them out on their next request.
 */
export function getEditors(): Map<string, string> {
  const editors = new Map<string, string>();
  for (const pair of (process.env.NEWSROOM_ADMINS || "").split(/[,\n]/)) {
    const i = pair.indexOf("=");
    if (i < 1) continue;
    const email = pair.slice(0, i).trim().toLowerCase();
    const hash = pair.slice(i + 1).trim();
    if (email && hash) editors.set(email, hash);
  }
  return editors;
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.NEWSROOM_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEWSROOM_SESSION_SECRET must be set to at least 32 characters.");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export type NewsroomSession = { sub: string; exp: number };

export async function createSessionToken(email: string): Promise<string> {
  const payload = b64url(
    encoder.encode(
      JSON.stringify({ sub: email, exp: Math.floor(Date.now() / 1000) + NEWSROOM_TTL_SECONDS }),
    ),
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** The session payload, or null if the token is missing, forged, expired or revoked. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<NewsroomSession | null> {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromB64url(sig),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as NewsroomSession;
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    if (!getEditors().has(String(data.sub).toLowerCase())) return null;
    return data;
  } catch {
    // Includes a missing secret: fail closed.
    return null;
  }
}
