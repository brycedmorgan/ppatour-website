#!/usr/bin/env node
/**
 * Generate last season's champions per division for each recurring tour stop.
 *
 *   node scripts/gen-defending-champions.mjs           # every mapped stop
 *
 * Writes:
 *   lib/data/defending-champions.json   (what lib/defending-champions.ts reads)
 *
 * Requires PB_API_TOKEN (the Pickleball.com partner token, same one the events /
 * rankings / brackets adapters use). Load it however you normally do, e.g.
 *   set -a && . ./.env.local && set +a && node scripts/gen-defending-champions.mjs
 *
 * Source — a stored procedure on the only SP gateway our token may call
 * (`API_v2_Tourney_GetDetails` and `API_v2_Tourney_GetEvents` are the sole
 * allowlisted names; see docs/DATA-ASKS.md):
 *
 *   POST {base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents
 *   header  PB-API-TOKEN: <token>
 *   body    { "EventID": "<prior-year tournament_uuid>" }
 *   → { payload: [ { GoldTeamName, SilverTeamName, BronzeTeamName,
 *                    BracketLevelTitle, NoMedalWasAwarded, PlayerGroupTitle,
 *                    FormatTitle, ... } ] }
 *
 * Why this is committed data and not a runtime fetch: prior-season results never
 * change, and one response carries EVERY division of the tournament (Pro +
 * Amateur + Junior, ~130 rows x ~180 fields = about 3 MB) — past Next's 2 MB Data
 * Cache ceiling, so it refuses to cache and would re-download on every render.
 * Distilled here to ~6 KB.
 *
 * Re-run when the season rolls over (add next year's stops to PRIOR_YEAR) or
 * when a mapping is corrected.
 */
import { writeFileSync } from "node:fs";

/**
 * `{year}/{slug}` of this year's stop -> `tournament_uuid` of the prior-year
 * event whose champions defend at it. Keyed on year+slug because that is the
 * pair the event page routes on (a curated record wins there, and curated
 * records carry no `tournament_uuid`).
 *
 * Confirmed by Bryce/Wesley 2026-07-29 against the `ppa_tournaments` feed.
 * Working rule: **same tier (open/cup/slam) + same venue or city = the same
 * annual stop.** Titles drift as sponsors change — never match on title.
 *
 * Deliberately absent, so they keep the "confirmed once last season's champions
 * are set" fallback: Veolia Pickleball National Championships · Greater Zion Cup
 * · Veolia Arizona Open · Newport Beach Open · Veolia Chicago Cup · Veolia
 * Malibu Cup.
 */
const PRIOR_YEAR = {
  // <- 2025 Masters (Mission Hills, Rancho Mirage)
  "2026/carvana-ppa-masters-powered-by-invited": "2a35d3a1-bb1a-474b-9986-897a09de73b1",
  // <- 2024 Lakeville MN (Lifetime Lakeville). Tier reads slam-vs-open, but
  // Wesley confirmed it's the same stop returning.
  "2026/indoor-national-championships": "cfc270b2-59e0-4b68-ae6f-9504e63c89e7",
  // <- 2025 Veolia Cape Coral Open (venue moved within Cape Coral)
  "2026/zimmer-biomet-cape-coral-open": "923b6d24-15ac-4ed0-860b-f83b52863e3e",
  // <- 2025 Carvana Mesa Cup (Arizona Athletic Grounds)
  "2026/carvana-mesa-cup": "c19054b4-056e-474a-993c-46091b3f397e",
  // <- 2025 CIBC Texas Open (McKinney)
  "2026/veolia-texas-open": "3e4dfb79-372b-4e49-805e-aff3ebdb469f",
  // <- 2025 Pickleball Central Sacramento Vintage Open (Life Time Arden)
  "2026/sacramento-open": "64bbc71e-f0e2-425a-97f5-4a45ac47ee3e",
  // <- 2025 Veolia Atlanta Pickleball Championships
  "2026/veolia-atlanta-pickleball-championships": "9c61faee-196b-4c55-9ba0-e99b641f93bf",
  // <- 2024 CIBC The Finals (no 2025 Finals was held). "Only for now" per
  // Wesley — revisit if a 2025 predecessor is designated.
  "2026/ppa-finals": "2e5f903e-93e3-4463-a85c-c08ef65b62dd",
  // <- 2024 Guaranteed Rate Las Vegas Open (Darling Tennis Center). The Vegas
  // *Cup* lineage (2024 LV Pickleball Cup -> 2025 Rate Vegas Cup) is a SEPARATE
  // event — do not link it here.
  "2026/rate-las-vegas-open": "068f6d56-97d9-42c9-87f5-54c2e7d3040f",
  // <- 2025 Fasenra Virginia Beach Cup. Same venue and October slot, re-tiered
  // Cup -> Open; Wesley confirmed it's one lineage.
  "2026/virginia-beach-open": "2b3050b3-8f87-45b5-bf44-0f056c1bd305",
  // <- 2025 Pickleball World Championships (Brookhaven CC, Farmers Branch)
  "2026/pickleball-world-championships": "f02fa839-68e0-46d5-8b93-dc266f201a4e",
  // <- 2025 Daytona Beach Open (Pictona at Holly Hill)
  "2026/florida-open": "1259f4ea-2fc6-40d2-b172-c89bd3e5caae",
};

/** Display order, matching the event page's DIVISIONS list. */
const DIVISION_ORDER = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

/** "Mens" + "Doubles" -> "Men's Doubles"; Mixed is always doubles. */
function divisionLabel(row) {
  const group = (row.PlayerGroupTitle ?? "").trim().toLowerCase();
  const format = (row.FormatTitle ?? "").trim().toLowerCase();
  if (group === "mixed") return "Mixed Doubles";
  const who = group === "mens" ? "Men's" : group === "womens" ? "Women's" : null;
  const what = format === "singles" ? "Singles" : format === "doubles" ? "Doubles" : null;
  return who && what ? `${who} ${what}` : null;
}

async function podium(base, token, uuid) {
  const res = await fetch(`${base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
    method: "POST",
    headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
    body: JSON.stringify({ EventID: uuid }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const found = new Map();
  for (const row of json.payload ?? []) {
    // Pro main draws only: the feed also carries Amateur/Junior, and every
    // division has a medal-less qualifier row that would render blank.
    if (row.BracketLevelTitle !== "Pro") continue;
    if (row.NoMedalWasAwarded) continue;
    const gold = (row.GoldTeamName ?? "").trim();
    if (!gold) continue;
    const division = divisionLabel(row);
    if (!division || found.has(division)) continue;
    found.set(division, gold);
  }
  return DIVISION_ORDER.filter((d) => found.has(d)).map((d) => ({
    division: d,
    name: found.get(d),
  }));
}

async function main() {
  const token = process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN is not set");
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");

  const out = {};
  for (const [key, uuid] of Object.entries(PRIOR_YEAR)) {
    try {
      const champs = await podium(base, token, uuid);
      if (champs.length) out[key] = champs;
      console.log(`${champs.length ? "ok   " : "EMPTY"} ${key}  (${champs.length} divisions)`);
    } catch (err) {
      console.error(`FAIL ${key}: ${err.message}`);
    }
  }

  const path = "lib/data/defending-champions.json";
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nwrote ${path} — ${Object.keys(out).length}/${Object.keys(PRIOR_YEAR).length} stops`);
}

main();
