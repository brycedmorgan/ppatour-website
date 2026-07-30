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
import { PRIOR_YEAR } from "./prior-year-stops.mjs";

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
