#!/usr/bin/env node
/**
 * Snapshot the World Pickleball Rankings boards to `lib/data/wpr-snapshot.json`.
 *
 * ⚠ THIS EXISTS BECAUSE RENDERING A PAGE SHOULD NOT COST TEN UPSTREAM CALLS.
 * `getWprPlayerBySlug`, `getRankingBySlug` and `getWprIndex` all read the WHOLE
 * board (correctly — see the 9/4 note about 17 profiles blanking at rank 251+),
 * which is up to six pages for the men's board and four for the women's. That
 * is fine ONCE. It is not fine per render, and on 9/5 it was measured at 6.1K
 * `partner_rankings` calls in an hour from `/athletes/[slug]` alone, with pages
 * taking 17-30s and never caching.
 *
 * It is also what was breaking the BUILD. `next build` fans out across 29
 * worker processes, each with its own module cache, all paging the same boards
 * while the partner API throttles them — the tail of the build crawled at about
 * a minute a page, and only 132 of 203 athletes came out prerendered. The other
 * 71 (Ben Johns, Anna Leigh Waters and Hunter Johnson among them — the
 * most-visited pages on the site) fell back to being rendered on every request,
 * which then kept us throttled. A loop that got worse with every deploy.
 *
 * With a snapshot on disk the boards cost ZERO calls at render and at build, so
 * every athlete prerenders and a page view makes no ranking request at all.
 *
 * Usage:
 *   node scripts/snapshot-rankings.mjs          # write the snapshot
 *   node scripts/snapshot-rankings.mjs --check  # verify without writing
 *
 * ⚠ FAILS SOFT ON PURPOSE. If the API is unreachable or throttled this exits 0
 * and leaves the previous snapshot in place, because a stale board is a far
 * better outcome than a build that either dies or silently ships no rankings.
 * It only exits non-zero if it fetched something and that something looked
 * wrong — see the sanity floor below.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("lib/data/wpr-snapshot.json");
const PAGE_SIZE = 250;
const MAX_PAGES = 10;
const PRO_BRACKET = 2;
const WORLD_DIVISION_TYPE = 8;
/** Below this a board is not credible — refuse to overwrite a good snapshot. */
const MIN_PLAYERS = 200;

function env(name) {
  if (process.env[name]) return process.env[name];
  // .env.local is not loaded for a bare `node` run.
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).replace(/^["']|["']$/g, "").trim();
  }
  return undefined;
}

const TOKEN = env("PB_API_TOKEN");
const BASE = (env("PB_API_BASE_URL") || "https://api.pickleball.com").replace(/\/$/, "");

/** Exactly the fields `mapPlayer` in lib/rankings-api.ts reads — nothing else. */
const pick = (p) => ({
  ranking: p.ranking,
  is_tied: p.is_tied,
  player_slug: p.player_slug,
  player_full_name: p.player_full_name,
  points: p.points,
  total_events_played: p.total_events_played,
  prize_money: p.prize_money,
  country: p.country,
  player_country_two_digit_abbreviation: p.player_country_two_digit_abbreviation,
  profile_image: p.profile_image,
});

async function page(gender, current) {
  const params = new URLSearchParams({
    partner: "ppa",
    division_type: String(WORLD_DIVISION_TYPE),
    gender,
    race: "false",
    is_live: "false",
    bracket_level_id: String(PRO_BRACKET),
    current_page: String(current),
    page_size: String(PAGE_SIZE),
    rank: new Date().toISOString().slice(0, 10),
  });
  const res = await fetch(`${BASE}/v2/data/partner_rankings?${params}`, {
    headers: { "PB-API-TOKEN": TOKEN },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`partner_rankings ${gender} p${current}: HTTP ${res.status}`);
  const json = await res.json();
  return {
    players: json.results?.player_rankings ?? [],
    total: json.total_records ?? 0,
  };
}

async function board(gender) {
  const players = [];
  let total = Infinity;
  for (let p = 1; p <= MAX_PAGES && players.length < total; p++) {
    const got = await page(gender, p);
    if (got.players.length === 0) break;
    players.push(...got.players.map(pick));
    total = got.total;
    // Gentle on an API we have been throttled by today.
    if (players.length < total) await new Promise((r) => setTimeout(r, 250));
  }
  return { total: Number.isFinite(total) ? total : players.length, players };
}

async function main() {
  const check = process.argv.includes("--check");
  if (!TOKEN) {
    console.log("[wpr-snapshot] no PB_API_TOKEN — leaving any existing snapshot alone.");
    return;
  }

  let boards;
  try {
    const [M, F] = await Promise.all([board("M"), board("F")]);
    boards = { M, F };
  } catch (err) {
    console.log(`[wpr-snapshot] upstream unavailable (${err.message}) — keeping existing snapshot.`);
    return;
  }

  for (const [g, b] of Object.entries(boards)) {
    if (b.players.length < MIN_PLAYERS) {
      console.error(
        `[wpr-snapshot] ${g} came back with only ${b.players.length} players (floor ${MIN_PLAYERS}). ` +
          `Refusing to overwrite — this looks like a truncated response, not a smaller tour.`,
      );
      process.exitCode = 1;
      return;
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    boards,
  };
  const summary = Object.entries(boards)
    .map(([g, b]) => `${g} ${b.players.length}/${b.total}`)
    .join(" · ");

  if (check) {
    console.log(`[wpr-snapshot] --check OK: ${summary}`);
    return;
  }

  writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
  const kb = (Buffer.byteLength(JSON.stringify(payload)) / 1024).toFixed(0);
  console.log(`[wpr-snapshot] wrote ${OUT} — ${summary} (${kb} KB)`);
}

main();
