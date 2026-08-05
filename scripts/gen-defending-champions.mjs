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

/**
 * ⚠ A DIVISION CAN HAVE MORE THAN ONE MEDAL-BEARING PRO DRAW, AND THE FIRST IS
 * NOT ALWAYS THE CHAMPIONSHIP.
 *
 * The 2026 PPA Finals runs an open "Pro Main Draw" (single elimination off a
 * Monday qualifier) AND a "Pro Top 8 Ranked" invitational round-robin. The
 * invitational is the Finals. Taking the first Pro row would name Tama
 * Shimabukuro & Yuta Funemizu the 2026 men's doubles champions instead of Ben
 * Johns & Gabriel Tardio, in all five divisions.
 *
 * This file is currently unaffected — its one Finals mapping is the 2024 CIBC
 * The Finals, which ran a single round-robin draw per division, so the committed
 * defending-champions.json is right. The guard is here because the moment
 * PRIOR_YEAR maps the 2027 Finals to the 2026 one, it would not be.
 *
 * Kept in step with scripts/gen-tournament-history.mjs and
 * lib/tournament-history.ts, which share this rule.
 */
const CHAMPIONSHIP_DRAW = /\btop\s*\d+\b|\bchampionship\b|\binvitational\b/i;
const BY_INVITATION = /by\s+invitation/i;

function pickChampionshipDraw(rows) {
  if (rows.length === 1) return rows[0];
  return (
    rows.find(
      (r) => CHAMPIONSHIP_DRAW.test(r.Title ?? "") || BY_INVITATION.test(r.SubTitle ?? ""),
    ) ?? rows[0]
  );
}

async function podium(base, token, uuid) {
  const res = await fetch(`${base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
    method: "POST",
    headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
    body: JSON.stringify({ EventID: uuid }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  // Collect candidates per division, then choose — see pickChampionshipDraw.
  // Pro only: the feed also carries Amateur/Junior, and every division has a
  // medal-less qualifier row that would render blank.
  const byDivision = new Map();
  for (const row of json.payload ?? []) {
    if (row.BracketLevelTitle !== "Pro") continue;
    if (row.NoMedalWasAwarded) continue;
    if (!(row.GoldTeamName ?? "").trim()) continue;
    const division = divisionLabel(row);
    if (!division) continue;
    if (!byDivision.has(division)) byDivision.set(division, []);
    byDivision.get(division).push(row);
  }
  return DIVISION_ORDER.filter((d) => byDivision.has(d)).map((d) => ({
    division: d,
    name: (pickChampionshipDraw(byDivision.get(d)).GoldTeamName ?? "").trim(),
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
