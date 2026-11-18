/**
 * Encrypt small values with SSO_SESSION_SECRET (JWE, dir + A256GCM via jose).
 * Used for the 10-minute login cookie (state, nonce, PKCE verifier) and for the
 * tokens stored in the session table, so a database read alone never hands
 * out a working Pickleball token. SERVER-ONLY.
 */
import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";

let keyFor: { secret: string; key: Promise<Uint8Array> } | null = null;

function key(): Promise<Uint8Array> {
  const secret = process.env.SSO_SESSION_SECRET?.trim() ?? "";
  if (secret.length < 32) throw new Error("SSO_SESSION_SECRET must be at least 32 characters.");
  if (keyFor?.secret !== secret) {
    keyFor = {
      secret,
      key: crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(`ppa-sso:${secret}`))
        .then((b) => new Uint8Array(b)),
    };
  }
  return keyFor.key;
}

export async function seal(value: object, ttlSeconds: number): Promise<string> {
  return new EncryptJWT({ v: value })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .encrypt(await key());
}

/** null when tampered, expired, or sealed under another secret. */
export async function unseal<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtDecrypt(token, await key());
    return (payload.v as T) ?? null;
  } catch {
    return null;
  }
}
