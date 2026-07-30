#!/usr/bin/env node
/**
 * Generate the storyline angles behind "Players to Watch".
 *
 *   node scripts/gen-watch-angles.mjs
 *
 * Writes:
 *   lib/data/watch-angles.json   (what lib/players-to-watch.ts reads)
 *
 * Requires PB_API_TOKEN. Load it however you normally do, e.g.
 *   set -a && . ./.env.local && set +a && node scripts/gen-watch-angles.mjs
 *
 * Produces three angles, each a fact we can state on a card:
 *
 *   risers        biggest climbers in the World Pickleball Ranking, capped to
 *                 players now inside the top 25 so the pick is always a name a
 *                 fan knows. `rank=<date>` on partner_rankings is a real as-of
 *                 date (verified), so this is a genuine before/after comparison.
 *   sliding       the same comparison downward. NOTE points are often unchanged
 *                 — a player usually slips because others passed them, not
 *                 because they lost anything, so `lostPoints` records which it
 *                 was. Never call someone "falling" when lostPoints is false.
 *   silverNoGold  players who took multiple silvers but no gold across last
 *                 season's stops — due for a breakthrough.
 *
 * Re-run when the season is active (it is a point-in-time snapshot; `asOf` and
 * `comparedTo` are written into the file so the site can be honest about the
 * window). Deliberately NOT computed per request: it needs four full ranking
 * boards, which is far too much to fetch on a page render.
 */
import { writeFileSync } from "node:fs";
import { PRIOR_YEAR } from "./prior-year-stops.mjs";

/** How far back to look for movement. Roughly a few events' worth of results. */
const LOOKBACK_DAYS = 90;
/** Only feature climbers/sliders who are inside this rank today. */
const TOP_N = 25;
/** Minimum places moved to be worth a card. */
const MIN_MOVE = 2;

function config() {
  const token = process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN is not set");
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

const iso = (d) => d.toISOString().slice(0, 10);

/** One complete gender board as of a date. */
async function board(base, token, gender, asOf) {
  const params = new URLSearchParams({
    partner: "ppa",
    division_type: "8", // the combined World Pickleball Ranking
    gender,
    race: "false",
    is_live: "false",
    bracket_level_id: "2",
    current_page: "1",
    page_size: "2000", // no ceiling found; one call takes the whole board
    rank: asOf,
  });
  const res = await fetch(`${base}/v2/data/partner_rankings?${params}`, {
    headers: { "PB-API-TOKEN": token },
  });
  if (!res.ok) throw new Error(`partner_rankings ${gender} ${asOf} -> HTTP ${res.status}`);
  const json = await res.json();
  const rows = json.results?.player_rankings ?? [];
  const out = new Map();
  for (const p of rows) {
    const rank = Number.parseInt(p.ranking, 10);
    // Zero-point players are excluded from the official board.
    if (!p.player_slug || !(p.points > 0) || !Number.isFinite(rank)) continue;
    out.set(p.player_slug, { rank, points: p.points, name: p.player_full_name });
  }
  return out;
}

/** Climbers and sliders inside the top N, biggest move first. */
function movement(before, after) {
  const risers = [];
  const sliding = [];
  for (const [slug, now] of after) {
    if (now.rank > TOP_N) continue;
    const then = before.get(slug);
    if (!then) continue; // newly ranked — no honest comparison
    const moved = then.rank - now.rank;
    if (moved >= MIN_MOVE) {
      risers.push({ slug, name: now.name, from: then.rank, to: now.rank, places: moved });
    } else if (-moved >= MIN_MOVE) {
      sliding.push({
        slug,
        name: now.name,
        from: then.rank,
        to: now.rank,
        places: -moved,
        // True only if they actually shed points; otherwise they were passed.
        lostPoints: now.points < then.points,
      });
    }
  }
  risers.sort((a, b) => b.places - a.places);
  sliding.sort((a, b) => b.places - a.places);
  return { risers, sliding };
}

const divisionLabel = (row) => {
  const g = (row.PlayerGroupTitle ?? "").trim().toLowerCase();
  const f = (row.FormatTitle ?? "").trim().toLowerCase();
  if (g === "mixed") return "Mixed Doubles";
  const who = g === "mens" ? "Men's" : g === "womens" ? "Women's" : null;
  const what = f === "singles" ? "Singles" : f === "doubles" ? "Doubles" : null;
  return who && what ? `${who} ${what}` : null;
};

/** Pro podium rows for one tournament. */
async function podium(base, token, uuid) {
  const res = await fetch(`${base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
    method: "POST",
    headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
    body: JSON.stringify({ EventID: uuid }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const seen = new Set();
  const out = [];
  for (const row of json.payload ?? []) {
    if (row.BracketLevelTitle !== "Pro" || row.NoMedalWasAwarded) continue;
    const division = divisionLabel(row);
    if (!division || seen.has(division)) continue;
    seen.add(division);
    out.push({
      division,
      gold: (row.GoldTeamName ?? "").trim(),
      silver: (row.SilverTeamName ?? "").trim(),
    });
  }
  return out;
}

/** "A & B" -> ["A", "B"], guarding the odd malformed team string. */
const splitTeam = (s) =>
  s
    .split("&")
    .map((x) => x.trim())
    .filter(Boolean);

async function main() {
  const { token, base } = config();
  const today = new Date();
  const past = new Date(today.getTime() - LOOKBACK_DAYS * 86400000);
  const asOf = iso(today);
  const comparedTo = iso(past);

  console.log(`ranking movement: ${comparedTo} -> ${asOf} (top ${TOP_N}, min ${MIN_MOVE} places)`);
  const out = {
    asOf,
    comparedTo,
    lookbackDays: LOOKBACK_DAYS,
    movement: {},
    silverNoGold: [],
    tripleCrowns: [],
    topRanked: {},
    runnersUp: {},
  };

  for (const [key, gender] of [
    ["men", "M"],
    ["women", "F"],
  ]) {
    const [before, after] = await Promise.all([
      board(base, token, gender, comparedTo),
      board(base, token, gender, asOf),
    ]);
    const { risers, sliding } = movement(before, after);
    out.movement[key] = { risers, sliding };

    // Current World Pickleball Ranking No. 1 for this gender. Used on brand-new
    // stops, which have no prior-year champions or runners-up to draw on.
    const leader = [...after.values()].sort((a, b) => a.rank - b.rank)[0];
    if (leader) {
      out.topRanked[key] = { name: leader.name, rank: leader.rank, points: leader.points };
      console.log(`  ${key} No. 1: ${leader.name} (${leader.points})`);
    }
    console.log(`  ${key}: ${risers.length} risers, ${sliding.length} sliding`);
    risers.slice(0, 3).forEach((r) => console.log(`     up   ${r.name} ${r.from}->${r.to}`));
    sliding.slice(0, 3).forEach((r) =>
      console.log(`     down ${r.name} ${r.from}->${r.to}${r.lostPoints ? " (lost points)" : " (passed)"}`),
    );
  }

  // Silver-but-no-gold across last season's completed stops.
  const tj = await fetch(`${base}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
    headers: { "PB-API-TOKEN": token },
  }).then((r) => r.json());
  const stops = (tj.results?.tournaments ?? []).filter(
    (t) =>
      (t.start_date || "").startsWith("2025") &&
      /Completed/i.test(t.tournament_status || "") &&
      /PPA Tour:/i.test(t.title || "") &&
      !t.is_stub &&
      !t.is_canceled,
  );
  console.log(`\nscanning ${stops.length} completed 2025 stops for silver-no-gold`);

  const golds = new Map();
  const silvers = new Map();
  /** name -> event titles where they swept singles + gender doubles + mixed. */
  const crowns = new Map();
  for (const t of stops) {
    const rows = await podium(base, token, t.tournament_uuid);
    // Triple crown = all three disciplines won at the SAME stop.
    const kindsByPlayer = new Map();
    for (const row of rows) {
      for (const p of splitTeam(row.gold)) golds.set(p, (golds.get(p) ?? 0) + 1);
      for (const p of splitTeam(row.silver)) silvers.set(p, (silvers.get(p) ?? 0) + 1);
      const kind = /Singles/.test(row.division)
        ? "singles"
        : /Mixed/.test(row.division)
          ? "mixed"
          : "doubles";
      for (const p of splitTeam(row.gold)) {
        if (!kindsByPlayer.has(p)) kindsByPlayer.set(p, new Set());
        kindsByPlayer.get(p).add(kind);
      }
    }
    const title = (t.title ?? "").replace(/^PPA Tour:\s*/i, "").trim();
    for (const [p, kinds] of kindsByPlayer) {
      if (kinds.has("singles") && kinds.has("doubles") && kinds.has("mixed")) {
        if (!crowns.has(p)) crowns.set(p, []);
        crowns.get(p).push(title);
      }
    }
  }
  out.tripleCrowns = [...crowns.entries()]
    .map(([name, events]) => ({ name, count: events.length, events }))
    .sort((a, b) => b.count - a.count);
  console.log(`  ${out.tripleCrowns.length} triple-crown winner(s) last season`);
  out.tripleCrowns.forEach((c) => console.log(`     ${c.name} — ${c.count}x (${c.events[0]}…)`));
  out.silverNoGold = [...silvers.entries()]
    .filter(([name, n]) => n >= 2 && !golds.has(name))
    .map(([name, count]) => ({ name, silvers: count }))
    .sort((a, b) => b.silvers - a.silvers);
  console.log(`  ${out.silverNoGold.length} players with 2+ silvers and no gold`);
  out.silverNoGold.slice(0, 8).forEach((p) => console.log(`     ${p.name} — ${p.silvers} silvers`));

  // Runner-up per division at each stop last year. This is the event-SPECIFIC
  // angle — without it, pre-draw picks would be identical on every event page,
  // which is the problem this whole section exists to fix. Not a duplicate of
  // the champions section, which lists golds only.
  console.log(`\nrunners-up for ${Object.keys(PRIOR_YEAR).length} mapped stops`);
  for (const [key, uuid] of Object.entries(PRIOR_YEAR)) {
    const rows = (await podium(base, token, uuid)).filter((r) => r.silver);
    if (rows.length) {
      out.runnersUp[key] = rows.map((r) => ({ division: r.division, name: r.silver }));
    }
    console.log(`  ${rows.length ? "ok   " : "none "} ${key} (${rows.length})`);
  }

  const path = "lib/data/watch-angles.json";
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nwrote ${path}`);
}

main();
