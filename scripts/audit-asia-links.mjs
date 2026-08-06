/**
 * Audit the PPA Tour Asia link table against the live tournaments feed.
 *
 *   npm run asia:audit
 *
 * `lib/asia-tour-links.ts` repoints the Asia stops from their
 * pickleballtournaments.com listing to the Asia tour's own event page (Wade,
 * 8/6). It matches on the feed's `details_url` permalink and FAILS SAFE: an
 * unmatched event silently keeps the old link. Silent is the problem — this is
 * the check that makes the drift visible.
 *
 * Reports, and exits 1 on either of the first two:
 *   1. Rows in the table that match no event in the feed (a stale entry, or an
 *      upstream permalink change — those stops are back on the old link).
 *   2. "PPA Tour Asia" events in the feed with no row in the table (a new stop —
 *      it is linking to pickleballtournaments.com today).
 *   3. FYI: the URLs' HTTP status, with --check.
 *
 * Reads PB_API_TOKEN from .env.local (same as the site).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_URLS = process.argv.includes("--check");

/* ---- env ---- */

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

/* ---- the table ----
 * Parsed out of the TS source rather than imported, so this stays a plain
 * `node` script with no build step (same approach as scripts/import-paddles.mjs).
 *
 * ⚠ IT THROWS BELOW 10 ROWS. A regex that stops matching after a refactor would
 * otherwise report "everything is fine" for a table it never read — the exact
 * failure the paddle importer's guards exist to prevent.
 */
function readTable() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "asia-tour-links.ts"), "utf8");
  const body = src.slice(src.indexOf("ASIA_TOUR_EVENTS"));
  const rows = [];
  for (const m of body.matchAll(/\{\s*(?:\/\/[^\n]*\n\s*)*name:\s*"([^"]+)",[\s\S]*?\}/g)) {
    const block = m[0];
    rows.push({
      name: m[1],
      path: /path:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
      ptSlug: /ptSlug:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
      curatedSlug: /curatedSlug:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
    });
  }
  if (rows.length < 10) {
    throw new Error(
      `Parsed only ${rows.length} rows out of lib/asia-tour-links.ts — the shape changed. Fix this parser before trusting the report.`,
    );
  }
  return rows;
}

/* ---- feed ---- */

async function fetchAsiaEvents(env) {
  const token = env.PB_API_TOKEN || process.env.PB_API_TOKEN;
  if (!token) {
    console.error("PB_API_TOKEN not set (.env.local) — cannot audit against the feed.");
    process.exit(2);
  }
  const base = (env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  const res = await fetch(`${base}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
    headers: { "PB-API-TOKEN": token },
  });
  if (!res.ok) {
    console.error(`Feed returned ${res.status}.`);
    process.exit(2);
  }
  const json = await res.json();
  const all = json.results?.tournaments ?? [];
  return {
    all,
    asia: all.filter((t) => t.organization_name === "PPA Tour Asia"),
  };
}

const ptSlugOf = (url) =>
  /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(url ?? "")?.[1]?.toLowerCase() ?? null;

/* ---- report ---- */

const env = loadEnv();
const rows = readTable();
const { all, asia } = await fetchAsiaEvents(env);

console.log(`Table: ${rows.length} Asia events · Feed: ${all.length} rows, ${asia.length} under "PPA Tour Asia"\n`);

const feedBySlug = new Map();
for (const t of all) {
  const s = ptSlugOf(t.details_url);
  if (s) feedBySlug.set(s, t);
}

/* 1 — table rows that match nothing in the feed. */
const unmatched = rows.filter((r) => r.ptSlug && !feedBySlug.has(r.ptSlug));
/* A row with no ptSlug at all is curated-only and expected — listed, not failed. */
const curatedOnly = rows.filter((r) => !r.ptSlug);

/* 2 — Asia feed events with no row. */
const missing = asia.filter((t) => {
  const s = ptSlugOf(t.details_url);
  return !s || !rows.some((r) => r.ptSlug === s);
});

if (unmatched.length) {
  console.log(`✗ ${unmatched.length} table row(s) match NO feed event — these stops are back on the old link:`);
  for (const r of unmatched) console.log(`    ${r.name}  (ptSlug: ${r.ptSlug})`);
  console.log("");
}

if (missing.length) {
  console.log(`✗ ${missing.length} "PPA Tour Asia" feed event(s) have no row — still linking to pickleballtournaments.com:`);
  for (const t of missing) {
    console.log(`    ${t.title}  (${t.start_date?.slice(0, 10)})  ${ptSlugOf(t.details_url) ?? t.details_url}`);
  }
  console.log("");
}

if (curatedOnly.length) {
  console.log(`ℹ ${curatedOnly.length} row(s) are curated-only — not in the feed, so they do NOT render on /events:`);
  for (const r of curatedOnly) console.log(`    ${r.name}  (curated slug: ${r.curatedSlug ?? "—"})`);
  console.log("");
}

if (CHECK_URLS) {
  console.log("Destination status:");
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
  for (const r of rows) {
    const url = `https://www.ppatour-asia.com/tournament/${r.path}/`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      console.log(`    ${String(res.status).padEnd(4)} ${r.name}`);
    } catch (e) {
      console.log(`    ERR  ${r.name} — ${e.message}`);
    }
  }
  console.log("");
}

if (!unmatched.length && !missing.length) {
  console.log("✓ Every Asia feed event has a row, and every row matches a feed event.");
}

// ⚠ `process.exitCode`, never `process.exit()`. Tearing the process down while
// the fetch keep-alive sockets are open trips a libuv assertion on Windows
// ("!(handle->flags & UV_HANDLE_CLOSING)") and the script exits 127 — a clean
// pass that reads as a broken audit. Observed intermittently on the first run.
process.exitCode = unmatched.length || missing.length ? 1 : 0;
