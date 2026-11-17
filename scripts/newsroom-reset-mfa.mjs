#!/usr/bin/env node
/**
 * Clears an editor's second sign-in step (passkeys + authenticator app), so
 * their next sign-in sets up a new one. For a lost phone or passkey.
 *
 *   node --env-file=.env.local scripts/newsroom-reset-mfa.mjs name@ppatour.com
 *
 * Production/preview: run with DATABASE_URL set (e.g. `vercel env pull`).
 * For dev.ppatour.com also set NEWSROOM_TABLE_PREFIX=dev_.
 * Without DATABASE_URL it edits the local dev file (.data/newsroom.json).
 *
 * ⚠ Only reset someone you have confirmed is who they say they are (call them):
 * a reset plus their password is a full sign-in.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email.includes("@")) {
  console.error("Usage: node --env-file=.env.local scripts/newsroom-reset-mfa.mjs name@ppatour.com");
  process.exit(1);
}

if (process.env.DATABASE_URL) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  // Same optional prefix as lib/newsroom/store.ts (dev.ppatour.com uses dev_).
  const raw = (process.env.NEWSROOM_TABLE_PREFIX ?? "").trim();
  const prefix = /^[a-z]{1,12}_$/.test(raw) ? raw : "";
  const rows = await sql.query(`DELETE FROM ${prefix}newsroom_mfa WHERE email = $1 RETURNING email`, [email]);
  console.log(rows.length ? `Reset ${email}.` : `${email} had nothing set up.`);
} else {
  const file = path.join(process.cwd(), ".data", "newsroom.json");
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  const had = Boolean(data.mfa?.[email]);
  if (data.mfa) delete data.mfa[email];
  await fs.writeFile(file, JSON.stringify(data, null, 2));
  console.log(had ? `Reset ${email} (local).` : `${email} had nothing set up (local).`);
}
