#!/usr/bin/env node
/**
 * Generate the PPA Tour tournament-history record — every completed tour stop
 * with its champion, runner-up and third place in all five pro divisions.
 *
 *   set -a && . ./.env.local && set +a && node scripts/gen-tournament-history.mjs
 *
 * Reads:
 *   lib/data/tournament-history-archive.json   the tour's published record
 * Writes:
 *   lib/data/tournament-history.json           what lib/tournament-history.ts reads
 *
 * ── TWO SOURCES, AND WHY ─────────────────────────────────────────────────────
 * `ppa_tournaments` only goes back to mid-2023 — the 2020, 2021, 2022 and early
 * 2023 seasons do not exist in it at all. Those are held in the committed
 * ARCHIVE file, transcribed once from ppatour.com/tournament-history (the tour's
 * own published record and the only place they survive). This script never
 * regenerates the archive; it passes it through untouched and refuses to run if
 * it is missing, so a re-run can't silently drop four seasons.
 *
 * Podiums from 2024 on are derived from the feed.
 *
 * ⚠ NAMES ARE THE ONE THING THE FEED DOES NOT WIN. lib/events-api.ts takes the
 * feed's title as authoritative (Wesley, 8/3: "use the API names only") because
 * for a live stop the registration record IS the billing. It does not hold up
 * looking backwards: the feed titles a third of the 2024 season by city and
 * state — "Mesa AZ", "Austin TX", "Palm Springs CA" — and routinely drops the
 * presenting sponsor ("Sacramento Open" for what the tour published as the
 * Fasenra Sacramento Open presented by Zimmer Biomet). Measured across the 53
 * feed-covered stops, 27 titles disagree with what the tour published, and the
 * published name is the better one in 26 of them. So `publishedNames` in the
 * archive file wins, and the cleaned feed title is the fallback — which is what
 * a stop completing after this file was written gets.
 *
 * ── WHICH EVENTS COUNT AS "PPA TOUR" ─────────────────────────────────────────
 * Wesley's ask was tour stops only. The predicate below is not a guess — it was
 * derived by aligning the feed against all 116 events the tour publishes on
 * ppatour.com/tournament-history and then tightened until it reproduced them:
 *
 *   US org + Completed + 4 days or longer + not a Challenger / Classic /
 *   collegiate / qualifier / junior / senior / camp / makeup event
 *
 * Measured over 2024-2026 (the years both sources cover): 0 false positives,
 * 0 false negatives. The four 2023 disagreements are all cases where the feed's
 * own title is misleading — the Hyundai Masters is filed as "PPA Masters
 * Additional Events", and the Seattle and Kansas City Opens as "Golden Ticket
 * Qualifier" — plus one 2023 stop (Hilton Head Open) the tour does not list at
 * all. 2023 is covered by the archive, so none of them affect the output.
 *
 * ── SOURCE OF THE PODIUM ─────────────────────────────────────────────────────
 * Same stored procedure the defending-champions generator uses (the only SP
 * gateway our token may call — see docs/DATA-ASKS.md):
 *
 *   POST {base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents
 *   header  PB-API-TOKEN: <token>
 *   body    { "EventID": "<tournament_uuid>" }
 *   -> { payload: [ { GoldTeamName, SilverTeamName, BronzeTeamName,
 *                     BracketLevelTitle, NoMedalWasAwarded, PlayerGroupTitle,
 *                     FormatTitle, ... } ] }
 *
 * Build-time and not a runtime fetch for the same two reasons as
 * defending-champions: results are immutable once played, and one response
 * carries every division of the tournament (Pro + Amateur + Junior) at up to
 * ~3 MB — over Next's 2 MB Data Cache ceiling, so it would re-download on every
 * render. Distilled here to a few tens of KB.
 *
 * ⚠ PODIUMS COME FROM THE FEED EVEN THOUGH NAMES DON'T, and that split is
 * deliberate. Checked all 265 division champions the two sources both cover:
 * after the draw fix below, 22 still differ, and every one is the SAME PERSON
 * spelled differently — the published page says Benjamin Johns, James Johnson,
 * Chris Haworth and Etta Wright, the feed says Ben Johns, JW Johnson,
 * Christopher Haworth and Etta Tuionetoa. The feed's spelling is the one the
 * athlete roster and the rankings boards use, so a champion here links up with
 * the rest of the site. Zero cases of a genuinely different winner.
 *
 * Re-run when a season rolls over. Between runs the page still picks up newly
 * completed stops on its own — lib/tournament-history.ts fetches the podium for
 * anything missing from this file. Re-running just makes it permanent (and free).
 */
import { readFileSync, writeFileSync } from "node:fs";

const ARCHIVE_PATH = "lib/data/tournament-history-archive.json";
const OUT_PATH = "lib/data/tournament-history.json";

/** First season the feed can answer for. Earlier years live in the archive. */
const FEED_FROM_YEAR = 2024;

/** Display order, matching the event page's DIVISIONS list. */
const DIVISION_ORDER = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

/** The orgs whose events are the PPA Tour proper. */
const TOUR_ORGS = new Set(["Pro Pickleball Association", "United Pickleball Association"]);

/**
 * ── INTERNATIONAL STOPS, ADDED 9/24 ──────────────────────────────────────────
 * Hannah Johns' ask: "continue to add tournaments to this page that are 1,000
 * points and up (both domestic and international)". Sister tours used to be
 * excluded outright; they are now admitted on three conditions, all of which
 * the feed answers.
 *
 * ⚠ THE POINTS LEVEL IS IN THE TITLE, AND THAT IS THE ONLY PLACE IT IS. The
 * feed carries no points/tier column — checked every field on the row — but
 * sister-tour titles state it: "PPA Asia 1000 Leapmotor Kuala Lumpur Cup 2026",
 * "PPA1500 - AUSTRALIA PICKLEBALL CUP", "PPA125 Sydney". Same read as
 * `pointsFromName` in lib/placeholder-data.ts, which exists because the flat
 * `challenger` tier badged every sub-1,000 stop as 500.
 *
 * ⚠ AND THE SEASON CUTOFF IS LOAD-BEARING, NOT TIDINESS. Two Asia stops state
 * 1,000 today: the MB Hanoi Cup (Apr 1 2026) and the Leapmotor Kuala Lumpur Cup
 * (Sep 9 2026). Hannah asked for Kuala Lumpur and recorded Hanoi as correctly
 * ABSENT from career titles — "Hanoi titles are gone for ALW" is in her list of
 * things already working, and Alix Truong's 15 Asian golds sit under overall
 * titles precisely because they predate this season. So international results
 * count from the 2026/27 season, which opened with Nationals on Aug 31 2026
 * (the broadcast sheet's own "START OF PPA 2026/2027 SEASON" divider sits above
 * that stop). Hanoi is the last stop of 2025/26 and stays out.
 *
 * ⚠ Both October 1,500s — the Australia Pickleball Cup and the Hang Seng Bank
 * Hong Kong Slam — already satisfy every condition except `Completed`, so they
 * join on their own the first time this runs after they finish. That is the
 * "continue to add" half of the ask; nobody has to edit this file for them.
 */
const INTL_ORGS = new Set([
  "PPA Tour Asia",
  "PPA Tour Australia",
  "PPA Tour Canada",
  "PPA Tour Italy",
  "PPA Tour Spain",
]);

/** First day of the 2026/27 season — Nationals. See the note above. */
const INTL_FROM_ISO = "2026-08-31";

/** Minimum points for the history page, domestic or international. */
const MIN_POINTS = 1000;

/**
 * Feed rows that are NOT the event they appear to be.
 *
 * ⚠ THE AUSTRALIA PICKLEBALL OPEN 2025 IS REGISTERED TWICE AND ONE COPY IS
 * FILED UNDER THE US ORG. That is the whole reason it reached this page, and it
 * is checkable rather than a judgement call — the feed carries both:
 *
 *   b28de702…  org "PPA Tour Australia"          Jan 28 – Feb 2 2025
 *   a26c60b0…  org "Pro Pickleball Association"  Jan 30 – Feb 2 2025   <- this one
 *
 * The second is a PPA Tour Australia stop wearing the domestic org, so it
 * cleared `TOUR_ORGS` and published as a PPA Tour title. Hannah reported the
 * same record inflating career titles on pickleball.com (Lacy Schneemann showing
 * three, two of them from this event) — same root cause, and the permanent fix
 * is upstream with Jason's team. Excluding the row here is the site-side half.
 *
 * ⚠ KEYED ON UUID, NOT ON THE TITLE. The Australia-org twin is a legitimate
 * record and a title match would take both; and if the org is ever corrected
 * upstream this entry simply stops matching nothing important. Remove it once
 * the feed is fixed.
 */
const EXCLUDED_UUIDS = new Set(["a26c60b0-a00a-49cd-b93e-9fa2ac32f433"]);

/** Points level stated in a sister-tour title, or null. */
function pointsFromTitle(title) {
  const m = title.match(/(?:\b|PPA)P?\s*(3000|2000|1500|1000|500|250|125)\b/i);
  return m ? Number(m[1]) : null;
}

/**
 * Sister-tour title -> the name the tour itself uses.
 *
 * "PPA Asia 1000 Leapmotor Kuala Lumpur Cup 2026" -> "Leapmotor Kuala Lumpur Cup"
 * "PPA1500 - AUSTRALIA PICKLEBALL CUP"            -> "Australia Pickleball Cup"
 *
 * ⚠ CROSS-CHECKED, NOT INVENTED. lib/asia-tour-links.ts holds the names PPA Tour
 * Asia publishes for its own stops (Wade Townsend's list, 8/6), keyed by the
 * same feed slug. This derivation reproduces both of the Asia stops it covers —
 * "Leapmotor Kuala Lumpur Cup" and "MB Hanoi Cup" — exactly. If a future stop's
 * derived name disagrees with that file, that file is right.
 */
function intlName(title) {
  const stripped = title
    .replace(/^PPA\s*(?:Asia|Australia|Italy|Spain|Canada)?\s*\d{3,4}\s*[-–—:]?\s*/i, "")
    .replace(/\s+20\d{2}$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // ALL-CAPS feed titles ("AUSTRALIA PICKLEBALL CUP") read as shouting in a
  // table of mixed-case names; leave anything already mixed-case alone.
  return stripped === stripped.toUpperCase()
    ? stripped.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
    : stripped;
}

/** Real PPA properties that are not a tour stop. */
const NOT_A_TOUR_STOP =
  /\bchallenger\b|\bclassic\b|collegiate|college pickleball|makeup|\bqualifier\b|\bjunior\b|\bsenior\b|\bcamp\b|clinic|amateur|minor league|the dink\b|\bmoneyball\b|\bpro-?am\b|\bteam\b/i;

/** Placeholder/unfilled records the feed leaves behind. */
const JUNK_TITLE = /additional events|\btemplate\b|\btest event\b|\bTBD\b/i;

/**
 * Names a standing ruling retires, keyed by end date. The tour's published
 * record still credits the 2026 PPA Finals to Toys "R" Us; Connor's first
 * instruction for this rebuild was that the credit comes off the site, and the
 * feed already titles it plain "PPA Finals". So the feed wins on this one row.
 */
const NAME_OVERRIDE_BY_END_DATE = {
  "2026-05-10": "PPA Finals",
};

/** Same title cleanup as lib/events-api.ts, so a stop reads identically here. */
function cleanTitle(title) {
  return title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
    .replace(/\s*@\s*[^@]+$/, "")
    .replace(/^(Australia|Asia|Italy|Spain|Canada|USA)\s+(?=\S)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inclusiveDays(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const ms = Date.parse(endIso) - Date.parse(startIso);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 86_400_000) + 1;
}

/** "Mens" + "Doubles" -> "Men's Doubles"; Mixed is always doubles. */
function divisionLabel(row) {
  const group = (row.PlayerGroupTitle ?? "").trim().toLowerCase();
  const format = (row.FormatTitle ?? "").trim().toLowerCase();
  if (group === "mixed") return "Mixed Doubles";
  const who = group === "mens" ? "Men's" : group === "womens" ? "Women's" : null;
  const what = format === "singles" ? "Singles" : format === "doubles" ? "Doubles" : null;
  return who && what ? `${who} ${what}` : null;
}

/** "A & B" -> "A / B", matching the archive's separator. */
const team = (s) => (s ?? "").trim().replace(/\s*&\s*/g, " / ");

/**
 * ⚠ A DIVISION CAN HAVE MORE THAN ONE MEDAL-BEARING PRO DRAW, AND THE FIRST ONE
 * IS NOT ALWAYS THE CHAMPIONSHIP.
 *
 * The 2026 PPA Finals runs two per division: an open "Pro Main Draw" (single
 * elimination, off a Monday qualifier) and a "Pro Top 8 Ranked" invitational
 * round-robin. The invitational is the Finals — it is what the tour publishes
 * and what the season is a race toward. Taking the first Pro row published
 * Tama Shimabukuro & Yuta Funemizu as 2026 men's doubles champions instead of
 * Ben Johns & Gabriel Tardio, and got all five divisions wrong the same way.
 *
 * Measured across all 53 feed-covered stops from 2024 on: the Finals is the ONLY
 * one with a multi-draw division, and in all five the championship is the
 * invitational. So this prefers that and otherwise changes nothing.
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

/** Conditions every stop must clear, domestic or international. */
function isPlayable(t) {
  if (t.is_canceled || t.is_stub || t.is_advertise_only) return false;
  if (t.tournament_status !== "Completed") return false;
  if (EXCLUDED_UUIDS.has(t.tournament_uuid)) return false;
  return !JUNK_TITLE.test(t.title) && !NOT_A_TOUR_STOP.test(t.title);
}

export function isTourStop(t) {
  if (!isPlayable(t)) return false;
  if (!TOUR_ORGS.has(t.organization_name)) return false;
  return inclusiveDays(t.start_date, t.end_date) >= 4;
}

/** A sister-tour stop worth {@link MIN_POINTS} or more, this season or later. */
export function isIntlTourStop(t) {
  if (!isPlayable(t)) return false;
  if (!INTL_ORGS.has(t.organization_name)) return false;
  if (t.start_date.slice(0, 10) < INTL_FROM_ISO) return false;
  return (pointsFromTitle(t.title) ?? 0) >= MIN_POINTS;
}

async function podium(base, token, uuid) {
  const res = await fetch(`${base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
    method: "POST",
    headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
    body: JSON.stringify({ EventID: uuid }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  // Collect every candidate per division first, then choose — see
  // pickChampionshipDraw. Pro only: the payload also carries Amateur, Junior and
  // Senior Pro, and every division has a medal-less qualifier row.
  const byDivision = new Map();
  for (const row of json.payload ?? []) {
    if (row.BracketLevelTitle !== "Pro") continue;
    if (row.NoMedalWasAwarded) continue;
    if (!team(row.GoldTeamName)) continue;
    const division = divisionLabel(row);
    if (!division) continue;
    if (!byDivision.has(division)) byDivision.set(division, []);
    byDivision.get(division).push(row);
  }

  return DIVISION_ORDER.filter((d) => byDivision.has(d)).map((d) => {
    const row = pickChampionshipDraw(byDivision.get(d));
    return {
      division: d,
      champion: team(row.GoldTeamName),
      runnerUp: team(row.SilverTeamName),
      third: team(row.BronzeTeamName),
    };
  });
}

async function main() {
  const token = process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN is not set");
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");

  // The archive is not optional. Without it this script would write a file
  // missing 2020-2023 entirely, and the loss would look like a successful run.
  const seed = JSON.parse(readFileSync(ARCHIVE_PATH, "utf8"));
  const archive = seed.archive;
  const publishedNames = seed.publishedNames ?? {};
  if (!Array.isArray(archive) || archive.length === 0) {
    throw new Error(`${ARCHIVE_PATH} has no archive[] — refusing to write`);
  }
  console.log(
    `archive: ${archive.length} events (through ${archive[0]?.endDate}) · ${Object.keys(publishedNames).length} published names`,
  );

  const res = await fetch(`${base}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
    headers: { "PB-API-TOKEN": token },
  });
  if (!res.ok) throw new Error(`tournaments HTTP ${res.status}`);
  const rows = (await res.json()).results?.tournaments ?? [];
  if (rows.length === 0) throw new Error("tournaments feed returned nothing — refusing to write");
  console.log(`feed: ${rows.length} rows`);

  const domestic = rows
    .filter(isTourStop)
    .filter((t) => Number(t.end_date.slice(0, 4)) >= FEED_FROM_YEAR);
  const international = rows.filter(isIntlTourStop);
  const stops = [...domestic, ...international].sort((a, b) =>
    b.end_date.localeCompare(a.end_date),
  );
  console.log(
    `feed tour stops from ${FEED_FROM_YEAR}: ${domestic.length} domestic + ${international.length} international (>=${MIN_POINTS} pts, from ${INTL_FROM_ISO})`,
  );
  for (const t of international) console.log(`  intl  ${t.start_date.slice(0, 10)}  ${t.title}`);

  const fromFeed = [];
  let namedFromArchive = 0;
  for (const t of stops) {
    const endDate = t.end_date.slice(0, 10);
    // ⚠ publishedNames is keyed by END DATE and covers the domestic record only,
    // so an international stop must not read it — a same-day domestic stop would
    // hand it the wrong name outright.
    const name = INTL_ORGS.has(t.organization_name)
      ? intlName(t.title)
      : NAME_OVERRIDE_BY_END_DATE[endDate] ?? publishedNames[endDate] ?? cleanTitle(t.title);
    if (publishedNames[endDate]) namedFromArchive += 1;
    try {
      const divisions = await podium(base, token, t.tournament_uuid);
      if (divisions.length === 0) {
        console.log(`EMPTY ${t.end_date.slice(0, 10)}  ${name}`);
        continue;
      }
      fromFeed.push({
        endDate,
        startDate: t.start_date.slice(0, 10),
        name,
        divisions,
        uuid: t.tournament_uuid,
        ...(t.details_url ? { resultsUrl: t.details_url.replace(/\/$/, "") } : {}),
      });
      console.log(`ok    ${endDate}  ${name}  (${divisions.length} divisions)`);
    } catch (err) {
      console.error(`FAIL  ${endDate}  ${name}: ${err.message}`);
    }
  }
  console.log(
    `\nnames: ${namedFromArchive} from the published record, ${fromFeed.length - namedFromArchive} from the feed title`,
  );

  const all = [...fromFeed, ...archive].sort((a, b) => b.endDate.localeCompare(a.endDate));
  writeFileSync(OUT_PATH, `${JSON.stringify(all, null, 1)}\n`);

  const byYear = new Map();
  for (const e of all) {
    const y = e.endDate.slice(0, 4);
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  console.log(
    `\nwrote ${OUT_PATH} — ${all.length} events (${fromFeed.length} live + ${archive.length} archive)`,
  );
  console.log("by year:", [...byYear.entries()].sort().map(([y, n]) => `${y}:${n}`).join("  "));
}

main();
