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
import { FINISHED_RESULTS_CACHE_TAG, LIVE_SCORES_CACHE_TAG } from "@/lib/cache-tags";
import { fetchPlannedStarts } from "@/lib/ticker-api";
import {
  BRACKET_LIVE_WINDOW_S,
  listWindowFor,
  noteWindow,
  windowFromProEvents,
  isSettled,
  FINISHED_MEMO_MS,
  FINISHED_WINDOW_S,
} from "@/lib/live-cache-window";
import {
  cleanDivision,
  isQualifierEvent,
  qualifierDivision,
  type ScoresStage,
} from "@/lib/scores-api";

const TIMEOUT_MS = 6000;
const TTL_MS = 60_000;

type ApiEvent = {
  eventId?: string;
  eventType?: string;
  eventTitle?: string;
  bracketFormatId?: number | string;
  /** Null while this division is still being played — see lib/live-cache-window. */
  endDate?: string | null;
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
 * ⚠ NOW GIVEN `revalidate`, REVERSING THE NOTE THAT USED TO SIT HERE (9/6).
 * That note said no-store was right "because this module runs its own 60s
 * cache in front and [it] must not be served from two caches that disagree."
 * The premise is wrong on a serverless deploy: the module cache is per warm
 * instance per region, so it was never ONE cache — it was N of them, each
 * holding a different answer, and a cold start held none. Every instance
 * therefore paid its own full fan-out.
 *
 * Measured on Vercel's external-API view over twelve hours: the
 * `tournament_events` family took roughly 36K upstream calls, and the only
 * paths with a non-empty Cached Calls column were the ones lib/event-field.ts
 * fetches — the single caller that already passed `revalidate`.
 *
 * The Data Cache is shared across instances, regions and deploys, so the fan-out
 * is paid once per window by the whole fleet. 20s is deliberately SHORTER than
 * the 60s module TTL, so the module cache still bounds how stale anything on
 * screen can be and nothing is served older than it already was — this layer
 * only removes duplicate work behind it.
 *
 * ⚠ THE ENTRIES ARE SHARED WITH lib/scores-api ON PURPOSE. Both adapters read
 * the same two paths for the same tournament, so one cached response now
 * answers a scores poll and a bracket poll instead of each buying its own.
 */
const SHARED_REVALIDATE_S = BRACKET_LIVE_WINDOW_S;

/**
 * ⚠ `revalidateS` IS PER-TOURNAMENT, NOT PER-CALL-SITE. A finished draw is
 * immutable, so re-asking upstream every 20s for a bracket that was decided
 * weeks ago bought nothing — the National Championships alone cost 10,402 calls
 * in twelve hours on 9/17, eleven days after it ended. See
 * lib/live-cache-window.ts for the rule and why it fails short.
 *
 * It defaults to the live window so a caller that forgets to thread it through
 * is merely as expensive as before, never staler.
 */
async function get(
  base: string,
  token: string,
  path: string,
  revalidateS: number = SHARED_REVALIDATE_S,
): Promise<unknown> {
  return pbGetJson(`${base}${path}`, { "PB-API-TOKEN": token }, {
    timeoutMs: TIMEOUT_MS,
    retries: 3,
    revalidate: revalidateS,
    // ⚠ THE TAG FOLLOWS THE WINDOW. A one-year entry sitting on a tag something
    // purges is not a one-year entry — see FINISHED_RESULTS_CACHE_TAG for why
    // settled data gets its own, and why no cron may touch it.
    tags: [revalidateS === FINISHED_WINDOW_S ? FINISHED_RESULTS_CACHE_TAG : LIVE_SCORES_CACHE_TAG],
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
  /**
   * Advancement inferred from the shape of the draw — including the rounds
   * that carry byes.
   *
   * ⚠ THE RULE IS "ONE FEEDER PER FEEDER SLOT", NOT "TWO MATCHES PER MATCH".
   * Pairing each next-round match with two feeders is what fails on a bracket
   * with byes, and it fails badly: measured against every completed
   * advancement at Nationals 2026 (ground truth = following the winning team's
   * uuid forward), naive pairing scored 2 of 22 on a 22→16 round and 2 of 18 on
   * an 18→16 round, while every clean 32→16 / 16→8 / 8→4 / 4→2 / 2→1 round
   * scored 100%. The reason is simple once seen: a next-round match that
   * already holds a seed on a bye has only ONE slot to fill, so it consumes one
   * feeder, and every match after it shifts.
   *
   * So capacity is counted per match. Arizona men's singles, R64→R32:
   * matches 1,2 → 21 · 3,4 → 22 · 5 → 23 (Garnett already there on a bye) ·
   * 6 → 24 (Oncins) · 7,8 → 25 · 9,10 → 26 · 11 → 27 (Khlif) · 12,13 → 28 ·
   * 14,15 → 29 · 16,17 → 30 · 18 → 31 (Frazier) · 19,20 → 32. That reproduces
   * the official bracket on pickleballtournaments exactly, byes and all.
   *
   * ⚠⚠ A FEEDER SLOT IS NOT AN EMPTY SLOT, AND CONFLATING THE TWO IS WHAT TOOK
   * EVERY CONNECTOR OFF THE LIVE ROUND. This counted capacity as slots that
   * were still literally blank, so capacity SHRANK as results landed: the
   * moment a winner was written into the next round that slot stopped being
   * counted, the round stopped balancing, and the balance check below —
   * correctly refusing to guess — drew nothing at all. Measured on Arizona
   * mid-tournament (9/17): of the 35 round-to-round transitions across the
   * five main draws and five qualifiers, 20 no longer balanced and were
   * skipped, and every one of them was a round that had been played.
   *
   * On screen that showed up as the round CURRENTLY IN PLAY losing its
   * connectors — the one a viewer is actually looking at. Completed rounds
   * mostly survived on the follow-the-winner fallback below, which is why it
   * looked intermittent rather than broken: mid-tournament the Round of 32
   * drew 5 of 12 connectors in women’s doubles and 3 of 12 in men’s. So the
   * draw connected up perfectly before first serve and came apart as the event
   * ran, which is exactly backwards — and exactly what Wesley reported.
   *
   * The fix is that a slot is fed BY THIS ROUND when it is blank OR holds a
   * team that played in this round. A slot holding a team that did NOT play in
   * this round is a bye — a direct entry — and consumes no feeder. That
   * quantity is a property of the DRAW, so it is the same before the first ball
   * and after the last: re-measured on the same Arizona data, all 35
   * transitions balance, where the old test balanced 15. Every non-final match
   * in all five main draws now carries a connector: women’s doubles 28/28, men’s
   * doubles 46/46, mixed 46/46, women’s singles 44/44, men’s singles 46/46.
   *
   * ⚠ REAL RESULTS OUTRANK THE MODEL — see `anchors`. A completed match whose
   * winner already appears in the next round tells us where it went; that is
   * evidence, not inference, so it is fixed first and the remaining feeders
   * fill the remaining seats around it.
   *
   * ⚠ AND THE ANCHORS AUDIT THE MODEL, WHICH IS THE SAFETY THAT REPLACED THE
   * OLD ONE. If sequential assignment disagrees with even one anchor, this draw
   * does not number its matches in bracket order, so its unplayed matches get
   * NO line rather than a plausible wrong one. That is not hypothetical: the
   * Arizona men's doubles QUALIFIER pairs its quarterfinals (9,6) (10,11)
   * (12,7) (13,8), and nothing in the feed predicts it. Simulated across every
   * Arizona transition at 0/25/50/75% of results revealed, refusing there took
   * wrong lines from 10 to 6 out of 523 (98.8%), and all 6 survivors are that
   * one qualifier round with no result in yet — every MAIN-draw transition is
   * exact at every stage.
   *
   * ⚠ STILL A RECONSTRUCTION, AND THE UPSTREAM ASK STANDS.
   * `matchWinnerGoesTo` / `templateMatchID` on the draw feed would give the tree
   * outright instead of deriving it — the outstanding request in
   * docs/DATA-ASKS.md. Confirmed again on Arizona 9/17: a draw row carries only
   * roundNumber, matchNumber, matchStart, matchCompleted, inBracketType,
   * scoreFormatGameBestOutOf, roundText, matchUuid and matchCompletedType.
   * There is no advancement field to read. This is a faithful reconstruction,
   * not a substitute.
   */
  const positionalNext = new Map<string, string>();
  if (isElim) {
    /** A slot nobody occupies yet — the same "TBD"/empty test `sideOf` uses. */
    const slotOpen = (m: ApiMatch, team: 1 | 2) => {
      const name = teamName(m, team);
      return !name || name.split(" / ").every((n) => /^tbd$/i.test(n.trim()));
    };
    const byRound = roundNumbers.map((rn) =>
      path
        .filter((m) => roundNum(m) === rn)
        .sort((a, b) => (num(a, "matchNumber") ?? 0) - (num(b, "matchNumber") ?? 0)),
    );
    for (let i = 0; i < byRound.length - 1; i++) {
      const cur = byRound[i];
      const nxt = byRound[i + 1];
      if (!cur.length || !nxt.length) continue;

      // Every team that appears in this round, so a next-round slot can be told
      // apart from a bye: a slot holding one of these was FED by this round.
      const played = new Set<string>();
      for (const m of cur) {
        for (const t of [1, 2] as const) {
          const u = teamUuid(m, t);
          if (u) played.add(u);
        }
      }
      const fedByThisRound = (n: ApiMatch, t: 1 | 2) => {
        if (slotOpen(n, t)) return true;
        const u = teamUuid(n, t);
        return !!u && played.has(u);
      };

      // The seats this round feeds, in next-round order (slot 1 then slot 2).
      const seats: ApiMatch[] = [];
      for (const n of nxt) {
        if (fedByThisRound(n, 1)) seats.push(n);
        if (fedByThisRound(n, 2)) seats.push(n);
      }
      if (seats.length !== cur.length) continue; // does not balance — do not guess

      // Evidence first: a decided match whose winner is already in the next
      // round went exactly there, whatever the model would have said.
      const anchors = new Map<string, string>();
      for (const m of cur) {
        const w = winnerTeam(m);
        if (!w) continue;
        const u = teamUuid(m, w);
        if (!u) continue;
        const target = nxt.find((n) => teamUuid(n, 1) === u || teamUuid(n, 2) === u);
        if (target) anchors.set(idOf(m), idOf(target));
      }

      // Does the sequential model agree with everything we actually know?
      const modelHolds = cur.every((m, k) => {
        const known = anchors.get(idOf(m));
        return known === undefined || known === idOf(seats[k]);
      });

      for (const [src, target] of anchors) positionalNext.set(src, target);
      if (!modelHolds) continue; // this draw is not numbered in bracket order
      cur.forEach((m, k) => {
        if (!anchors.has(idOf(m))) positionalNext.set(idOf(m), idOf(seats[k]));
      });
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
    // Real data before inference: once a match is decided, the winning team's
    // uuid appearing in a later round IS the advancement, byes and all.
    const w = winnerTeam(m);
    if (w) {
      const uuid = teamUuid(m, w);
      if (uuid) {
        const r = roundNum(m);
        const future = path
          .filter((x) => roundNum(x) > r && (teamUuid(x, 1) === uuid || teamUuid(x, 2) === uuid))
          .sort((a, b) => roundNum(a) - roundNum(b));
        const followed = future.length ? str(future[0], "matchUuid", "uuid") : "";
        if (followed) return followed;
      }
    }
    // Nothing played yet: the reconstructed tree. It carries every match in a
    // draw whose numbering the anchors confirm, and only the decided ones in a
    // draw where they do not. See `positionalNext`.
    return positionalNext.get(idOf(m));
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

  /**
   * Vertical order, taken from the tree itself so a round sits beside what it
   * feeds and connector lines never cross.
   *
   * ⚠ IT WALKS BACKWARDS FROM THE FINAL, WHICH IS THE ONLY ORDER THAT CANNOT
   * CROSS. The previous rule sorted each round by the position of the match it
   * fed, one round at a time. That is the right instinct and it breaks in the
   * two places this draw actually needs it: a match with no `nextMatchId` was
   * parked at the end of its round with a 1e9 sort key — so during live play,
   * when the in-progress round had no links at all, a whole round fell back to
   * match-number order against a next round that had been reordered around it —
   * and the pass never looked deeper than one round, so two matches feeding the
   * same target kept whatever relative order they arrived in.
   *
   * A depth-first walk from the final assigns each subtree a contiguous band:
   * the final's top feeder takes the top half, its feeders the top quarters,
   * and so on down to the first round. That is how a printed bracket is drawn,
   * and it is what makes "which match feeds this one" answerable by eye rather
   * than by tracing a line across the column.
   *
   * ⚠ A MATCH THE FINAL CANNOT REACH KEEPS ITS PLACE rather than being dropped
   * or floated to the top: it is appended in match-number order after the
   * ranked ones. That is the state a draw is in when the anchors refused the
   * model (see `positionalNext`), so it has to degrade to something readable.
   */
  if (isElim) {
    const byId = new Map<string, BracketMatch>();
    for (const r of rounds) for (const m of r.matches) byId.set(m.id, m);
    const feeders = new Map<string, BracketMatch[]>();
    for (const r of rounds) {
      for (const m of r.matches) {
        if (!m.nextMatchId || !byId.has(m.nextMatchId)) continue;
        const list = feeders.get(m.nextMatchId);
        if (list) list.push(m);
        else feeders.set(m.nextMatchId, [m]);
      }
    }
    const byNumber = (a: BracketMatch, b: BracketMatch) => (a.number ?? 0) - (b.number ?? 0);
    const rank = new Map<string, number>();
    const seen = new Set<string>();
    let leaf = 0;
    const walk = (m: BracketMatch): number => {
      // A cycle cannot happen in a well-formed draw, but this is reconstructed
      // data — guard rather than blow the stack on a malformed feed.
      if (seen.has(m.id)) return rank.get(m.id) ?? leaf;
      seen.add(m.id);
      const kids = (feeders.get(m.id) ?? []).slice().sort(byNumber);
      // No feeders: a first-round match, or a slot filled entirely by byes.
      if (!kids.length) {
        const r = leaf++;
        rank.set(m.id, r);
        return r;
      }
      const rs = kids.map(walk);
      const r = rs.reduce((a, b) => a + b, 0) / rs.length;
      rank.set(m.id, r);
      return r;
    };
    for (const m of (rounds[rounds.length - 1]?.matches ?? []).slice().sort(byNumber)) walk(m);
    for (const r of rounds) for (const m of r.matches) if (!rank.has(m.id)) rank.set(m.id, leaf++);
    for (const r of rounds) {
      r.matches.sort((a, b) => (rank.get(a.id)! - rank.get(b.id)!) || byNumber(a, b));
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
): Promise<{ main: ApiEvent[]; qualifier: ApiEvent[]; window: number }> {
  // ⚠ THE LIST CALL CHOOSES THE WINDOW FOR THE FIVE THAT FOLLOW IT, so it
  // cannot be on that window itself the first time. It runs on the live
  // cadence until this instance has once seen the tournament finished — one
  // cheap call out of six. See listWindowFor.
  const revalidateS = listWindowFor(uuid, BRACKET_LIVE_WINDOW_S);
  const evJson = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events?bracket_level=Pro`, revalidateS)) as
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
  // Every division's end date, read off the list we already have — a finished
  // tournament's five per-division calls then go on the six-hour window.
  const window = windowFromProEvents(all, BRACKET_LIVE_WINDOW_S);
  noteWindow(uuid, window);
  return {
    main: oncePerDivision(all.filter((e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE"), cleanDivision),
    qualifier: oncePerDivision(all.filter(isQualifierEvent), qualifierDivision),
    window,
  };
}

/** Every match row for one event. */
async function eventMatches(
  base: string,
  token: string,
  uuid: string,
  eventId: string,
  revalidateS: number,
): Promise<ApiMatch[]> {
  const mj = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events/${eventId}`, revalidateS)) as
    | { results?: ApiMatch[] }
    | null;
  return mj?.results ?? [];
}

/** Has anybody stepped on court in this draw? */
function drawHasPlay(raws: ApiMatch[]): boolean {
  return raws.some((m) => str(m, "matchStart", "match_start") || str(m, "matchCompleted", "match_completed"));
}

/**
 * Is this draw scheduled to play on a day the feed has actually published?
 *
 * ⚠ THE PUBLISHED START IS THE WHOLE GUARD, and it is what keeps the original
 * objection answered: without it, widening the gate below from "played" would
 * put an empty qualifier draw on every stop on the calendar for months before
 * it is played. `fetchPlannedStarts` only covers a now-1d .. now+7d window, so
 * a stop three months out has no published start, this is false, and its
 * qualifier bracket is never shown.
 *
 * ⚠ AND IT IS THE SAME SOURCE THE SCORES BOARD READS, deliberately. The two
 * surfaces switch on different rules (see buildAll), but they must not disagree
 * about whether qualifying is happening at all — the Scores and Bracket tabs sit
 * next to each other on the event page and on the homepage band.
 *
 * Fails to false, never to true: an unreachable or rate-limited planned-starts
 * call leaves the gate exactly where it was before this existed.
 */
function drawScheduledSoon(raws: ApiMatch[], starts: Map<string, string>): boolean {
  if (!starts.size) return false;
  return raws.some((m) => {
    const id = str(m, "matchUuid", "uuid");
    return !!id && starts.has(id);
  });
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
  /**
   * One calendar lookup per build, then threaded into every call below, so a
   * finished tournament's ten requests all land on the long window together.
   * Computed here rather than inside `get` so it cannot vary mid-build.
   */
  const events = await proEvents(base, token, uuid);
  const revalidateS = events.window;

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
   *   · qualifying has been PLAYED, OR IS SCHEDULED TO PLAY on a day the feed
   *     has published — see `drawScheduledSoon`. "Played" alone was right at
   *     15:52 on Nationals Monday and wrong at 08:00 on Arizona Monday, when
   *     nothing had been played in either bracket and the panel showed the pro
   *     draw while 43 qualifier matches were about to start. The published-date
   *     half is what still keeps every upcoming stop on the calendar from
   *     showing an empty qualifier draw for months before it is played, which is
   *     the regression this condition exists to prevent.
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
   *
   * ⚠ THE PLANNED-STARTS CALL IS ONLY MADE IN THAT SAME WINDOW, and it is the
   * same cached, single-flighted map the scores adapter reads on the same page —
   * so on the one morning it is consulted it costs nothing extra, and on every
   * other day it is never called at all.
   */
  const mainRaws = await Promise.all(
    events.main.map((e) => eventMatches(base, token, uuid, e.eventId as string, revalidateS)),
  );
  const qualifierRaws =
    !mainRaws.some(drawHasPlay) && events.qualifier.length
      ? await Promise.all(
          events.qualifier.map((e) => eventMatches(base, token, uuid, e.eventId as string, revalidateS)),
        )
      : null;
  const qualifierPlayed = qualifierRaws !== null && qualifierRaws.some(drawHasPlay);
  // Only asked when qualifying exists and has not been played — i.e. the one
  // morning a stop needs it. Never on a completed event, never after the main
  // draw opens.
  let qualifierScheduled = false;
  if (qualifierRaws !== null && !qualifierPlayed) {
    const starts = await fetchPlannedStarts();
    qualifierScheduled = qualifierRaws.some((raws) => drawScheduledSoon(raws, starts));
  }
  const showQualifier =
    qualifierRaws !== null &&
    (qualifierPlayed || qualifierScheduled) &&
    !qualifierRaws.every(drawFinished);

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
      const matches = cached?.[i] ?? (await eventMatches(base, token, uuid, eid, revalidateS));

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
      // ⚠ A FINISHED DRAW IS PINNED IN MEMORY, NOT HELD FOR 60s. Rebuilding it
      // every minute forever is what kept Nationals calling upstream eleven days
      // after it ended — each rebuild re-reads six fetches. `settled` was just
      // written by `proEvents`, so this asks the same question it did.
      const ttl = isSettled(uuid) ? FINISHED_MEMO_MS : TTL_MS;
      if (!isEmpty(value)) cache.set(uuid, { value, expires: Date.now() + ttl });
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
