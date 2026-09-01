/**
 * Audit the PPA Tour Canada link table against the live tournaments feed, the
 * curated calendar, and the Canada tour's own site.
 *
 *   npm run canada:audit             report
 *   npm run canada:audit -- --check  also fetch every URL in the table
 *
 * `lib/canada-tour-links.ts` points the Canada stops at ppatourcanada.ca
 * (Wesley, 9/1). Two of the three are NOT in the `ppa_tournaments` feed, so this
 * audit differs from the Asia and Australia ones in an important way: a row with
 * no feed match is only a failure if it also has no curated row backing it.
 *
 * Exits 1 on any of:
 *   1. A row that matches NEITHER a feed event NOR a curated calendar row — it
 *      links nothing, so it is dead config.
 *   2. A curated-only row whose calendar entry lacks `showWhenAbsentFromFeed`,
 *      i.e. the link is configured but the card never renders.
 *   3. With --check: a URL that does not resolve to a real page.
 * Reports without failing:
 *   4. "PPA Tour Canada" feed events with no row (still on pickleballtournaments).
 *
 * ⚠ Their site SOFT-404s nothing today, but it does answer 404 with a full
 * themed page, so a URL only counts as real if its title is not "Page not found".
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_URLS = process.argv.includes("--check");
const CA_HOST = "ppatourcanada.ca";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

/**
 * The link table, parsed out of the TS source so this stays a plain `node`
 * script. THROWS below 3 rows — a parser that silently stopped matching would
 * report "everything is fine" for a table it never read.
 */
function readTable() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "canada-tour-links.ts"), "utf8");
  const body = src.slice(src.indexOf("CANADA_TOUR_EVENTS: readonly"));
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
  if (rows.length < 3) {
    throw new Error(
      `Parsed only ${rows.length} rows out of lib/canada-tour-links.ts — the shape changed. Fix this parser before trusting the report.`,
    );
  }
  return rows;
}

/**
 * Curated calendar rows for Canada, with the slug the builder derives and
 * whether they carry the merge opt-in. Parsed from the SCHEDULE literal.
 */
function readCuratedCanada() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "placeholder-data.ts"), "utf8");
  const kebab = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const rows = [];
  for (const m of src.matchAll(/\{\s*name:\s*"(PPA Canada[^"]+)",([^}]*)\}/g)) {
    rows.push({
      name: m[1],
      slug: kebab(m[1]),
      start: /start:\s*"([^"]+)"/.exec(m[2])?.[1] ?? null,
      end: /end:\s*"([^"]+)"/.exec(m[2])?.[1] ?? null,
      merge: /showWhenAbsentFromFeed:\s*true/.test(m[2]),
    });
  }
  if (rows.length < 3) {
    throw new Error(
      `Parsed only ${rows.length} curated "PPA Canada" rows — the SCHEDULE shape changed. Fix this parser.`,
    );
  }
  return rows;
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
  return { all, ca: all.filter((t) => t.organization_name === "PPA Tour Canada") };
}

const ptSlugOf = (url) =>
  /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(url ?? "")?.[1]?.toLowerCase() ?? null;

/* ---- report ---- */

const env = loadEnv();
const rows = readTable();
const curated = readCuratedCanada();
const { all, ca } = await fetchFeed(env);

console.log(
  `Table: ${rows.length} Canada events - Feed: ${ca.length} "PPA Tour Canada" row(s) of ${all.length} - Curated: ${curated.length} PPA Canada row(s)\n`,
);

const byUuid = new Map(all.map((t) => [t.tournament_uuid, t]));
const bySlug = new Map();
for (const t of all) {
  const s = ptSlugOf(t.details_url);
  if (s) bySlug.set(s, t);
}
const curatedBySlug = new Map(curated.map((c) => [c.slug, c]));

let failed = false;

/* 1 — rows backed by nothing at all. */
const dead = rows.filter(
  (r) =>
    !byUuid.has(r.uuid ?? "") &&
    !bySlug.has(r.ptSlug ?? "") &&
    !curatedBySlug.has(r.curatedSlug ?? ""),
);
if (dead.length) {
  failed = true;
  console.log(`FAIL ${dead.length} row(s) match NO feed event and NO curated row — dead config:`);
  for (const r of dead) console.log(`    ${r.name}`);
  console.log("");
}

/* 2 — curated-only rows whose calendar entry will never render. */
const feedless = rows.filter((r) => !byUuid.has(r.uuid ?? "") && !bySlug.has(r.ptSlug ?? ""));
const unrenderable = feedless.filter((r) => {
  const c = curatedBySlug.get(r.curatedSlug ?? "");
  return c && !c.merge;
});
if (unrenderable.length) {
  failed = true;
  console.log(
    `FAIL ${unrenderable.length} curated-only row(s) whose calendar entry lacks showWhenAbsentFromFeed — the link is set but no card renders:`,
  );
  for (const r of unrenderable) console.log(`    ${r.name}  (curatedSlug: ${r.curatedSlug})`);
  console.log("");
}

if (feedless.length) {
  console.log(`INFO ${feedless.length} row(s) are curated-only (the feed has no row for them):`);
  for (const r of feedless) {
    const c = curatedBySlug.get(r.curatedSlug ?? "");
    console.log(`    ${r.name}  ${c ? `${c.start} to ${c.end}` : "(no curated row!)"}  merge=${c?.merge ?? false}`);
  }
  console.log("");
}

/* 4 — feed events with no row. */
const missing = ca.filter(
  (t) => !rows.some((r) => r.uuid === t.tournament_uuid || r.ptSlug === ptSlugOf(t.details_url)),
);
if (missing.length) {
  console.log(
    `INFO ${missing.length} "PPA Tour Canada" feed event(s) have no row — still linking to pickleballtournaments.com:`,
  );
  for (const t of missing) console.log(`    ${t.start_date?.slice(0, 10)}  ${t.title}`);
  console.log("");
}

/* 3 — reachability. */
if (CHECK_URLS) {
  console.log("Fetching every URL in the table:");
  for (const r of rows) {
    const url = `https://${CA_HOST}/tournament/${r.path}/`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const html = await res.text();
      const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
      const bad = res.status !== 200 || /page not found/i.test(title);
      if (bad) failed = true;
      console.log(`    ${bad ? "FAIL" : "ok  "} ${res.status}  ${r.path}  —  ${title}`);
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
  console.log("OK — every row resolves to a feed event or a renderable curated row.");
}
