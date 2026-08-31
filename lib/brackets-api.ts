/**
 * Bracket builder — turns the Pickleball.com PPA match feed into our internal
 * Bracket model for ANY tournament, so every completed event renders a real
 * draw (not just the captured Atlanta fixtures).
 *
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events?bracket_level=Pro
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events/{eventId}
 *
 * The feed gives round/match numbers, seeds, scores, and `inBracketType`
 * (W winners · L* losers · GS gold-medal final · B bronze · RR round-robin) but
 * NOT the winner-advances link the old fixtures had. We reconstruct it by
 * following each match's winning TEAM UUID into its next-round match — accurate
 * through play-in rounds and upsets, where a positional guess would misfire.
 *
 * Server-only (reads the token). Never throws — returns empty on any problem.
 */
import {
  bracketTypeFromFormatId,
  type Bracket,
  type BracketDivision,
  type BracketFormat,
  type BracketMatch,
  type BracketRound,
  type BracketSide,
} from "@/lib/bracket-types";
import { pbGetJson } from "@/lib/pb-fetch";
import {
  cleanDivision,
  isQualifierEvent,
  qualifierDivision,
  type ScoresStage,
} from "@/lib/scores-api";

const TIMEOUT_MS = 6000;
const TTL_MS = 60_000;

type ApiEvent = { eventId?: string; eventType?: string; eventTitle?: string; bracketFormatId?: number | string };
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
function fullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}
/**
 * One JSON GET against the partner API.
 *
 * ⚠ IT RETRIES A 429, AND THE QUALIFIER DRAW MADE THAT NECESSARY. A bare fetch
 * turned any non-ok response into null, which `buildAll` turns into a division
 * with no matches — so a rate-limited response did not look like an error, it
 * looked like an empty draw, and `isEmpty` then refused to cache it so the next
 * request tried again and got throttled again. Measured while wiring the
 * qualifier bracket in: the Men's Doubles qualifier draw rendered zero rounds
 * on three consecutive requests while the feed held 18 playable rows. Reading
 * both brackets during qualifying doubles this adapter's calls, which is what
 * pushed it over. `pbGetJson` is the repo's existing answer to this endpoint's
 * rate limiting and backs off on `retry-after`.
 *
 * ⚠ NOT given `revalidate`: it stays `no-store`, because this module runs its
 * own 60s cache in front and a bracket must not be served from two caches that
 * disagree.
 */
async function get(base: string, token: string, path: string): Promise<unknown> {
  return pbGetJson(`${base}${path}`, { "PB-API-TOKEN": token }, {
    timeoutMs: TIMEOUT_MS,
    retries: 3,
  });
}

const G1 = ["teamOneGameOneScore","teamOneGameTwoScore","teamOneGameThreeScore","teamOneGameFourScore","teamOneGameFiveScore"];
const G2 = ["teamTwoGameOneScore","teamTwoGameTwoScore","teamTwoGameThreeScore","teamTwoGameFourScore","teamTwoGameFiveScore"];

function bracketType(m: ApiMatch): string {
  return str(m, "inBracketType", "in_bracket_type").toUpperCase();
}

/**
 * 1 / 2 / 0 (undecided) — the declared winner, else a game-win tally.
 *
 * ⚠ `winner` ARRIVES AS A NUMBER AND WAS BEING THROWN AWAY. `str()` returns ""
 * for a non-string, so the "team_1"/"team_2" comparisons below never matched and
 * every match fell through to the tally. That works whenever a score exists —
 * which is why normal results looked fine — and returns 0 for a walkover, whose
 * games are all 0. Hence a withdrawn match with no winner marked.
 *
 * ⚠ AND THE FIELD IS ONLY TRUSTWORTHY ONCE THE MATCH IS COMPLETED. Measured
 * across Shenzhen 2026: of the 80 matches not yet played, 30 carry `winner: 1`.
 * Reading it unconditionally would crown a winner in half the undrawn bracket.
 */
function winnerTeam(m: ApiMatch): 0 | 1 | 2 {
  if (str(m, "matchCompleted", "match_completed")) {
    const declared = num(m, "winner", "matchWinner");
    if (declared === 1 || declared === 2) return declared;
  }
  const wf = str(m, "winner", "matchWinner").toLowerCase();
  if (wf === "team_1") return 1;
  if (wf === "team_2") return 2;
  const bestOf = num(m, "scoreFormatGameBestOutOf") ?? 3;
  let w1 = 0;
  let w2 = 0;
  for (let i = 0; i < bestOf; i++) {
    const a = num(m, G1[i]);
    const b = num(m, G2[i]);
    if (a == null || b == null) continue;
    if (a > b) w1++;
    else if (b > a) w2++;
  }
  return w1 > w2 ? 1 : w2 > w1 ? 2 : 0;
}
function teamUuid(m: ApiMatch, team: 1 | 2): string {
  return str(m, team === 1 ? "teamOneUuid" : "teamTwoUuid");
}
function teamName(m: ApiMatch, team: 1 | 2): string {
  const p =
    team === 1
      ? [fullName(str(m, "teamOnePlayerOneFirstName"), str(m, "teamOnePlayerOneLastName")), fullName(str(m, "teamOnePlayerTwoFirstName"), str(m, "teamOnePlayerTwoLastName"))]
      : [fullName(str(m, "teamTwoPlayerOneFirstName"), str(m, "teamTwoPlayerOneLastName")), fullName(str(m, "teamTwoPlayerTwoFirstName"), str(m, "teamTwoPlayerTwoLastName"))];
  return p.filter(Boolean).join(" / ");
}
/** Did anybody score a point? The feed sends 0, not null, for an unplayed game,
 *  so "has a score" cannot be asked as `!= null`. Checked per game across both
 *  sides, so a legitimate 11–0 still counts as played. */
function wasPlayed(m: ApiMatch): boolean {
  const bestOf = num(m, "scoreFormatGameBestOutOf") ?? 3;
  for (let i = 0; i < bestOf; i++) {
    if ((num(m, G1[i]) ?? 0) > 0 || (num(m, G2[i]) ?? 0) > 0) return true;
  }
  return false;
}

function sideOf(m: ApiMatch, team: 1 | 2, decided: boolean, won: boolean): BracketSide {
  const bestOf = num(m, "scoreFormatGameBestOutOf") ?? 3;
  const keys = team === 1 ? G1 : G2;
  // An unplayed match has no score to show — printing its zeros is what made a
  // walkover read as a scoreless draw.
  const games = wasPlayed(m)
    ? (keys.slice(0, bestOf).map((k) => num(m, k)).filter((g) => g != null) as number[])
    : [];
  const name = teamName(m, team);
  // The feed names an unfilled slot "TBD" (seed 0) rather than leaving it empty.
  const placeholder = !name || name.split(" / ").every((n) => /^tbd$/i.test(n.trim()));
  const seed = num(m, team === 1 ? "teamOneSeed" : "teamTwoSeed");
  return {
    participant: placeholder
      ? null
      : { id: teamUuid(m, team) || name, name, seed: seed ? seed : undefined },
    games,
    winner: decided && won,
  };
}
function matchStatus(m: ApiMatch): BracketMatch["status"] {
  if (str(m, "matchCompleted", "match_completed")) return "final";
  if (str(m, "matchStart", "match_start")) return "live";
  return "scheduled";
}

function roundName(fromEnd: number): string {
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round of ${2 ** (fromEnd + 1)}`;
}

/** Build a winners- (or losers-) path Bracket from a division's raw matches. */
/**
 * The third-place match.
 *
 * ⚠ IDENTIFIED BY roundText, NOT by `inBracketType`. The feed labels it "B" on
 * some events and "HIDE" on others — Nationals' main draw and its qualifier
 * both send it as HIDE — so the bracket-type field cannot be relied on to find
 * it. The PPA does not play a third-place match, and in the qualifier feed the
 * bronze row also carries a HIGHER roundNumber than the final, so anything
 * looking for "the last round" must skip it or it will find bronze.
 */
const IS_BRONZE = (m: ApiMatch): boolean => /bronze/i.test(str(m, "roundText", "round_text"));

function buildBracket(
  matches: ApiMatch[],
  opts: {
    eventId: string;
    divisionId: string;
    divisionName: string;
    format: BracketFormat;
    stage: "winners" | "losers" | "pools";
    /**
     * Include the feed's `HIDE` rows (bronze always excluded). Qualifier draws
     * only — see `IS_BRONZE` and the note on `inStage`.
     */
    includeHidden?: boolean;
  },
): Bracket {
  const { stage } = opts;
  const hasKnockout = matches.some((m) => {
    const t = bracketType(m);
    return t === "W" || t === "GS";
  });
  // "winners" → the knockout tree (W + gold-medal final): the whole draw for
  // single/double-elim, and the championship stage of the Finals' "Top 8 Ranked"
  // format. "pools" → its round-robin pool play (shown behind a toggle, like the
  // losers bracket). "losers" → the double-elim losers bracket. A pure
  // round-robin event (no knockout) renders its RR matches as the winners view.
  /**
   * ⚠ THE QUALIFIER DRAW LIVES BEHIND `inBracketType: "HIDE"` AND WOULD
   * OTHERWISE RENDER AS A TRUNCATED, MISLABELLED TREE. Measured on Nationals'
   * Men's Doubles qualifier: the feed marks Round 32 and Round 16 as "W" but
   * Quarter Finals, Semi-Finals, Finals and Bronze as "HIDE". Keeping only
   * W/GS dropped the last four rounds, and because rounds are NAMED BY THEIR
   * DISTANCE FROM THE LAST ONE PRESENT, the two survivors came out as
   * "Semifinals (10 matches)" and "Final (8 matches)" — a draw that never
   * existed, with 8 finals in it.
   *
   * ⚠ AND THE INCLUSION IS SCOPED TO THE QUALIFIER, DELIBERATELY. The main
   * draw's only HIDE row is its bronze match, so opening this filter for every
   * draw would put a third-place match back into every bracket on the site —
   * a match the PPA does not play (Connor, via Jeff's how-it-works doc) and
   * which no existing bracket shows. Bronze is excluded here for the same
   * reason, which also keeps it from being mistaken for the last round: in the
   * qualifier feed Bronze carries a HIGHER roundNumber than the final.
   */
  const inStage = (m: ApiMatch) => {
    const t = bracketType(m);
    if (stage === "losers") return /^L/.test(t);
    if (stage === "pools") return t === "RR";
    const hidden = opts.includeHidden === true && t === "HIDE" && !IS_BRONZE(m);
    return hasKnockout ? t === "W" || t === "GS" || hidden : t === "RR" || t === "";
  };
  const path = matches.filter(inStage);
  // Pool play renders as round-robin columns; a round-robin event resolved by a
  // knockout renders that knockout as a single-elim tree.
  const format: BracketFormat =
    stage === "pools"
      ? "round-robin"
      : hasKnockout && opts.format === "round-robin"
        ? "single-elim"
        : opts.format;
  const roundNum = (m: ApiMatch) => num(m, "roundNumber") ?? 0;

  // Distinct rounds, ascending → the last is the final.
  const roundNumbers = [...new Set(path.map(roundNum))].sort((a, b) => a - b);
  const roundIndexOf = new Map(roundNumbers.map((r, i) => [r, i]));

  // Reconstruct advancement by following the winning team into its next-round
  // match (elimination only — round-robin pools have no single next match).
  const isElim = stage === "losers" ? true : stage === "pools" ? false : hasKnockout;
  const idOf = (m: ApiMatch) =>
    str(m, "matchUuid", "uuid") || `${opts.divisionId}-${num(m, "matchNumber") ?? 0}`;
  // The feed's own advancement links. `$undefined` is a literal in this payload.
  const link = (m: ApiMatch, ...keys: string[]) => {
    const v = str(m, ...keys);
    return v && v !== "$undefined" ? v : "";
  };
  const idsInStage = new Set(path.map(idOf));
  // Reverse links: a match names the matches its two teams come from, so a
  // source match can find its target even when it names no target itself.
  const comesFrom = new Map<string, string>();
  for (const x of path) {
    const target = idOf(x);
    for (const k of ["matchTeamOneComesFrom", "matchTeamTwoComesFrom"]) {
      const src = link(x, k);
      if (src && idsInStage.has(src)) comesFrom.set(src, target);
    }
  }
  // Where a winner advances to. Structural links first — they exist BEFORE the
  // match is played, so an unplayed draw still shows every advancement line.
  // Following the winning team stays as the fallback for feeds without them.
  const nextIdOf = (m: ApiMatch): string | undefined => {
    if (!isElim) return undefined;
    const declared = link(m, "matchWinnerGoesTo", "winnerGoesTo", "match_winner_goes_to");
    if (declared && idsInStage.has(declared)) return declared;
    const reverse = comesFrom.get(idOf(m));
    if (reverse) return reverse;
    const w = winnerTeam(m);
    if (!w) return undefined;
    const uuid = teamUuid(m, w);
    if (!uuid) return undefined;
    const r = roundNum(m);
    const future = path
      .filter((x) => roundNum(x) > r && (teamUuid(x, 1) === uuid || teamUuid(x, 2) === uuid))
      .sort((a, b) => roundNum(a) - roundNum(b));
    return future.length ? str(future[0], "matchUuid", "uuid") : undefined;
  };

  const toMatch = (m: ApiMatch): BracketMatch => {
    const w = winnerTeam(m);
    const decided = matchStatus(m) === "final" && w !== 0;
    return {
      id: str(m, "matchUuid", "uuid") || `${opts.divisionId}-${num(m, "matchNumber") ?? 0}`,
      number: num(m, "matchNumber") ?? undefined,
      roundIndex: roundIndexOf.get(roundNum(m)) ?? 0,
      status: matchStatus(m),
      // Completed, decided, and nobody played it: a withdrawal.
      outcome:
        matchStatus(m) === "final" && w !== 0 && !wasPlayed(m) ? ("walkover" as const) : undefined,
      court: str(m, "courtTitle", "court"),
      sides: [sideOf(m, 1, decided, w === 1), sideOf(m, 2, decided, w === 2)],
      nextMatchId: nextIdOf(m),
    };
  };

  const rounds: BracketRound[] = [];
  roundNumbers.forEach((rn, ri) => {
    const ms = path.filter((m) => roundNum(m) === rn).sort((a, b) => (num(a, "matchNumber") ?? 0) - (num(b, "matchNumber") ?? 0));
    if (!ms.length) return;
    const fromEnd = roundNumbers.length - 1 - ri;
    const name = stage === "losers"
      ? fromEnd === 0 ? "Losers Final" : `Losers Round ${ri + 1}`
      : isElim ? roundName(fromEnd) : `Round ${ri + 1}`;
    rounds.push({ name, matches: ms.map(toMatch) });
  });

  // Vertically order each round to sit beside the match it feeds (clean lines).
  if (isElim) {
    for (let ri = rounds.length - 2; ri >= 0; ri--) {
      const order = new Map(rounds[ri + 1].matches.map((m, i) => [m.id, i]));
      rounds[ri].matches.sort((a, b) => {
        const oa = a.nextMatchId != null ? order.get(a.nextMatchId) ?? 1e9 : 1e9;
        const ob = b.nextMatchId != null ? order.get(b.nextMatchId) ?? 1e9 : 1e9;
        return oa - ob || (a.number ?? 0) - (b.number ?? 0);
      });
    }
  }

  // Gold/silver medals on the final.
  if (stage === "winners") {
    const finalMatch = rounds[rounds.length - 1]?.matches[0];
    if (finalMatch && finalMatch.status === "final") {
      for (const s of finalMatch.sides) if (s.participant) s.participant.medal = s.winner ? "gold" : "silver";
    }
  }

  return { eventId: opts.eventId, divisionId: opts.divisionId, divisionName: opts.divisionName, format, rounds };
}

/**
 * The tournament's pro events, split into the two brackets it runs.
 *
 * `main` applies the Finals "Top 8 Ranked" supersedes "Main Draw" rule (same as
 * the scores adapter). `qualifier` is the Pro Qualifier draw — see
 * `isQualifierEvent` in lib/scores-api for why the event type alone is not the
 * test.
 */
async function proEvents(
  base: string,
  token: string,
  uuid: string,
): Promise<{ main: ApiEvent[]; qualifier: ApiEvent[] }> {
  const evJson = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events?bracket_level=Pro`)) as
    | { results?: ApiEvent[] }
    | null;
  const all = (evJson?.results ?? []).filter((e) => e.eventId && e.eventTitle);
  const isTop8 = (t?: string) => /top\s*8\s*ranked/i.test(t ?? "");
  const oncePerDivision = (events: ApiEvent[], name: (t: string) => string) => {
    const byDivision = new Map<string, ApiEvent>();
    for (const e of events) {
      const div = name(e.eventTitle as string);
      const existing = byDivision.get(div);
      if (!existing || (isTop8(e.eventTitle) && !isTop8(existing.eventTitle))) byDivision.set(div, e);
    }
    return [...byDivision.values()];
  };
  return {
    main: oncePerDivision(all.filter((e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE"), cleanDivision),
    qualifier: oncePerDivision(all.filter(isQualifierEvent), qualifierDivision),
  };
}

/** Every match row for one event. */
async function eventMatches(base: string, token: string, uuid: string, eventId: string): Promise<ApiMatch[]> {
  const mj = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events/${eventId}`)) as
    | { results?: ApiMatch[] }
    | null;
  return mj?.results ?? [];
}

/** Has anybody stepped on court in this draw? */
function drawHasPlay(raws: ApiMatch[]): boolean {
  return raws.some((m) => str(m, "matchStart", "match_start") || str(m, "matchCompleted", "match_completed"));
}

/**
 * Is this division's draw finished — i.e. has its final been completed?
 *
 * ⚠ THE TEST IS THE FINAL, NOT "every row is completed", and the difference
 * decides when the qualifier bracket retires. A qualifier draw carries a Bronze
 * row, and the PPA does not play a third-place match (Connor, via Jeff's
 * how-it-works doc: "we are just getting rid of the 3rd"). So a row that will
 * never be played would have held `allCompleted` false forever and pinned the
 * qualifier bracket on screen for the rest of the tournament. The final is the
 * thing that actually ends a draw.
 */
function drawFinished(raws: ApiMatch[]): boolean {
  if (!raws.length) return true;
  const completed = (m: ApiMatch) => !!str(m, "matchCompleted", "match_completed");
  const gold = raws.find((m) => bracketType(m) === "GS");
  if (gold) return completed(gold);
  // ⚠ Bronze is skipped, and in a qualifier draw that is the whole point: its
  // roundNumber is HIGHER than the final's, so "the last round" is the bronze
  // match — which is never played, and would have held this false forever.
  const playable = raws.filter((m) => !IS_BRONZE(m));
  const highest = playable.slice().sort((a, b) => (num(b, "roundNumber") ?? 0) - (num(a, "roundNumber") ?? 0))[0];
  return highest ? completed(highest) : true;
}

export type BracketDraw = {
  division: BracketDivision;
  bracket: Bracket;
  /** Losers bracket (double-elim), else null. */
  losers: Bracket | null;
  /** Round-robin pool play (group+knockout events like the Finals), else null. */
  pools: Bracket | null;
};

type BuiltAll = { divisions: BracketDivision[]; draws: Map<string, BracketDraw>; stage: ScoresStage };

async function buildAll(uuid: string): Promise<BuiltAll> {
  const { token, base } = config();
  if (!token) return { divisions: [], draws: new Map(), stage: "main" };
  const events = await proEvents(base, token, uuid);

  /**
   * ── WHICH BRACKET THE PANEL SHOWS ──────────────────────────────────────────
   * Wesley, 8/31: show the Pro Qualifier draw too, and switch to the Pro Draw
   * "when all the pro qualifier matches are completed".
   *
   * ⚠ THIS IS A DIFFERENT RULE FROM THE SCORES BOARD, ON PURPOSE. The scores
   * switch on the calendar day (see lib/scores-stage); a bracket is a single
   * object that is either still being decided or finished, so it switches when
   * qualifying is actually over — which can be mid-afternoon, before the day
   * rolls. Asked for that way, and it is the honest reading of each surface: a
   * board answers "what happened today", a draw answers "how did this bracket
   * finish".
   *
   * Three conditions, each doing a job:
   *   · qualifying has been PLAYED — otherwise every event on the calendar
   *     would show its empty qualifier draw for months before it is played,
   *     which is a regression for every upcoming stop.
   *   · qualifying is NOT FINISHED — see `drawFinished`, which tests the final
   *     rather than every row.
   *   · the main draw has NOT started — the backstop, and the first thing
   *     checked. Even if a qualifier row is never played and never completes,
   *     the pro draw taking the court retires the qualifier bracket.
   *
   * ⚠ THE MAIN DRAW IS FETCHED FIRST AND NORMALLY ENDS IT THERE, which is what
   * keeps the cost honest. Once it has been played — every completed event, and
   * every day of a stop after qualifying — the qualifier is never requested and
   * this is the same one-call-per-division it has always been. The second round
   * of calls is spent only in the window where qualifying is the live story.
   */
  const mainRaws = await Promise.all(events.main.map((e) => eventMatches(base, token, uuid, e.eventId as string)));
  const qualifierRaws =
    !mainRaws.some(drawHasPlay) && events.qualifier.length
      ? await Promise.all(events.qualifier.map((e) => eventMatches(base, token, uuid, e.eventId as string)))
      : null;
  const showQualifier =
    qualifierRaws !== null && qualifierRaws.some(drawHasPlay) && !qualifierRaws.every(drawFinished);

  const stage: ScoresStage = showQualifier ? "qualifier" : "main";
  const chosen = showQualifier ? events.qualifier : events.main;
  const chosenName = showQualifier ? qualifierDivision : cleanDivision;
  // Reuse the match lists already fetched above rather than asking twice.
  const cached = showQualifier ? qualifierRaws : mainRaws;

  const results = await Promise.all(
    chosen.map(async (e, i) => {
      const eid = e.eventId as string;
      const name = chosenName(e.eventTitle as string);
      const format = bracketTypeFromFormatId(e.bracketFormatId);
      const matches = cached?.[i] ?? (await eventMatches(base, token, uuid, eid));

      // Qualifier draws hide their closing rounds behind `HIDE` — see `inStage`.
      const meta = { eventId: uuid, divisionId: eid, divisionName: name, format, includeHidden: showQualifier };
      const bracket = buildBracket(matches, { ...meta, stage: "winners" });
      const hasLosers = matches.some((m) => /^L/.test(bracketType(m)));
      const losers = hasLosers ? buildBracket(matches, { ...meta, stage: "losers" }) : null;
      // Group+knockout events (Finals "Top 8 Ranked") also expose the pool play.
      const hasKnockout = matches.some((m) => { const t = bracketType(m); return t === "W" || t === "GS"; });
      const hasRR = matches.some((m) => bracketType(m) === "RR");
      const pools = hasKnockout && hasRR ? buildBracket(matches, { ...meta, stage: "pools" }) : null;

      // Podium for the picker label.
      const gs = matches.find((m) => bracketType(m) === "GS");
      const bronze = matches.find((m) => bracketType(m) === "B");
      const gsW = gs ? winnerTeam(gs) : 0;
      const bW = bronze ? winnerTeam(bronze) : 0;

      const division: BracketDivision = {
        id: eid,
        name,
        format: bracket.format === "double-elim" ? "Double Elim" : bracket.format === "round-robin" ? "Round Robin" : "Single Elim",
        type: bracket.format,
        gold: gs && gsW ? teamName(gs, gsW) : undefined,
        silver: gs && gsW ? teamName(gs, gsW === 1 ? 2 : 1) : undefined,
        bronze: bronze && bW ? teamName(bronze, bW) : undefined,
      };
      return { division, draw: { division, bracket, losers, pools } as BracketDraw };
    }),
  );

  const divisions = results.map((r) => r.division);
  const draws = new Map(results.map((r) => [r.division.id, r.draw]));
  return { divisions, draws, stage };
}

type Loaded = BuiltAll;

/** No divisions, or no division with a single round in it — nothing to show. */
function isEmpty(v: Loaded): boolean {
  if (!v.divisions.length) return true;
  return ![...v.draws.values()].some(
    (d) => d.bracket.rounds.length || d.pools?.rounds.length || d.losers?.rounds.length,
  );
}

/** True when a draw carries nothing renderable (see `isEmpty`). */
export function isEmptyDraw(d: BracketDraw): boolean {
  return !d.bracket.rounds.length && !d.pools?.rounds.length && !d.losers?.rounds.length;
}

const cache = new Map<string, { value: BuiltAll; expires: number }>();
const inFlight = new Map<string, Promise<BuiltAll>>();

async function load(uuid: string) {
  const hit = cache.get(uuid);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inFlight.get(uuid);
  if (pending) return pending;
  const p = buildAll(uuid)
    .then((value) => {
      // `get()` swallows a timeout or a bad status into null, which builds an
      // EMPTY draw rather than throwing. Caching that pins a blank bracket for
      // a full TTL over one 6s upstream hiccup, so only a build with real
      // content is allowed into the cache; an empty one retries next request.
      if (!isEmpty(value)) cache.set(uuid, { value, expires: Date.now() + TTL_MS });
      return value;
    })
    .catch(() => ({ divisions: [], draws: new Map<string, BracketDraw>(), stage: "main" as ScoresStage }));
  inFlight.set(uuid, p);
  try {
    return await p;
  } finally {
    inFlight.delete(uuid);
  }
}

/**
 * The division picker plus which bracket it describes. `stage` matters to the
 * caller: a qualifier division and its main draw share a name, so a panel that
 * does not say which one it is showing presents a qualifier draw as the pro one.
 */
export async function getBracketIndex(
  uuid: string,
): Promise<{ divisions: BracketDivision[]; stage: ScoresStage }> {
  const { divisions, stage } = await load(uuid);
  return { divisions, stage };
}

export async function getBracketDraw(uuid: string, divisionId: string): Promise<BracketDraw | null> {
  return (await load(uuid)).draws.get(divisionId) ?? null;
}
