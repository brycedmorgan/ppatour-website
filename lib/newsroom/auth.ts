/**
 * Newsroom sign-in. Server-only (node:crypto, next/headers).
 *
 * Password hash format: "scrypt:<salt base64url>:<hash base64url>", made by
 * `node scripts/newsroom-hash-password.mjs`. No "$" characters, because Next
 * expands "$VAR" inside .env files.
 */
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  NEWSROOM_COOKIE,
  NEWSROOM_PATH,
  NEWSROOM_TTL_SECONDS,
  createSessionToken,
  getEditors,
  verifySessionToken,
  type NewsroomSession,
} from "@/lib/newsroom/session";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/** Compared against when the email isn't an editor, so the hash still runs. */
const DUMMY_HASH = `scrypt:${"A".repeat(22)}:${"A".repeat(86)}`;

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = (stored || "").split(":");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(expected, actual);
}

/** The signed-in editor's email, or null. */
export async function checkCredentials(email: string, password: string): Promise<string | null> {
  const editors = getEditors();
  if (editors.size === 0) throw new Error("Set NEWSROOM_ADMINS to sign in.");
  const normalized = email.trim().toLowerCase();
  // Always hash, even for an unknown email, so timing doesn't reveal who is an editor.
  const ok = await verifyPassword(password, editors.get(normalized) ?? DUMMY_HASH);
  return ok && editors.has(normalized) ? normalized : null;
}

export async function startSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(NEWSROOM_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: NEWSROOM_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(NEWSROOM_COOKIE);
}

export async function getSession(): Promise<NewsroomSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(NEWSROOM_COOKIE)?.value);
}

/**
 * Call at the top of every newsroom page, server action and API route.
 * proxy.ts also guards /newsroom, but it is only the first line of defence.
 */
export async function requireEditor(): Promise<NewsroomSession> {
  const session = await getSession();
  if (!session) redirect(`${NEWSROOM_PATH}/login`);
  return session;
}
