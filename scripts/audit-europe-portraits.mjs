/**
 * Fails if `lib/europe-roster.ts` names a portrait file that is not in the repo.
 *
 * ⚠ THIS EXISTS BECAUSE THE ROSTER SHIPPED 25 BROKEN IMAGES TO PRODUCTION AND
 * `next build` WAS GREEN THE WHOLE TIME. A portrait path is a plain string; the
 * bundler never opens it, `next/image` only fails in the browser, and the
 * silhouette fallback keys on a MISSING path rather than a missing file — so a
 * path to a file that does not exist is invisible in every check we had.
 * A path is not a picture. This is the check that knows the difference.
 *
 * Usage: node scripts/audit-europe-portraits.mjs   (npm run europe:audit)
 */
import fs from "node:fs";
import path from "node:path";

const raw = fs.readFileSync("lib/europe-roster.ts", "utf8");

/**
 * ⚠ COMMENTS ARE STRIPPED BEFORE MATCHING, AND THE FIRST RUN OF THIS SCRIPT IS
 * WHY. Tom Protzek's record carries a note saying to add
 * `portrait: P("tom-protzek")` when Catie sends a usable file — and the audit
 * read that sentence as a live reference and failed on a portrait nothing
 * actually names. An audit that cries wolf gets switched off.
 */
const src = raw
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const flag = /const PORTRAITS_IN_REPO = (true|false);/.exec(raw);
if (!flag) {
  console.error("✗ PORTRAITS_IN_REPO not found — did lib/europe-roster.ts move?");
  process.exitCode = 1;
} else if (flag[1] === "false") {
  console.log("PORTRAITS_IN_REPO is false — every portrait resolves to undefined. Nothing to check.");
  process.exit(0);
}

const slugs = [...src.matchAll(/portrait:\s*P\("([^"]+)"\)/g)].map((m) => m[1]);
if (slugs.length === 0) {
  console.error("✗ No `portrait: P(\"…\")` entries found. The regex or the file shape changed.");
  process.exitCode = 1;
}

let missing = 0;
for (const slug of slugs) {
  const file = path.join("public", "europe", "pros", `${slug}.jpg`);
  if (!fs.existsSync(file)) {
    console.error(`✗ ${slug} — roster names ${file}, which does not exist`);
    missing++;
  }
}

const orphans = fs
  .readdirSync(path.join("public", "europe", "pros"))
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => f.replace(/\.jpg$/, ""))
  .filter((s) => !slugs.includes(s));

if (missing === 0) console.log(`✓ ${slugs.length} portraits, all present on disk.`);
else {
  console.error(`\n${missing} of ${slugs.length} portrait(s) missing.`);
  process.exitCode = 1;
}
if (orphans.length) {
  console.log(`\nℹ ${orphans.length} file(s) on disk that no roster record names (harmless, but likely a leftover):`);
  for (const o of orphans) console.log(`   ${o}.jpg`);
}
