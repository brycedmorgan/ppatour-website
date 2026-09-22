/**
 * One-time sign-in tokens. We hand the ambassador a random token in a link and
 * store only its SHA-256 hash. Single use (deleted on redeem), 15-minute expiry.
 * Records live in the private store keyed by hash, so a stolen record can't be
 * reversed to a working link.
 */
import crypto from "node:crypto";
import { getJson, putJson, delKey } from "@/lib/ambassadors/store";

const TTL_MS = 15 * 60 * 1000;

type TokenRecord = { email: string; exp: number };

function hash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function key(h: string): string {
  return `tokens/${h}.json`;
}

/** Create a token for an email and return the raw token (goes in the link). */
export async function createSignInToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const rec: TokenRecord = { email: email.trim().toLowerCase(), exp: Date.now() + TTL_MS };
  await putJson(key(hash(token)), rec);
  return token;
}

/**
 * Redeem a token: returns the email exactly once, then the record is gone.
 * Returns null for unknown, expired, or already-used tokens.
 */
export async function consumeSignInToken(token: string): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const h = hash(token);
  const rec = await getJson<TokenRecord>(key(h));
  await delKey(key(h)); // single use: remove regardless of validity
  if (!rec || typeof rec.email !== "string" || typeof rec.exp !== "number") return null;
  if (Date.now() > rec.exp) return null;
  return rec.email;
}
