/**
 * Refresh the local event marks in `public/ppa/badges` from the tournament
 * feed's own `logo_url`.
 *
 * WHY THIS EXISTS. The site renders an event's mark from two places, and only
 * one of them can see the feed:
 *   • Feed-driven surfaces (/events, the Next Six band, event pages, the -live
 *     route) take the mark from `logo_url` at request time — see
 *     `brandWithFeedMark` in lib/events-api.ts. Those are always current.
 *   • Curated-only surfaces — the header's Events dropdown (a client component
 *     built from the sync `getMainTourEvents()`) and the generated OG share
 *     cards — read `BRAND_BY_SLUG` in lib/placeholder-data.ts, i.e. the files
 *     in public/ppa/badges.
 * So without this script the dropdown and the share cards keep showing whatever
 * artwork was last committed while the rest of the site has moved on. That is
 * exactly the split that made PPA Finals wrong on 8/6: the event team updated
 * the logo upstream and nothing here read it.
 *
 * Run it whenever the event team changes a logo:  npm run marks:sync
 * Check without writing anything:                 npm run marks:check
 *
 * ⚠ IT AUDITS BOTH DIRECTIONS AND FAILS THE RUN. A stopgap map quietly drifting
 * out from under a feed is this repo's most repeated bug (NAME_OVERRIDE_BY_SLUG,
 * the Tixr sync, the Asia links). So: a badge entry that no feed row resolves to
 * is an ERROR (exit 1) — it means the slug derivation below no longer matches
 * the mapper's, and a silent no-op there looks identical to "nothing changed
 * upstream". Feed rows with no badge entry are printed as FYI, not failures:
 * most are Challengers, which have no curated record by design.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "lib/placeholder-data.ts");
const API = path.join(ROOT, "lib/events-api.ts");
const CHECK_ONLY = process.argv.includes("--check");

/* ── the feed ─────────────────────────────────────────────── */

function env() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq > 0 && /^[A-Z0-9_]+$/.test(line.slice(0, eq))) {
      out[line.slice(0, eq)] = line.slice(eq + 1).replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

/* ── slug derivation ──────────────────────────────────────── */

/**
 * ⚠ A COPY OF THE MAPPER'S RULES, AND THE AUDIT IS WHAT KEEPS IT HONEST.
 * `cleanTitle` + `kebab` + `CURATED_ALIASES` live in lib/events-api.ts and
 * lib/placeholder-data.ts, which this plain .mjs script cannot import. Rather
 * than let the copy rot silently, CURATED_ALIASES is PARSED out of the real
 * source below, and any badge slug this fails to resolve fails the run.
 */
const cleanTitle = (title) =>
  title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
    .replace(/\s*@\s*[^@]+$/, "")
    .replace(/^(Australia|Asia|Italy|Spain|Canada|USA)\s+(?=\S)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const kebab = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Parse a `Record<string, string>`-shaped literal out of a TS source file. */
function parseAliases() {
  const block = fs
    .readFileSync(API, "utf8")
    .match(/const CURATED_ALIASES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("CURATED_ALIASES not found in lib/events-api.ts");
  const out = {};
  for (const [, from, to] of block[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) out[from] = to;
  // A parse that silently returns nothing looks exactly like "no aliases", and
  // would then mis-slug the flagship stops that need them most.
  if (Object.keys(out).length < 3) throw new Error(`CURATED_ALIASES parsed ${Object.keys(out).length} rows — expected 3+`);
  return out;
}

/** Parse BRAND_BY_SLUG → { slug: localBadgePath } for entries that have an icon. */
function parseBadges() {
  const block = fs
    .readFileSync(SOURCE, "utf8")
    .match(/const BRAND_BY_SLUG[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("BRAND_BY_SLUG not found in lib/placeholder-data.ts");
  const out = new Map();
  for (const [, slug, icon] of block[1].matchAll(
    /"([^"]+)":\s*\{[^}]*icon:\s*"(\/ppa\/badges\/[^"]+)"/g,
  )) {
    out.set(slug, { icon, wide: /iconWide/.test(block[1].slice(block[1].indexOf(`"${slug}"`), block[1].indexOf(`"${slug}"`) + 400)) });
  }
  /**
   * ⚠ THE COUNT CHECK IS THE WHOLE GUARD, AND IT WAS ADDED BECAUSE THE FIRST
   * VERSION FAILED ITS OWN NEGATIVE TEST. The key pattern was `[a-z0-9-]+`, so
   * renaming an entry to anything outside that character set made it vanish
   * from the parse rather than fail the audit — the script then reported
   * "✓ every badge entry resolved" for a file it had only half read, which is
   * the precise failure this audit exists to prevent. Pairing the parse against
   * a raw count of the badge paths in the same block means an entry can no
   * longer disappear quietly, whatever its key looks like.
   */
  const declared = (block[1].match(/icon:\s*"\/ppa\/badges\//g) ?? []).length;
  if (out.size !== declared) {
    throw new Error(
      `BRAND_BY_SLUG has ${declared} badge icons but only ${out.size} parsed — an entry's key didn't match, so it would have been skipped silently`,
    );
  }
  if (out.size < 15) throw new Error(`BRAND_BY_SLUG parsed ${out.size} badge entries — expected 15+`);
  return out;
}

/* ── run ──────────────────────────────────────────────────── */

const { PB_API_BASE_URL, PB_API_TOKEN } = env();
if (!PB_API_TOKEN) throw new Error("PB_API_TOKEN missing from .env.local");

const res = await fetch(`${PB_API_BASE_URL}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
  headers: { "PB-API-TOKEN": PB_API_TOKEN },
});
if (!res.ok) throw new Error(`feed responded ${res.status}`);
const rows = (await res.json()).results?.tournaments ?? [];
if (rows.length === 0) throw new Error("feed returned no tournaments");

/**
 * Badge entries the feed genuinely does not carry, each acknowledged by a
 * human. Everything NOT listed here that fails to resolve is treated as slug
 * drift and fails the run — the point being that "upstream doesn't have it" and
 * "our slug rules broke" look identical from the outside, and only one of them
 * is fine.
 *
 * ⚠ texas-open: the 2027 edition is not registered upstream yet. The newest
 * Texas row in the feed is the COMPLETED "PPA Tour: Veolia Texas Open"
 * (Mar 2026), which derives `veolia-texas-open` — deliberately NOT aliased onto
 * this slug, because that would point the 2027 stop's artwork and curated
 * record at a finished event. Same exposure as the Hong Kong Slam (8/6): it
 * lights up on its own the moment the row appears. If it lands still titled
 * "Veolia Texas Open", it wants a CURATED_ALIASES row, not an entry here.
 */
const NOT_IN_FEED = new Set(["texas-open"]);

const ALIASES = parseAliases();
const badges = parseBadges();

/**
 * Feed row per badge slug. Later rows win, so a stop with several editions
 * lands on its most recent — the mark is the CURRENT branding, and an event's
 * 2027 logo is the right one to ship for its 2027 page.
 */
const bySlug = new Map();
for (const t of rows.sort((a, b) => a.start_date.localeCompare(b.start_date))) {
  if (t.is_canceled || t.is_stub || !t.start_date || !t.logo_url) continue;
  if (/\btemplate\b|\btest event\b|\bTBD\b/i.test(t.title)) continue;
  const raw = kebab(cleanTitle(t.title));
  bySlug.set(ALIASES[raw] ?? raw, t);
}

const synced = [];
const missing = [];
const needsFlag = [];

for (const [slug, badge] of badges) {
  const row = bySlug.get(slug);
  if (!row) {
    if (!NOT_IN_FEED.has(slug)) missing.push(slug);
    else console.log(`  (skipped ${slug} — acknowledged as absent from the feed)`);
    continue;
  }
  const file = path.join(ROOT, "public", badge.icon.replace(/^\//, ""));
  const before = fs.existsSync(file) ? fs.statSync(file).size : 0;

  const buf = Buffer.from(await (await fetch(row.logo_url)).arrayBuffer());
  // Trim the flat margin the CMS bakes into every mark (they are all 600x315
  // with the artwork floating in the middle), then re-pad slightly so the mark
  // never touches the edge of the white chip EventMark draws it on.
  const trimmed = await sharp(buf).trim({ threshold: 5 }).toBuffer();
  const { height } = await sharp(trimmed).metadata();
  const pad = Math.max(1, Math.round(height * 0.06));
  const out = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#ffffff" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  const meta = await sharp(out).metadata();

  if (!CHECK_ONLY) fs.writeFileSync(file, out);
  synced.push({ slug, before, after: out.length, dim: `${meta.width}x${meta.height}` });
  // Every synced file is a landscape/near-square lockup, never a portrait crest,
  // so its entry MUST carry iconWide or EventMark draws it in a 42x80 slot.
  if (!badge.wide) needsFlag.push(slug);
}

console.log(`${CHECK_ONLY ? "CHECK" : "SYNCED"}  ${synced.length} of ${badges.size} badge entries\n`);
for (const s of synced) {
  console.log(
    `  ${s.slug.padEnd(46)} ${s.dim.padEnd(10)} ${(s.before / 1024).toFixed(0)} KB → ${(s.after / 1024).toFixed(0)} KB`,
  );
}

const unmatched = [...bySlug.keys()].filter((s) => !badges.has(s));
if (unmatched.length) {
  console.log(`\nFYI — ${unmatched.length} feed events have no badge entry (Challengers and sister-tour stops have none by design):`);
  console.log("  " + unmatched.slice(0, 12).join("\n  ") + (unmatched.length > 12 ? `\n  …and ${unmatched.length - 12} more` : ""));
}

let failed = false;
if (needsFlag.length) {
  console.error(`\n⚠ ADD \`iconWide: true\` TO THESE BRAND_BY_SLUG ENTRIES — their file is now a wide mark:`);
  for (const s of needsFlag) console.error(`  ${s}`);
  failed = true;
}
if (missing.length) {
  console.error(`\n⚠ ${missing.length} badge entries resolved to NO feed event — the slug rules above have drifted from lib/events-api.ts:`);
  for (const s of missing) console.error(`  ${s}`);
  failed = true;
}
// ⚠ `process.exitCode`, not `process.exit()` — the latter tripped a libuv
// assertion on Windows and returned 127 on a clean pass (see the 8/6 audit).
process.exitCode = failed ? 1 : 0;
if (!failed) console.log("\n✓ every badge entry resolved to a feed event");
