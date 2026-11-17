/**
 * The Newsroom's second sign-in step. SERVER-ONLY.
 *
 * Every editor sets one up on their first sign-in (Wesley, 11/17): a passkey
 * (Face ID / Touch ID / Windows Hello / a security key) or an authenticator
 * app code (Google Authenticator, 1Password, Authy…). After that, the password
 * alone never opens the dashboard.
 *
 * Authenticator codes are standard TOTP (RFC 6238: SHA-1, 6 digits, 30 s), done
 * here with node:crypto. Passkeys use @simplewebauthn/server.
 *
 * ⚠ A PASSKEY BELONGS TO ONE SITE (its "RP ID"). In production that is
 * NEWSROOM_RP_ID=ppatour.com, which covers www and the apex. A Vercel preview
 * has its own hostname, so a passkey made on one preview URL does not work on
 * another; editors who review on previews should use the authenticator app, or
 * the branch's stable preview URL.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import type { MfaRecord } from "@/lib/newsroom/store";

export const MAX_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const ISSUER = "PPA Tour Newsroom";

/* ─────────────────────────── authenticator app ─────────────────────────── */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A fresh 160-bit secret, base32 (what authenticator apps expect). */
export function newTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function codeAt(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const bin = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(bin).padStart(6, "0");
}

/**
 * The step the code matched (now ±1, for clock drift), or null. A step at or
 * before `lastStep` is refused, so a code can't be used twice.
 */
export function checkTotp(secret: string, code: string, lastStep = -1): number | null {
  const digits = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(digits)) return null;
  const now = Math.floor(Date.now() / 30_000);
  for (const step of [now - 1, now, now + 1]) {
    if (step <= lastStep) continue;
    const want = Buffer.from(codeAt(secret, step));
    if (timingSafeEqual(want, Buffer.from(digits))) return step;
  }
  return null;
}

export function otpauthUri(secret: string, email: string): string {
  const label = encodeURIComponent(`${ISSUER}:${email}`);
  const issuer = encodeURIComponent(ISSUER);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

/* ─────────────────────────────── passkeys ─────────────────────────────── */

/**
 * The site this request is on, for WebAuthn. Production pins NEWSROOM_RP_ID
 * (e.g. "ppatour.com") when the host is that domain or a subdomain of it;
 * anywhere else (a preview, localhost) it is the request's own hostname.
 */
export async function relyingParty(): Promise<{ rpID: string; origin: string }> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost").split(",")[0].trim();
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0].trim() ??
    (hostname === "localhost" ? "http" : "https");
  const pinned = process.env.NEWSROOM_RP_ID?.trim().toLowerCase();
  const rpID =
    pinned && (hostname === pinned || hostname.endsWith(`.${pinned}`)) ? pinned : hostname;
  return { rpID, origin: `${proto}://${host}` };
}

/* ─────────────────────────────── lockout ─────────────────────────────── */

export function isLocked(m: MfaRecord): boolean {
  return Boolean(m.lockedUntil && m.lockedUntil > Date.now());
}

export function withFailure(m: MfaRecord): MfaRecord {
  const failures = m.failures + 1;
  return failures >= MAX_FAILURES
    ? { ...m, failures: 0, lockedUntil: Date.now() + LOCK_MS }
    : { ...m, failures };
}

export function hasFactor(m: MfaRecord): boolean {
  return Boolean(m.totp) || m.passkeys.length > 0;
}
