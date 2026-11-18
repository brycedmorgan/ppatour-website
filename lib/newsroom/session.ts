/**
 * Signed tokens and the secret address for the Newsroom dashboard.
 *
 * Web Crypto only, so the same code runs in proxy.ts (edge) and in server
 * components / actions. Ported from the everyday-zing dashboard.
 *
 * Token: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)
 *
 * Two kinds of token, two cookies:
 *   - "pending": the password was right; the second step (passkey or
 *     authenticator code) is still owed. 10 minutes, opens ONLY the setup and
 *     verify screens.
 *   - "session": both steps done. 7 days, opens the dashboard.
 *
 * Step one is EITHER email + password (NEWSROOM_ADMINS) OR Sign in with
 * Pickleball (lib/sso) for an account listed in NEWSROOM_PICKLEBALL_EDITORS
 * (Wesley, 11/18). Both hand over to the same second step. A Pickleball editor
 * is identified by their verified email (so MFA records and "by …" read the
 * same), and the token also carries their account id (`pb`), which is checked
 * against the list on every request.
 */

export const NEWSROOM_COOKIE = "ppa_newsroom";
export const NEWSROOM_PENDING_COOKIE = "ppa_newsroom_pending";
export const NEWSROOM_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const PENDING_TTL_SECONDS = 60 * 10; // 10 minutes

/**
 * The INTERNAL route (the app/newsroom folder). Nobody visits it directly:
 * proxy.ts answers it with the site's normal 404 and serves the dashboard only
 * at the secret address below, rewritten onto this route.
 */
export const NEWSROOM_PATH = "/newsroom";

/**
 * ⚠ THE PUBLIC ADDRESS IS SECRET AND LIVES ONLY IN AN ENV VAR. This repo is
 * public on GitHub, so a path written in code is a path anyone can read.
 * NEWSROOM_URL_KEY = "nr-" + 24 lowercase letters/digits (~124 bits), made by
 * `node scripts/newsroom-hash-password.mjs --url-key`. The SHAPE is public (the
 * proxy matcher has to be a literal); the key is not. Unset or malformed = the
 * dashboard is unreachable, which is the safe failure.
 */
export const URL_KEY_RE = /^nr-[a-z0-9]{24}$/;

export function newsroomUrlKey(): string | null {
  const key = process.env.NEWSROOM_URL_KEY?.trim() ?? "";
  return URL_KEY_RE.test(key) ? key : null;
}

/** The dashboard's public base path, e.g. "/nr-…". Server-only (reads env). */
export function newsroomBase(): string {
  const key = newsroomUrlKey();
  // No key: point at a path that 404s rather than at the internal route.
  return key ? `/${key}` : "/404";
}

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

/**
 * Pickleball accounts allowed into the Newsroom: NEWSROOM_PICKLEBALL_EDITORS,
 * Pickleball account ids (the SSO `sub`, a UUID) separated by commas or new
 * lines. Removing an id signs that person out on their next request. Each SSO
 * environment (dev / prod) has its own account ids.
 */
export function pickleballEditorIds(): Set<string> {
  const ids = new Set<string>();
  for (const raw of (process.env.NEWSROOM_PICKLEBALL_EDITORS || "").split(/[,\n]/)) {
    const id = raw.trim().toLowerCase();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) ids.add(id);
  }
  return ids;
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
  const secret = process.env.NEWSROOM_SESSION_SECRET?.trim();
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

type Kind = "session" | "pending";
/** sub = the editor's email; pb = their Pickleball account id when they came in through SSO. */
export type NewsroomSession = { sub: string; exp: number; kind: Kind; pb?: string };

async function createToken(email: string, kind: Kind, ttl: number, pb?: string): Promise<string> {
  const payload = b64url(
    encoder.encode(
      JSON.stringify({ sub: email, kind, exp: Math.floor(Date.now() / 1000) + ttl, ...(pb ? { pb } : {}) }),
    ),
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

async function verifyToken(token: string | undefined | null, kind: Kind): Promise<NewsroomSession | null> {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), encoder.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as NewsroomSession;
    // A pending token must never pass as a session, and the reverse.
    if (data.kind !== kind) return null;
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    const allowed = data.pb
      ? pickleballEditorIds().has(String(data.pb).toLowerCase())
      : getEditors().has(String(data.sub).toLowerCase());
    if (!allowed) return null;
    return data;
  } catch {
    // Includes a missing secret: fail closed.
    return null;
  }
}

/** Full session: password AND second step. */
export const createSessionToken = (email: string, pb?: string) =>
  createToken(email, "session", NEWSROOM_TTL_SECONDS, pb);
export const verifySessionToken = (t: string | undefined | null) => verifyToken(t, "session");

/** Password only; second step still owed. */
export const createPendingToken = (email: string, pb?: string) =>
  createToken(email, "pending", PENDING_TTL_SECONDS, pb);
export const verifyPendingToken = (t: string | undefined | null) => verifyToken(t, "pending");
