/**
 * Signed-in sessions for "Sign in with Pickleball". SERVER-ONLY.
 *
 * Server-side sessions (the guide's recommended option): the browser holds a
 * random id in an HttpOnly cookie; the tokens live in the `sso_sessions` table,
 * sealed (lib/sso/seal.ts). The table stores sha256(cookie), never the cookie,
 * so a database read can't be replayed as a session. Created on first use,
 * like lib/pb-cache.ts.
 *
 * ⚠ REFRESH TOKENS ARE SINGLE-USE. Reusing an old one revokes the user's whole
 * token chain. Two tabs (or two serverless instances) refreshing at once would
 * do exactly that, so a refresh takes a 15s lease on the row first; whoever
 * loses waits for the winner's new token instead of refreshing too.
 *
 * Local dev has no DATABASE_URL, so sessions sit in process memory (lost on a
 * restart: sign in again). Production without DATABASE_URL refuses to sign in.
 *
 * ⚠ SQL MUST NOT GO THROUGH NEXT'S PATCHED fetch (lib/pb-cache.ts, 9/28).
 */
import "server-only";

import { neon, neonConfig } from "@neondatabase/serverless";
import { cookies } from "next/headers";

import { refreshTokens, revokeRefreshToken, type TokenSet } from "./oidc";
import { seal, unseal } from "./seal";

neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) => {
  const f = globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch };
  return (f._nextOriginalFetch ?? f)(input, init);
};

export const SESSION_COOKIE = "ppa_sso";
/** = the SSO's refresh-token lifetime; each refresh pushes it out again. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const LEASE_SECONDS = 15;
const EARLY_REFRESH_SECONDS = 60;

type Tokens = { access: string; refresh: string; accessExp: number };
type Row = { sub: string; email: string; tokens: string; expiresAt: number; leaseUntil: number };

export type SsoUser = { sub: string; email: string };

/* ───────────────────────────── Storage ───────────────────────────── */

type Sql = ReturnType<typeof neon>;
const db = (): Sql | null => (process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null);

let ready: Promise<void> | null = null;
function init(sql: Sql): Promise<void> {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS sso_sessions (
      id text PRIMARY KEY,
      sub text NOT NULL,
      email text NOT NULL DEFAULT '',
      tokens text NOT NULL,
      expires_at timestamptz NOT NULL,
      lease_until timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS sso_sessions_sub ON sso_sessions (sub)`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

const mem = ((globalThis as { __ppaSsoSessions?: Map<string, Row> }).__ppaSsoSessions ??= new Map());

function storeUsable(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production";
}

async function hashId(cookieValue: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cookieValue));
  return Buffer.from(d).toString("hex");
}

async function readRow(id: string): Promise<Row | null> {
  const sql = db();
  if (!sql) {
    const row = mem.get(id);
    return row && row.expiresAt > Date.now() ? row : null;
  }
  await init(sql);
  const rows = (await sql`SELECT sub, email, tokens,
      extract(epoch from expires_at) * 1000 AS exp,
      coalesce(extract(epoch from lease_until) * 1000, 0) AS lease
    FROM sso_sessions WHERE id = ${id} AND expires_at > now()`) as {
    sub: string;
    email: string;
    tokens: string;
    exp: string;
    lease: string;
  }[];
  const r = rows[0];
  return r
    ? { sub: r.sub, email: r.email, tokens: r.tokens, expiresAt: Number(r.exp), leaseUntil: Number(r.lease) }
    : null;
}

async function writeRow(id: string, row: Omit<Row, "leaseUntil">): Promise<void> {
  const sql = db();
  if (!sql) {
    mem.set(id, { ...row, leaseUntil: 0 });
    return;
  }
  await init(sql);
  const exp = new Date(row.expiresAt).toISOString();
  await sql`INSERT INTO sso_sessions (id, sub, email, tokens, expires_at, lease_until, updated_at)
    VALUES (${id}, ${row.sub}, ${row.email}, ${row.tokens}, ${exp}, NULL, now())
    ON CONFLICT (id) DO UPDATE SET tokens = EXCLUDED.tokens, expires_at = EXCLUDED.expires_at,
      lease_until = NULL, updated_at = now()`;
}

async function deleteRow(id: string): Promise<void> {
  const sql = db();
  if (!sql) {
    mem.delete(id);
    return;
  }
  await init(sql);
  await sql`DELETE FROM sso_sessions WHERE id = ${id}`;
  // Expired rows go with any sign-out; no separate sweep needed at this size.
  await sql`DELETE FROM sso_sessions WHERE expires_at < now()`;
}

/** true when THIS caller now holds the refresh lease. */
async function takeLease(id: string): Promise<boolean> {
  const sql = db();
  if (!sql) {
    const row = mem.get(id);
    if (!row || row.leaseUntil > Date.now()) return false;
    row.leaseUntil = Date.now() + LEASE_SECONDS * 1000;
    return true;
  }
  await init(sql);
  const won = (await sql`UPDATE sso_sessions SET lease_until = now() + make_interval(secs => ${LEASE_SECONDS})
    WHERE id = ${id} AND (lease_until IS NULL OR lease_until < now()) RETURNING id`) as unknown[];
  return won.length === 1;
}

/* ───────────────────────────── Sessions ───────────────────────────── */

function toTokens(t: TokenSet, previousRefresh?: string): Tokens | null {
  const refresh = t.refresh_token ?? previousRefresh;
  if (!refresh) return null;
  return { access: t.access_token, refresh, accessExp: Date.now() + (t.expires_in || 3600) * 1000 };
}

/** After a successful callback. Returns the cookie value to set. */
export async function createSession(user: SsoUser, tokens: TokenSet): Promise<string> {
  if (!storeUsable()) throw new Error("DATABASE_URL is required for sign-in in production.");
  const t = toTokens(tokens);
  // No refresh token = offline_access wasn't granted; the session would die in
  // an hour with no way back but a fresh sign-in. Keep the access token anyway.
  const sealed = await seal(t ?? { access: tokens.access_token, refresh: "", accessExp: Date.now() + tokens.expires_in * 1000 }, SESSION_TTL_SECONDS);
  const cookieValue = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  await writeRow(await hashId(cookieValue), {
    sub: user.sub,
    email: user.email,
    tokens: sealed,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  return cookieValue;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

async function currentId(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? hashId(value) : null;
}

/** Who is signed in, or null. Reads the cookie: opts the route into dynamic rendering. */
export async function getSessionUser(): Promise<SsoUser | null> {
  const id = await currentId();
  if (!id) return null;
  const row = await readRow(id);
  return row ? { sub: row.sub, email: row.email } : null;
}

/**
 * A current access token for the signed-in user, refreshing if it expires
 * within a minute. null = not signed in, or the refresh failed (the session is
 * then deleted: the user signs in again).
 */
export async function getAccessToken(): Promise<string | null> {
  const id = await currentId();
  if (!id) return null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const row = await readRow(id);
    if (!row) return null;
    const tokens = await unseal<Tokens>(row.tokens);
    if (!tokens) {
      await deleteRow(id);
      return null;
    }
    if (tokens.accessExp - EARLY_REFRESH_SECONDS * 1000 > Date.now()) return tokens.access;
    if (!tokens.refresh) return null;

    if (await takeLease(id)) {
      const fresh = await refreshTokens(tokens.refresh);
      const next = fresh && toTokens(fresh, tokens.refresh);
      if (!next) {
        await deleteRow(id);
        return null;
      }
      await writeRow(id, {
        sub: row.sub,
        email: row.email,
        tokens: await seal(next, SESSION_TTL_SECONDS),
        expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
      });
      return next.access;
    }
    // Someone else is refreshing this session: wait for their new token.
    await new Promise((r) => setTimeout(r, 750));
  }
  return null;
}

/** Sign-out: revoke the refresh token, drop the row. The caller clears the cookie. */
export async function endSession(): Promise<void> {
  const id = await currentId();
  if (!id) return;
  const row = await readRow(id);
  const tokens = row ? await unseal<Tokens>(row.tokens) : null;
  if (tokens?.refresh) await revokeRefreshToken(tokens.refresh);
  await deleteRow(id);
}
