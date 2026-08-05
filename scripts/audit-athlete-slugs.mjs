/**
 * Audit `lib/data/published-athletes.json` for duplicate athlete profiles.
 *
 *   npm run athletes:audit
 *
 * The published roster is a scrape of ppatour.com's WordPress profiles, and its
 * `slug` is supposed to BE the Partner API's `player_slug` — that join is what
 * puts a live rank, points and headshot on a profile. WordPress breaks it by
 * minting a `-2` slug for a second post under an existing name: four of those
 * shipped as duplicate pages (elsie-hendershot-2, danna-funaro-2, ella-cosma-2,
 * edward-perez-2), each one winning on /athletes over the canonical profile
 * because that grid is built from the scrape.
 *
 * ⚠ THE SUFFIX IS NOT THE TEST. `luana-stanciu-1` is the API's own canonical
 * slug (no `luana-stanciu` exists on the board), and `ben-johns-3` /
 * `patrick-smith-10` are real, different players who share a name with a
 * higher-ranked pro. Only the board can tell the cases apart, which is why this
 * is a script against the live API and not a regex.
 *
 * Reports, and exits 1 on anything in the first three classes:
 *   1. duplicate slug or duplicate name inside the file
 *   2. a slug the board doesn't know while it knows exactly one player with
 *      that name  → that slug is a duplicate, use the board's
 *   3. a slug that is another record's slug plus a numeric suffix
 *   4. FYI: names the board carries twice (two real players — never collapse)
 *
 * Needs PB_API_TOKEN (read from .env.local, or the environment in CI).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env.local for local runs; real env wins (CI/Vercel).
if (existsSync(join(REPO, ".env.local"))) {
  for (const line of readFileSync(join(REPO, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const token = process.env.PB_API_TOKEN;
const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");

const normName = (n) =>
  n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const published = JSON.parse(
  readFileSync(join(REPO, "lib/data/published-athletes.json"), "utf8"),
);
console.log(`published records: ${published.length}`);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`  ✗ ${msg}`);
};

/* ── 1. duplicates inside the file (no API needed) ──────────────────────── */
console.log("\n1. duplicate slugs / names in the file");
const bySlug = new Map();
const byName = new Map();
for (const p of published) {
  if (!bySlug.has(p.slug)) bySlug.set(p.slug, []);
  bySlug.get(p.slug).push(p.name);
  const n = normName(p.name);
  if (!byName.has(n)) byName.set(n, []);
  byName.get(n).push(p.slug);
}
for (const [slug, names] of bySlug) if (names.length > 1) fail(`slug "${slug}" appears ${names.length}×`);
for (const [name, slugs] of byName) if (slugs.length > 1) fail(`name "${name}" appears as ${slugs.join(", ")}`);

/* ── 3. suffix siblings of another record (no API needed) ───────────────── */
console.log("\n3. numeric-suffix siblings of another record in the file");
for (const p of published) {
  const stem = p.slug.replace(/-\d+$/, "");
  if (stem !== p.slug && bySlug.has(stem)) fail(`"${p.slug}" duplicates "${stem}"`);
}
if (!failures) console.log("  ok");

/* ── 2. slugs the board doesn't know ────────────────────────────────────── */
console.log("\n2. slugs checked against the live WPR boards");
if (!token) {
  console.log("  ⚠ SKIPPED — no PB_API_TOKEN. Classes 1 and 3 still ran.");
} else {
  const board = [];
  for (const gender of ["F", "M"]) {
    let total = Infinity;
    for (let page = 1; page <= 10 && board.filter((b) => b.gender === gender).length < total; page++) {
      const params = new URLSearchParams({
        partner: "ppa", division_type: "8", gender, race: "false", is_live: "false",
        bracket_level_id: "2", current_page: String(page), page_size: "250",
        rank: new Date().toISOString().slice(0, 10),
      });
      let json = null;
      for (let attempt = 0; attempt < 6 && !json; attempt++) {
        const res = await fetch(`${base}/v2/data/partner_rankings?${params}`, {
          headers: { "PB-API-TOKEN": token },
        });
        if (res.ok) json = await res.json();
        else if (res.status === 429) await sleep(2000 * 2 ** attempt);
        else break;
      }
      if (!json) break;
      total = json.total_records ?? 0;
      const rows = (json.results?.player_rankings ?? []).filter((p) => (p.points ?? 0) > 0);
      if (!rows.length) break;
      for (const r of rows) {
        board.push({ slug: r.player_slug, name: r.player_full_name, gender, rank: Number.parseInt(r.ranking, 10) || 0 });
      }
      await sleep(800);
    }
  }
  console.log(`  board rows: ${board.length}`);
  if (!board.length) {
    console.log("  ⚠ the API returned nothing — cannot check this class");
  } else {
    const boardSlugs = new Set(board.map((b) => b.slug));
    const boardByName = new Map();
    for (const b of board) {
      const n = normName(b.name);
      if (!boardByName.has(n)) boardByName.set(n, []);
      boardByName.get(n).push(b);
    }
    let checked = 0;
    for (const p of published) {
      if (boardSlugs.has(p.slug)) continue;
      const matches = boardByName.get(normName(p.name)) ?? [];
      if (matches.length === 1) {
        fail(`"${p.slug}" is not on the board; "${matches[0].slug}" (#${matches[0].rank} ${matches[0].gender}) is the same name — publish that slug`);
      }
      checked += 1;
    }
    console.log(`  ${checked} published slugs are absent from the board (unranked players — expected)`);

    /* ── 4. FYI ─────────────────────────────────────────────────────────── */
    console.log("\n4. FYI — names the board carries more than once (real distinct players, never collapse)");
    for (const [name, rows] of boardByName) {
      if (rows.length > 1) {
        console.log(`  ${name}: ${rows.map((r) => `${r.slug} (#${r.rank} ${r.gender})`).join(", ")}`);
      }
    }
  }
}

console.log(failures ? `\nFAIL — ${failures} issue(s)` : "\nPASS — no duplicate profiles");
process.exit(failures ? 1 : 0);
