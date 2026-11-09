#!/usr/bin/env node
/**
 * Every photo that can become an event hero must have a focal point in
 * lib/image-focus.ts, or a crop can land on a player's legs (Wesley, 11/9).
 *
 * Candidates: every /ppa/... image path written in lib/placeholder-data.ts,
 * lib/venue-photos.ts (the HERO_OVERRIDE pins) and lib/challenger-photos.ts, plus
 * every file in public/ppa/events/ and public/ppa/challenger/photos/. Synced
 * Jackalope venue photos (lib/data/venue-photos.json) are exempt: aerial/venue
 * shots, centre-cropped.
 *
 * Fails (exit 1) on a candidate with no focal point, or a focal point for a
 * file that doesn't exist. Runs in prebuild.
 *
 *   node scripts/audit-image-focus.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// Read the map as text, not by import: the build machine's Node may not strip
// types, and this keeps the script dependency-free.
const focusSrc = read("lib/image-focus.ts");
const focus = new Map(
  [...focusSrc.matchAll(/^\s*"(\/[^"]+)":\s*"(\d{1,3})% (\d{1,3})%"/gm)].map((m) => [m[1], [+m[2], +m[3]]]),
);

const IMG = /"(\/ppa\/[^"]+\.(?:jpe?g|png|webp|avif))"/g;
const candidates = new Set();
for (const f of ["lib/placeholder-data.ts", "lib/venue-photos.ts", "lib/challenger-photos.ts"]) {
  for (const m of read(f).matchAll(IMG)) {
    if (m[1].startsWith("/ppa/badges/")) continue; // crests, not photos
    candidates.add(m[1]);
  }
}
for (const dir of ["ppa/events", "ppa/challenger/photos"]) {
  for (const name of readdirSync(join(root, "public", dir))) {
    if (/\.(jpe?g|png|webp|avif)$/i.test(name)) candidates.add(`/${dir}/${name}`);
  }
}

const problems = [];
for (const src of [...candidates].sort()) {
  if (!existsSync(join(root, "public", src))) continue; // a dead path is another audit's job
  if (!focus.has(src)) problems.push(`  no focal point:  "${src}"`);
}
for (const [src, [x, y]] of focus) {
  if (!existsSync(join(root, "public", src))) problems.push(`  file missing:    "${src}"`);
  if (x > 100 || y > 100) problems.push(`  out of range:    "${src}" ${x}% ${y}%`);
}

if (problems.length) {
  console.error(
    `✖ image focus: ${problems.length} problem(s)\n${problems.join("\n")}\n\n` +
      `Add each photo to FOCUS in lib/image-focus.ts as "x% y%", aimed at the subject's\n` +
      `face (or the court, for a crowd/aerial shot). Without it the photo crops at its\n` +
      `centre, which on a player shot shows legs.`,
  );
  process.exit(1);
}
console.log(`✓ image focus: ${candidates.size} event photos, all with a focal point`);
