/**
 * Tournament scores adapter — Pickleball.com PPA endpoints (two-step):
 *
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events?bracket_level=Pro
 *     → the tournament's pro events. Both brackets are read: the Pro Main Draw
 *       (MAIN_EVENT_TYPE) and the Pro Qualifier (UNDEFINED_PPA_EVENT_TYPE).
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events/{eventId}
 *     → every match for that event, with per-game scores + times.
 *
 * header  PB-API-TOKEN: <token>
 *
 * ⚠ ONLY ONE BRACKET IS SURFACED AT A TIME, and which one is decided from the
 * feed rather than from the calendar — see the "WHICH BRACKET THE BOARD SHOWS"
 * note in `build`. On a stop's qualifying day the main draw has not been played
 * and the qualifier has, so the board carries qualifying; from the moment the
 * main draw starts it carries the main draw and never goes back.
 *
 * Server-only (reads the token). Never throws — returns an empty result on any
 * problem. We flatten all divisions' matches into one list the UI groups by
 * date and division.
 */

import { pbGetJson } from "@/lib/pb-fetch";
import { fetchPlannedStarts } from "@/lib/ticker-api";
import { scoreHeadshots } from "@/lib/score-headshots";

const TIMEOUT_MS = 6000;
const TTL_MS = 60_000;
/** How long to sit on the last good result after a failed rebuild. */
const FAILED_RETRY_MS = 10_000;

export type ScoreTeam = {
  players: string[];
  seed: number | null;
  games: (number | null)[];
  winner: boolean;
};
export type ScoreMatch = {
  id: string;
  divisionId: string;
  division: string;
  roundNumber: number;
  roundLabel: string;
  matchNumber: number;
  court: string;
  /** yyyy-mm-dd for grouping. */
  dateKey: string;
  dateLabel: string;
  status: "live" | "final" | "scheduled";
  /** Decided without being played — one side withdrew. See MatchOutcome. */
  outcome?: "walkover";
  teams: [ScoreTeam, ScoreTeam];
};
export type Champion = { divisionId: string; division: string; players: string[] };
export type Medal = "gold" | "silver" | "bronze";
export type Standing = { place: number; medal: Medal | null; players: string[] };
export type DivisionStandings = { divisionId: string; division: string; places: Standing[] };
/**
 * Which bracket a board is showing.
 *
 * A tour stop plays its Pro Qualifier before the Pro Main Draw — at Nationals
 * that is Monday, with the main draw opening Tuesday — so for one day the only
 * pickleball being played is qualifying, and a main-draw-only surface is empty.
 *
 * ⚠ THE TWO SURFACES SWITCH ON DIFFERENT RULES, AND THAT IS DELIBERATE
 * (Wesley, 8/31). The SCORES board switches on the calendar day, so it matches
 * the day badge on the ticker above it — decided in the browser, see
 * ScoresBoard. The BRACKET switches when qualifying is actually finished, which
 * can be mid-afternoon — decided on the server, see `buildAll` in
 * lib/brackets-api. A board answers "what happened today"; a draw answers "how
 * did this bracket finish".
 */
export type ScoresStage = "qualifier" | "main";
/** One bracket's divisions and matches. */
export type ScoresBracket = { divisions: { id: string; name: string }[]; matches: ScoreMatch[] };
export type ScoresResult = {
  tournamentId: string;
  /**
   * Player name (normalized) → headshot URL, for the whole response.
   *
   * ⚠ ONE MAP PER RESPONSE, NOT A URL PER ROW. ScoresBoard polls every 30s and
   * a big draw carries hundreds of matches; hanging a ~90-byte URL off each of
   * four players per match added ~100 KB to every poll for a few hundred
   * distinct faces. Keyed by name because the feed gives us names — see
   * lib/score-headshots.ts for why ambiguous ones are absent rather than
   * guessed.
   */
  headshots: Record<string, string>;
  /**
   * The PRO MAIN DRAW's divisions and matches — always, whatever is being
   * shown. The qualifier travels separately in `qualifier` so the client can
   * choose between them without a second request.
   */
  divisions: { id: string; name: string }[];
  matches: ScoreMatch[];
  /**
   * The Pro Qualifier draw, when qualifying has been played and the main draw
   * has not started. Null the rest of the time — including every completed
   * event, where it is never even fetched.
   *
   * ⚠ THE UI HAS TO SAY WHEN IT IS SHOWING THIS ONE. The division names are
   * identical in both brackets — both are "Men's Doubles" — so with no label a
   * qualifier result reads as a main-draw result.
   */
  qualifier: ScoresBracket | null;
  /**
   * Division winners (gold-medal match), once decided.
   *
   * ⚠ ALWAYS FROM THE MAIN DRAW, never from qualifying. A qualifier final has a
   * winner and that team is not the event's champion — they have won a
   * main-draw seed. Publishing one here would put them on the homepage's
   * "Latest Champions" band and on the event page's podium.
   */
  champions: Champion[];
  /** Final podium (gold/silver/bronze) per division, once decided. Main draw only — see `champions`. */
  standings: DivisionStandings[];
};

export type ApiEvent = {
  eventId?: string;
  eventType?: string;
  eventTitle?: string;
};
type ApiMatch = Record<string, unknown>;

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

function str(m: ApiMatch, ...keys: string[]): string {
  for (const k of keys) {
    const v = m[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}
function num(m: ApiMatch, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = m[k];
    const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return null;
}
/**
 * ⚠ THE FEED WRITES THE STRING "TBD" INTO THE NAME FIELDS of a slot nobody has
 * qualified into yet — `teamOnePlayerOneFirstName: "TBD"`. Left alone it is a
 * player called TBD: it counts as a named side, so "is this matchup confirmed"
 * cannot be asked, and a card renders "TBD" twice on one line. Dropping it here
 * makes `team.players.length` mean what it says. Rendering is unchanged for an
 * unknown side — ScoresBoard already prints "TBD" when a side has no players.
 */
function fullName(first: string, last: string): string {
  const real = (v: string) => {
    const t = v.trim();
    return /^tbd$/i.test(t) ? "" : t;
  };
  return [real(first), real(last)].filter(Boolean).join(" ");
}

/** "Mens Doubles Pro Main Draw" / "Women's Doubles Pro Top 8 Ranked" →
 *  "Men's Doubles" / "Women's Doubles". */
export function cleanDivision(title: string): string {
  return title
    .replace(/\s*Pro\s+(?:Main Draw|Top 8 Ranked|Qualifier)\s*/i, "")
    .replace(/\bMens\b/i, "Men's")
    .replace(/\bWomens\b/i, "Women's")
    .trim();
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
/** "2026-04-28T…" → { key:"2026-04-28", label:"Tue, Apr 28" } (noon-UTC to dodge drift). */
function dateParts(iso: string): { key: string; label: string } {
  const key = iso.slice(0, 10);
  const d = new Date(`${key}T12:00:00Z`);
  const label = Number.isNaN(d.getTime())
    ? key
    : `${DOW[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return { key, label };
}

/**
 * Confirmed-but-unplayed matches have no date — the feed carries `matchStart`
 * and `matchCompleted` and nothing else, so there is no scheduled time to group
 * them under. They get their own bucket, which sorts last because the board
 * orders its day tabs by key.
 */
const UPCOMING_KEY = "9999-12-31";
const UPCOMING_LABEL = "Date TBA";

function normalize(m: ApiMatch, division: string, divisionId: string): ScoreMatch | null {
  const start = str(m, "matchStart", "match_start", "date_started");
  const completed = str(m, "matchCompleted", "match_completed", "date_completed");
  const status: ScoreMatch["status"] = completed ? "final" : start ? "live" : "scheduled";

  const bestOf = num(m, "scoreFormatGameBestOutOf", "best_out_of") ?? 3;
  const g1 = ["teamOneGameOneScore","teamOneGameTwoScore","teamOneGameThreeScore","teamOneGameFourScore","teamOneGameFiveScore"];
  const g2 = ["teamTwoGameOneScore","teamTwoGameTwoScore","teamTwoGameThreeScore","teamTwoGameFourScore","teamTwoGameFiveScore"];
  const raw1 = g1.slice(0, bestOf).map((k) => num(m, k));
  const raw2 = g2.slice(0, bestOf).map((k) => num(m, k));

  /**
   * ⚠ THE FEED SENDS 0, NOT null, FOR A GAME NOBODY HAS PLAYED. Every unplayed
   * match arrives as 0/0/0 vs 0/0/0, so "has a score" could not be asked as
   * `!= null` — it was true for every row in the tournament, which meant a
   * scheduled match rendered three 0 cells a side: a 0–0–0 scoreline for a match
   * that has not been played. Measured on the live Shenzhen draw, where every
   * one of the 24 Men's Doubles rows carries zeros.
   *
   * Played means somebody scored a point. A legitimate 11–0 still counts, since
   * the test is per game across BOTH sides, not per cell.
   */
  const played = raw1.some((v, i) => (v ?? 0) > 0 || (raw2[i] ?? 0) > 0);
  const blank = raw1.map(() => null);
  const games1 = played ? raw1 : blank;
  const games2 = played ? raw2 : blank;

  /**
   * ⚠ SCHEDULED MATCHES ARE SHOWN, BUT ONLY WHEN BOTH SIDES ARE KNOWN (Wesley,
   * 8/19: "show confirmed matches even if the matches haven't concluded").
   *
   * This used to drop every scheduled match, so the Scores tab read "No scores
   * available yet" for the whole run-up to an event — measured on the live PPA
   * Asia 500 Shenzhen Open: 24 rows in Men's Doubles, all scheduled, tab empty,
   * while the Bracket tab beside it showed the full seeded draw.
   *
   * ⚠ AND "CONFIRMED" IS THE WHOLE TEST. Of those 24 rows only 4 had both sides
   * filled in; 12 had one side against a qualifier slot and 8 were TBD vs TBD.
   * A card reading "Ben Johns / Collin Johns vs TBD" is not a matchup, it is a
   * bracket position — that is what the Bracket tab is for. Listing them here
   * would bury the four real fixtures under twenty placeholders.
   */
  // Winner: count games each team won (only meaningful once complete).
  let w1 = 0;
  let w2 = 0;
  for (let i = 0; i < bestOf; i++) {
    const a = games1[i];
    const b = games2[i];
    if (a == null || b == null) continue;
    if (a > b) w1++;
    else if (b > a) w2++;
  }
  /**
   * Who won.
   *
   * ⚠ THE DECLARED `winner` IS A NUMBER, AND IT WAS BEING DISCARDED. `str()`
   * returns "" for a non-string, so the "team_1"/"team_2" tests never fired and
   * this always fell back to the game tally. Fine while a score exists; useless
   * for a walkover, whose games are all 0 — so a withdrawal had no winner.
   *
   * ⚠ ONLY TRUSTED ONCE COMPLETED. Of Shenzhen 2026's 80 unplayed matches, 30
   * carry `winner: 1`. Reading it before completion would crown winners across
   * half an undrawn bracket.
   */
  const declared = status === "final" ? num(m, "winner", "matchWinner") : null;
  const winnerField = str(m, "winner", "matchWinner").toLowerCase();
  const byTally = status === "final" && !winnerField;
  const t1Wins =
    declared === 1 || winnerField === "team_1" || (byTally && declared == null && w1 > w2);
  const t2Wins =
    declared === 2 || winnerField === "team_2" || (byTally && declared == null && w2 > w1);

  const team = (
    p1f: string, p1l: string, p2f: string, p2l: string,
    seed: number | null, games: (number | null)[], winner: boolean,
  ): ScoreTeam => ({
    players: [fullName(p1f, p1l), fullName(p2f, p2l)].filter(Boolean),
    seed,
    games,
    winner,
  });

  const teams: [ScoreTeam, ScoreTeam] = [
    team(str(m, "teamOnePlayerOneFirstName"), str(m, "teamOnePlayerOneLastName"), str(m, "teamOnePlayerTwoFirstName"), str(m, "teamOnePlayerTwoLastName"), num(m, "teamOneSeed"), games1, t1Wins),
    team(str(m, "teamTwoPlayerOneFirstName"), str(m, "teamTwoPlayerOneLastName"), str(m, "teamTwoPlayerTwoFirstName"), str(m, "teamTwoPlayerTwoLastName"), num(m, "teamTwoSeed"), games2, t2Wins),
  ];

  // A scheduled match is worth showing only once both sides are known — see the
  // note above. A "final" with no score on it never happened (walkover, or a
  // slot the bracket filled administratively).
  if (status === "scheduled" && !teams.every((t) => t.players.length > 0)) return null;

  /**
   * ⚠ A COMPLETED MATCH WITH NO SCORE IS KEPT WHEN SOMEBODY WON IT. That is a
   * walkover — one side withdrew, the other advanced — and dropping it hid a
   * real result: the winner had progressed and the board never said why. Only a
   * completed match with no score AND no winner is discarded, which is a slot
   * the bracket closed administratively rather than a match.
   */
  const walkover = status === "final" && !played && (t1Wins || t2Wins);
  if (status === "final" && !played && !walkover) return null;

  const { key, label } =
    status === "scheduled"
      ? { key: UPCOMING_KEY, label: UPCOMING_LABEL }
      : dateParts(completed || start);

  return {
    id: str(m, "matchUuid", "matchUUID", "uuid", "match_uuid") || `${divisionId}-${num(m, "matchNumber") ?? 0}`,
    divisionId,
    division,
    roundNumber: num(m, "roundNumber") ?? 0,
    roundLabel: str(m, "roundText") || `Round ${num(m, "roundNumber") ?? ""}`.trim(),
    matchNumber: num(m, "matchNumber") ?? 0,
    court: str(m, "courtTitle", "plannedCourtTitle", "court"),
    dateKey: key,
    dateLabel: label,
    status,
    outcome: walkover ? ("walkover" as const) : undefined,
    teams: [
      team(str(m, "teamOnePlayerOneFirstName"), str(m, "teamOnePlayerOneLastName"), str(m, "teamOnePlayerTwoFirstName"), str(m, "teamOnePlayerTwoLastName"), num(m, "teamOneSeed"), games1, t1Wins),
      team(str(m, "teamTwoPlayerOneFirstName"), str(m, "teamTwoPlayerOneLastName"), str(m, "teamTwoPlayerTwoFirstName"), str(m, "teamTwoPlayerTwoLastName"), num(m, "teamTwoSeed"), games2, t2Wins),
    ],
  };
}

/** 1 / 2 / 0 (undecided) — from the winner field, else a game-win tally. */
function winnerTeam(m: ApiMatch): 0 | 1 | 2 {
  const wf = str(m, "winner", "matchWinner").toLowerCase();
  if (wf === "team_1") return 1;
  if (wf === "team_2") return 2;
  const bestOf = num(m, "scoreFormatGameBestOutOf", "best_out_of") ?? 3;
  const g1 = ["teamOneGameOneScore","teamOneGameTwoScore","teamOneGameThreeScore","teamOneGameFourScore","teamOneGameFiveScore"];
  const g2 = ["teamTwoGameOneScore","teamTwoGameTwoScore","teamTwoGameThreeScore","teamTwoGameFourScore","teamTwoGameFiveScore"];
  let w1 = 0;
  let w2 = 0;
  for (let i = 0; i < bestOf; i++) {
    const a = num(m, g1[i]);
    const b = num(m, g2[i]);
    if (a == null || b == null) continue;
    if (a > b) w1++;
    else if (b > a) w2++;
  }
  return w1 > w2 ? 1 : w2 > w1 ? 2 : 0;
}

/** Player names for team 1 or 2 of a raw match. */
function teamPlayers(m: ApiMatch, team: 1 | 2): string[] {
  const p =
    team === 1
      ? [fullName(str(m, "teamOnePlayerOneFirstName"), str(m, "teamOnePlayerOneLastName")), fullName(str(m, "teamOnePlayerTwoFirstName"), str(m, "teamOnePlayerTwoLastName"))]
      : [fullName(str(m, "teamTwoPlayerOneFirstName"), str(m, "teamTwoPlayerOneLastName")), fullName(str(m, "teamTwoPlayerTwoFirstName"), str(m, "teamTwoPlayerTwoLastName"))];
  return p.filter(Boolean);
}

/** Final podium for a division: gold + silver from the gold-medal match (GS,
 *  else the highest completed round), bronze from the bronze match (B) if one
 *  was played. Null until the final is decided. */
function standingsOf(raws: ApiMatch[], division: string, divisionId: string): DivisionStandings | null {
  const completed = raws.filter((m) => str(m, "matchCompleted", "match_completed", "date_completed"));
  if (!completed.length) return null;
  const bracket = (m: ApiMatch) => str(m, "inBracketType", "in_bracket_type").toUpperCase();
  const final =
    completed.find((m) => bracket(m) === "GS") ??
    completed.slice().sort((a, b) => (num(b, "roundNumber") ?? 0) - (num(a, "roundNumber") ?? 0))[0];
  const w = winnerTeam(final);
  if (!w) return null;

  const places: Standing[] = [];
  const gold = teamPlayers(final, w);
  const silver = teamPlayers(final, w === 1 ? 2 : 1);
  if (gold.length) places.push({ place: 1, medal: "gold", players: gold });
  if (silver.length) places.push({ place: 2, medal: "silver", players: silver });

  const bronzeMatch = completed.find((m) => bracket(m) === "B");
  if (bronzeMatch) {
    const bw = winnerTeam(bronzeMatch);
    const bronze = bw ? teamPlayers(bronzeMatch, bw) : [];
    if (bronze.length) places.push({ place: 3, medal: "bronze", players: bronze });
  }

  return places.length ? { divisionId, division, places } : null;
}

/**
 * One JSON GET against the partner API.
 *
 * ⚠ IT RETRIES A 429, AND ON A QUALIFYING DAY THAT IS LOAD-BEARING. This used
 * to be a bare fetch that turned any non-ok response into null, and `build`
 * turns a null into an empty division — so a rate-limited response did not look
 * like an error, it looked like a division with no matches in it. Measured
 * against Nationals' five qualifier draws this morning: two of five parallel
 * requests came back 429, and the board silently published 23 of the 94
 * completed qualifier matches with no sign the rest existed. `pbGetJson` is the
 * repo's existing answer to this endpoint's rate limiting (see lib/pb-fetch.ts)
 * and already backs off on `retry-after`.
 *
 * ⚠ NOT given `revalidate`, deliberately: it stays `no-store` exactly as before,
 * because this module runs its own 60s cache with stale-while-revalidate in
 * front of it and two caches disagreeing about live scores is worse than one.
 */
async function get(base: string, token: string, path: string): Promise<unknown> {
  return pbGetJson(`${base}${path}`, { "PB-API-TOKEN": token }, {
    timeoutMs: TIMEOUT_MS,
    retries: 3,
  });
}

/**
 * When each not-yet-played match is due on court, keyed by match UUID.
 *
 * ⚠ THE SCORES FEED HAS NO SCHEDULED DATE AT ALL.
 * `/v1/ppa/tournaments/{id}/tournament_events/{eventId}` carries exactly two
 * dates — `matchStart` and `matchCompleted` — and both are null until a match
 * is under way, so a confirmed fixture arrives with nothing to group it by.
 * The per-tournament paths that might have held a schedule (`/schedule`,
 * `/matches`, `/courts`, `{event}/schedule`) all 403 for our token. The ticker
 * feed is the one reachable source — see `fetchPlannedStarts`, which owns the
 * request, its caching and its rate limiting.
 *
 * ⚠ COVERAGE IS "WHAT IS ON THIS WEEK", not the whole calendar: the ticker
 * window runs a day back and a week forward. A tournament three weeks out gets
 * no dates, which is the honest answer — its times are not published either.
 * Anything unmatched keeps UPCOMING_KEY and groups under a bucket that says
 * the date is not published yet, rather than borrowing one.
 */


const cache = new Map<string, { value: ScoresResult; expires: number }>();
const inFlight = new Map<string, Promise<ScoresResult>>();

/**
 * A tournament's Pro Qualifier events.
 *
 * ⚠ THE EVENT TYPE ALONE IS NOT THE TEST. The feed files qualifying under
 * `UNDEFINED_PPA_EVENT_TYPE` — a bucket, not a name — so requiring the title to
 * say "qualifier" as well keeps anything else the feed ever puts in that bucket
 * out of the board, exactly as it is excluded today. Verified across the last
 * 8 reachable PPA stops: every `UNDEFINED_PPA_EVENT_TYPE` event is a qualifier,
 * in one of two title shapes ("Mens Doubles Pro Qualifier",
 * "PRO MEN'S SINGLES - QUALIFIER").
 */
export function isQualifierEvent(e: ApiEvent): boolean {
  return e.eventType === "UNDEFINED_PPA_EVENT_TYPE" && /qualif/i.test(e.eventTitle ?? "");
}

/**
 * Division name for a qualifier event — "Men's Doubles", same as its main draw.
 *
 * ⚠ THE TAB MUST NOT CARRY THE WORD ITSELF. `stage` labels the whole board once
 * (see ScoresResult), so repeating "Qualifier" on all five pills is noise that
 * wraps them onto a second row on a phone. `cleanDivision` already strips the
 * "Pro Qualifier" shape; the second regex handles the "- QUALIFIER" one, which
 * it does not. `cleanDivision` is deliberately NOT changed — the bracket panel
 * imports it, and brackets are staying as they are.
 */
export function qualifierDivision(title: string): string {
  return cleanDivision(title).replace(/\s*[-–—]?\s*qualifier\s*$/i, "").trim();
}

/**
 * One event per division, preferring the Top 8 Ranked bracket.
 *
 * Some tournaments (e.g. the PPA Finals) run both a "Pro Main Draw" and a
 * "Pro Top 8 Ranked" bracket per discipline. The Top 8 Ranked bracket is the
 * real championship (the marquee field), so it supersedes the Main Draw when
 * both exist for the same division.
 */
function oncePerDivision(events: ApiEvent[], name: (title: string) => string): ApiEvent[] {
  const isTop8 = (t?: string) => /top\s*8\s*ranked/i.test(t ?? "");
  const byDivision = new Map<string, ApiEvent>();
  for (const e of events) {
    const div = name(e.eventTitle as string);
    const existing = byDivision.get(div);
    if (!existing || (isTop8(e.eventTitle) && !isTop8(existing.eventTitle))) {
      byDivision.set(div, e);
    }
  }
  return [...byDivision.values()];
}

type Bracket = {
  divisions: { id: string; name: string }[];
  matches: ScoreMatch[];
  standings: DivisionStandings[];
};

/** Fetch and normalize every match for one set of events, in parallel. */
async function loadBracket(
  base: string,
  token: string,
  tournamentId: string,
  events: ApiEvent[],
  name: (title: string) => string,
): Promise<Bracket> {
  const perEvent = await Promise.all(
    events.map(async (e) => {
      const mj = (await get(base, token, `/v1/ppa/tournaments/${tournamentId}/tournament_events/${e.eventId}`)) as
        | { results?: ApiMatch[] }
        | null;
      const raws = mj?.results ?? [];
      const division = name(e.eventTitle as string);
      const eid = e.eventId as string;
      return {
        matches: raws.map((m) => normalize(m, division, eid)).filter((x): x is ScoreMatch => x !== null),
        standings: standingsOf(raws, division, eid),
      };
    }),
  );
  return {
    divisions: events.map((e) => ({ id: e.eventId as string, name: name(e.eventTitle as string) })),
    matches: perEvent.flatMap((p) => p.matches),
    standings: perEvent.map((p) => p.standings).filter((s): s is DivisionStandings => s !== null),
  };
}

/** Has anybody actually played in this bracket? Scheduled fixtures don't count. */
function hasPlay(b: Bracket): boolean {
  return b.matches.some((m) => m.status === "live" || m.status === "final");
}

async function build(tournamentId: string): Promise<ScoresResult> {
  const { token, base } = config();
  const empty: ScoresResult = { tournamentId, divisions: [], matches: [], qualifier: null, champions: [], standings: [], headshots: {} };
  if (!token) return empty;
  try {
    /**
     * ⚠ FIRED HERE, AWAITED LATER — it used to run AFTER the division fan-out
     * and was the single most expensive step of a cold build. Measured on
     * Nationals: division list ~150ms, all five division fetches ~310ms in
     * parallel, then planned starts ~900ms on its own — 900 of 1,360ms spent
     * waiting on a request that could have been in flight the whole time.
     *
     * Not awaited unless the tournament turns out to have unplayed matches, so
     * a finished event never blocks on it. Its own module cache is shared across
     * tournaments, so even a speculative call that goes unused warms the next
     * one. `fetchPlannedStarts` never rejects, so this cannot become an
     * unhandled rejection.
     */
    const startsSoon = fetchPlannedStarts();

    const evJson = (await get(base, token, `/v1/ppa/tournaments/${tournamentId}/tournament_events?bracket_level=Pro`)) as
      | { results?: ApiEvent[] }
      | null;
    const all = (evJson?.results ?? []).filter((e) => e.eventId && e.eventTitle);
    const mainEvents = oncePerDivision(
      all.filter((e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE"),
      cleanDivision,
    );
    const qualifierEvents = oncePerDivision(all.filter(isQualifierEvent), qualifierDivision);

    /**
     * ── WHICH BRACKET THE BOARD SHOWS ────────────────────────────────────────
     * Wesley, 8/31: Monday of Nationals is qualifying, so show the qualifier
     * scores today and the pro scores from tomorrow.
     *
     * ⚠ DECIDED FROM THE FEED, NOT FROM THE DATE. A hardcoded "qualifiers until
     * Sept 1" would be this adapter's version of the marquee that named a
     * finished April event for months — right for one day, wrong every day
     * after, and wrong at every other tour stop. The rule is simply that **the
     * main draw wins the moment it has been played**; until then, if qualifying
     * has produced results, that is the pickleball being played and that is
     * what the board shows. Measured on Nationals this morning: 5 qualifier
     * divisions carrying 93 completed and 5 live matches, against 5 main-draw
     * divisions carrying 0 played and 267 scheduled. It flips itself when the
     * main draw opens tomorrow, needs no edit to do it, and behaves the same
     * way at every stop from here on.
     *
     * ⚠ THE MAIN DRAW IS FETCHED FIRST AND NORMALLY ENDS IT THERE, which is what
     * keeps the cost honest. Once a main draw is under way — that is, every day
     * of every event after qualifying, plus every completed event the homepage
     * asks for champions — the qualifier requests never happen and this is the
     * same 5 upstream calls it has always been. The extra 5 are spent only on
     * the one day they are the only scores there are. That matters here: this
     * adapter is the reason for the rate-limit work of 7/31.
     */
    const main = await loadBracket(base, token, tournamentId, mainEvents, cleanDivision);
    const qualifierBracket =
      !hasPlay(main) && qualifierEvents.length
        ? await loadBracket(base, token, tournamentId, qualifierEvents, qualifierDivision)
        : null;
    /**
     * ⚠ BOTH BRACKETS ARE SHIPPED AND THE CLIENT PICKS — see ScoresBoard.
     * Wesley, 8/31: the scores switch "when the score ticker changes to the next
     * day", and the ticker's day is the DEVICE's date, not the server's. This
     * route is CDN-cached for 30s and shared between viewers in every timezone,
     * so the server cannot answer "is it still qualifying day for you"; a
     * server-side answer would flip at the origin's midnight for everybody at
     * once. Sending both and deciding in the browser is what keeps the board and
     * the ticker above it saying the same thing.
     *
     * `qualifier` is null unless qualifying has actually been played, so the
     * extra payload exists only while it is the story. Once the main draw
     * starts, `loadBracket` above is never even called for it.
     */
    const qualifier =
      qualifierBracket && hasPlay(qualifierBracket)
        ? { divisions: qualifierBracket.divisions, matches: qualifierBracket.matches }
        : null;

    const { divisions, matches } = main;
    /**
     * ⚠ THE PODIUM IS THE MAIN DRAW'S, ALWAYS — see ScoresResult.champions.
     * A qualifier final has a winner, and crowning them here would put them on
     * the homepage's "Latest Champions" band and on the event page's podium.
     */
    const standings = main.standings;

    // Give the confirmed-but-unplayed matches their real day where the feed
    // knows it. Whatever is left keeps UPCOMING_KEY and groups under a bucket
    // that says the date is not published yet, rather than borrowing one.
    // Both brackets get this — the client may be about to render either.
    const scheduled = [...matches, ...(qualifier?.matches ?? [])].filter((m) => m.status === "scheduled");
    if (scheduled.length) {
      const starts = await startsSoon;
      for (const m of scheduled) {
        const at = starts.get(m.id);
        if (!at) continue;
        const { key, label } = dateParts(at);
        m.dateKey = key;
        m.dateLabel = label;
      }
    }

    return {
      tournamentId,
      divisions,
      matches,
      qualifier,
      /* Awaited last and behind its own try/catch inside `scoreHeadshots`, so a
         slow or failed ranking board costs the board its photos and never its
         scores. */
      headshots: await scoreHeadshots(),
      champions: standings
        .map((s) => {
          const gold = s.places.find((p) => p.place === 1);
          return gold ? { divisionId: s.divisionId, division: s.division, players: gold.players } : null;
        })
        .filter((c): c is Champion => c !== null),
      standings,
    };
  } catch {
    return empty;
  }
}

/** Kick off a rebuild, keeping the cache honest about what came back. */
function refresh(tournamentId: string): Promise<ScoresResult> {
  const existing = inFlight.get(tournamentId);
  if (existing) return existing;
  const p = build(tournamentId).then((value) => {
    /**
     * ⚠ AN EMPTY RESULT NEVER OVERWRITES A GOOD ONE. `build` returns
     * `{ matches: [] }` on any failure — `get()` returns null on a non-ok
     * response — so a single partner-API 429 used to be cached for a full
     * minute, and the board went from a full scoreboard to "No scores available
     * yet" and stayed there. Seen repeatedly while testing. Keeping the last
     * good answer means a blip costs freshness, not the whole board.
     */
    const previous = cache.get(tournamentId);
    if (value.matches.length === 0 && previous && previous.value.matches.length > 0) {
      /**
       * ⚠ AND THE STALE ENTRY GETS A SHORT NEW EXPIRY, which is not cosmetic.
       * Without it `expires` stays in the past, so every single request would
       * see an expired entry and kick off another rebuild — turning an upstream
       * outage into a rebuild per request, against the API that is already
       * refusing us. A 10s backoff keeps the board populated and retries at a
       * rate the origin can survive.
       */
      cache.set(tournamentId, { value: previous.value, expires: Date.now() + FAILED_RETRY_MS });
      return previous.value;
    }
    cache.set(tournamentId, { value, expires: Date.now() + TTL_MS });
    return value;
  });
  inFlight.set(tournamentId, p);
  void p.finally(() => inFlight.delete(tournamentId));
  return p;
}

export async function getScores(tournamentId: string): Promise<ScoresResult> {
  const hit = cache.get(tournamentId);
  if (hit && hit.expires > Date.now()) return hit.value;

  /**
   * ⚠ STALE WHILE REVALIDATING. A hard TTL meant whoever arrived one second
   * after expiry paid the whole cold build — measured at 1.26s — while everyone
   * else got 20ms. Scores a minute old are worth far more than a blank panel for
   * a second, and the caller polls every 30s anyway, so the refresh lands
   * without anybody waiting for it.
   */
  if (hit) {
    void refresh(tournamentId);
    return hit.value;
  }
  return refresh(tournamentId);
}
