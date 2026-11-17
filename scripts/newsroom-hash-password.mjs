#!/usr/bin/env node
/**
 * Newsroom dashboard secrets.
 *
 *   node scripts/newsroom-hash-password.mjs "the password"
 *     → "scrypt:<salt>:<hash>". Add to NEWSROOM_ADMINS as
 *       "name@ppatour.com=scrypt:…" (comma- or newline-separated).
 *
 *   node scripts/newsroom-hash-password.mjs --url-key
 *     → a fresh NEWSROOM_URL_KEY ("nr-" + 24 random characters), the
 *       dashboard's secret address. Keep it out of the repo (it's public).
 *
 *   node scripts/newsroom-hash-password.mjs --secret
 *     → a fresh NEWSROOM_SESSION_SECRET.
 */
import { randomBytes, randomInt, scryptSync } from "node:crypto";

const arg = process.argv[2];

if (arg === "--url-key") {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "nr-";
  for (let i = 0; i < 24; i += 1) key += abc[randomInt(abc.length)];
  console.log(key);
  process.exit(0);
}

if (arg === "--secret") {
  console.log(randomBytes(36).toString("base64url"));
  process.exit(0);
}

if (!arg || arg.length < 10) {
  console.error('Usage: node scripts/newsroom-hash-password.mjs "a password of 10+ characters"');
  console.error("       node scripts/newsroom-hash-password.mjs --url-key | --secret");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(arg, salt, 64);
console.log(`scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
