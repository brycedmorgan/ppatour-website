#!/usr/bin/env node
/**
 * Makes a password hash for the Newsroom dashboard.
 *
 *   node scripts/newsroom-hash-password.mjs "the password"
 *
 * Prints "scrypt:<salt>:<hash>". Add it to NEWSROOM_ADMINS as
 * "name@ppatour.com=scrypt:…" (comma- or newline-separated for several people)
 * in Vercel and in .env.local. Same format as lib/newsroom/auth.ts reads.
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: node scripts/newsroom-hash-password.mjs "a password of 10+ characters"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
