/**
 * Tournament scores adapter — Pickleball.com PPA endpoints (two-step):
 *
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events?bracket_level=Pro
 *     → the tournament's pro events (divisions). Skip UNDEFINED_PPA_EVENT_TYPE
 *       (qualifiers).
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events/{eventId}
 *     → every match for that event, with per-game scores + times.
 *
 * header  PB-API-TOKEN: <token>
 *
 * Server-only (reads the token). Never throws — returns an empty result on any
 * problem. We flatten all divisions' matches into one list the UI groups by
 * date and division.
 */

import { fetchPlannedStarts } from "@/lib/ticker-api";

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
export type ScoresResult = {
  tournamentId: string;
  divisions: { id: string; name: string }[];
  matches: ScoreMatch[];
  /** Division winners (gold-medal match), once decided. */
  champions: Champion[];
  /** Final podium (gold/silver/bronze) per division, once decided. */
  standings: DivisionStandings[];
};

type ApiEvent = {
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

async function get(base: string, token: string, path: string): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    headers: { "PB-API-TOKEN": token },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return res.json();
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

async function build(tournamentId: string): Promise<ScoresResult> {
  const { token, base } = config();
  const empty: ScoresResult = { tournamentId, divisions: [], matches: [], champions: [], standings: [] };
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
    const rawEvents = (evJson?.results ?? []).filter(
      (e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE" && e.eventId && e.eventTitle,
    );
    // Some tournaments (e.g. the PPA Finals) run both a "Pro Main Draw" and a
    // "Pro Top 8 Ranked" bracket per discipline. The Top 8 Ranked bracket is the
    // real championship (the marquee field), so it supersedes the Main Draw when
    // both exist for the same division.
    const isTop8 = (t?: string) => /top\s*8\s*ranked/i.test(t ?? "");
    const byDivision = new Map<string, ApiEvent>();
    for (const e of rawEvents) {
      const div = cleanDivision(e.eventTitle as string);
      const existing = byDivision.get(div);
      if (!existing || (isTop8(e.eventTitle) && !isTop8(existing.eventTitle))) {
        byDivision.set(div, e);
      }
    }
    const events = [...byDivision.values()];
    const divisions = events.map((e) => ({ id: e.eventId as string, name: cleanDivision(e.eventTitle as string) }));

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const mj = (await get(base, token, `/v1/ppa/tournaments/${tournamentId}/tournament_events/${e.eventId}`)) as
          | { results?: ApiMatch[] }
          | null;
        const raws = mj?.results ?? [];
        const division = cleanDivision(e.eventTitle as string);
        const eid = e.eventId as string;
        return {
          matches: raws.map((m) => normalize(m, division, eid)).filter((x): x is ScoreMatch => x !== null),
          standings: standingsOf(raws, division, eid),
        };
      }),
    );

    const standings = perEvent.map((p) => p.standings).filter((s): s is DivisionStandings => s !== null);
    const matches = perEvent.flatMap((p) => p.matches);

    // Give the confirmed-but-unplayed matches their real day where the feed
    // knows it. Whatever is left keeps UPCOMING_KEY and groups under a bucket
    // that says the date is not published yet, rather than borrowing one.
    const scheduled = matches.filter((m) => m.status === "scheduled");
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
