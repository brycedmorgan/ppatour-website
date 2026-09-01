/**
 * Audit the PPA Tour Australia link table against the live tournaments feed AND
 * against the Australia tour's own site.
 *
 *   npm run australia:audit             report
 *   npm run australia:audit -- --check  also fetch every URL in the table
 *
 * `lib/australia-tour-links.ts` repoints the Australia stops from their
 * pickleballtournaments.com listing to ppatour.com.au (Wesley, 9/1). It matches
 * on `tournament_uuid` first, then the permalink, and FAILS SAFE: an unmatched
 * event silently keeps the old link. Silent is the problem — this is the check
 * that makes the drift visible.
 *
 * Exits 1 on either of the first two:
 *   1. Rows in the table that match no event in the feed (a stale entry, or a
 *      reissued UUID — those stops are back on the platform link).
 *   2. Rows whose UUID and permalink disagree about which event they name.
 * Reports without failing:
 *   3. "PPA Tour Australia" feed events with no row — they link to
 *      pickleballtournaments.com today. Unlike Asia, this is the EXPECTED state
 *      for most of them: their site publishes a page for only some stops.
 *   4. Pages that exist on ppatour.com.au but are NOT in the table — the
 *      actionable half of 3, read from their own WordPress index. A new page
 *      there is a row we should add.
 *   5. With --check: the HTTP status and title of every URL in the table.
 *      NOTE their site SOFT-404s missing paths with a 200 in some cases, so a
 *      page only counts as real if its title is not "Page not found".
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_URLS = process.argv.includes("--check");
const AU_HOST = "ppatour.com.au";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
 * Parsed out of the TS source so this stays a plain `node` script with no build
 * step (same approach as audit-asia-links.mjs).
 *
 * IT THROWS BELOW 8 ROWS. A regex that stopped matching after a refactor would
 * otherwise report "everything is fine" for a table it never read.
 */
function readTable() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "australia-tour-links.ts"), "utf8");
  const body = src.slice(src.indexOf("AUSTRALIA_TOUR_EVENTS"));
  const rows = [];
  for (const m of body.matchAll(/\{\s*(?:\/\/[^\r\n]*[\r\n]+\s*)*name:\s*"([^"]+)",[\s\S]*?\}/g)) {
    const block = m[0];
    rows.push({
      name: m[1],
      path: /path:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
      uuid: /uuid:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
      ptSlug: /ptSlug:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
      curatedSlug: /curatedSlug:\s*"([^"]+)"/.exec(block)?.[1] ?? null,
    });
  }
  if (rows.length < 8) {
    throw new Error(
      `Parsed only ${rows.length} rows out of lib/australia-tour-links.ts — the shape changed. Fix this parser before trusting the report.`,
    );
  }
  return rows;
}

/* ---- feed ---- */

const NON_TOUR_NAME = /minor league|the dink\b|dink minor/i;

/** Mirrors `isJunk` in lib/events-api.ts — rows that never reach /events. */
function isJunk(t) {
  return (
    t.is_canceled ||
    t.is_stub ||
    t.is_advertise_only ||
    t.tournament_status === "Cancelled" ||
    /additional events/i.test(t.title) ||
    /\btemplate\b|\btest event\b|\bTBD\b/i.test(t.title) ||
    NON_TOUR_NAME.test(t.title) ||
    !t.start_date
  );
}

async function fetchFeed(env) {
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
  const all = (await res.json()).results?.tournaments ?? [];
  return {
    all,
    aus: all.filter((t) => t.organization_name === "PPA Tour Australia" && !isJunk(t)),
  };
}

/** Tournament pages their own WordPress publishes. Null if unreachable. */
async function fetchTheirPages() {
  try {
    const res = await fetch(
      `https://${AU_HOST}/wp-json/wp/v2/tournaments?per_page=100&_fields=slug,title`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

const ptSlugOf = (url) =>
  /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(url ?? "")?.[1]?.toLowerCase() ?? null;

/* ---- report ---- */

const env = loadEnv();
const rows = readTable();
const { all, aus } = await fetchFeed(env);

console.log(
  `Table: ${rows.length} Australia events - Feed: ${all.length} rows, ${aus.length} rendering under "PPA Tour Australia"\n`,
);

const byUuid = new Map(all.map((t) => [t.tournament_uuid, t]));
const bySlug = new Map();
for (const t of all) {
  const s = ptSlugOf(t.details_url);
  if (s) bySlug.set(s, t);
}

let failed = false;

/* 1 — rows matching nothing in the feed. */
const unmatched = rows.filter((r) => !byUuid.has(r.uuid) && !(r.ptSlug && bySlug.has(r.ptSlug)));
if (unmatched.length) {
  failed = true;
  console.log(
    `FAIL ${unmatched.length} table row(s) match NO feed event — those stops are back on the platform link:`,
  );
  for (const r of unmatched) console.log(`    ${r.name}  (uuid: ${r.uuid})`);
  console.log("");
}

/* 2 — a row's two keys naming different events. */
const conflicted = rows.filter((r) => {
  const byU = byUuid.get(r.uuid);
  const byS = r.ptSlug ? bySlug.get(r.ptSlug) : null;
  return byU && byS && byU.tournament_uuid !== byS.tournament_uuid;
});
if (conflicted.length) {
  failed = true;
  console.log(`FAIL ${conflicted.length} row(s) whose uuid and ptSlug name DIFFERENT events:`);
  for (const r of conflicted) {
    console.log(`    ${r.name}`);
    console.log(`      uuid   -> ${byUuid.get(r.uuid)?.title}`);
    console.log(`      ptSlug -> ${bySlug.get(r.ptSlug)?.title}`);
  }
  console.log("");
}

/* 3 — feed events with no row (expected for most; informational). */
const missing = aus.filter((t) => !rows.some((r) => r.uuid === t.tournament_uuid));
if (missing.length) {
  console.log(
    `INFO ${missing.length} rendering "PPA Tour Australia" event(s) have no row — they link to pickleballtournaments.com:`,
  );
  for (const t of [...missing].sort((a, b) => a.start_date.localeCompare(b.start_date))) {
    console.log(`    ${t.start_date.slice(0, 10)}  ${t.title}`);
  }
  console.log("");
}

/* 4 — pages on their site that we do not use. */
const theirs = await fetchTheirPages();
if (!theirs) {
  console.log(
    `INFO could not read https://${AU_HOST}/wp-json/wp/v2/tournaments — skipped the new-page check.\n`,
  );
} else {
  const known = new Set(rows.map((r) => r.path));
  const extra = theirs.filter((p) => !known.has(p.slug));
  console.log(
    `INFO ${AU_HOST} publishes ${theirs.length} tournament page(s); the table uses ${rows.length}.`,
  );
  if (extra.length) {
    console.log(`     ${extra.length} page(s) exist that we do NOT link to — candidates to add:`);
    for (const p of extra) console.log(`       ${p.slug}  —  ${p.title?.rendered ?? ""}`);
  }
  console.log("");
}

/* 5 — reachability. */
if (CHECK_URLS) {
  console.log("Fetching every URL in the table:");
  for (const r of rows) {
    const url = `https://${AU_HOST}/tournaments/${r.path}/`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const html = await res.text();
      const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
      // A soft 404 answers 200 — the title is the real test.
      const dead = res.status !== 200 || /page not found/i.test(title);
      if (dead) failed = true;
      console.log(`    ${dead ? "FAIL" : "ok  "} ${res.status}  ${r.path}  —  ${title}`);
    } catch (err) {
      failed = true;
      console.log(`    FAIL ERR  ${r.path}  —  ${err.message}`);
    }
  }
  console.log("");
}

if (failed) {
  console.log("FAILED — see the FAIL lines above.");
  process.exitCode = 1;
} else {
  console.log("OK — every row matches a feed event.");
}
