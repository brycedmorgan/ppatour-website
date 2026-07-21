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
import { cleanDivision } from "@/lib/scores-api";

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
async function get(base: string, token: string, path: string): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    headers: { "PB-API-TOKEN": token },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return res.json();
}

const G1 = ["teamOneGameOneScore","teamOneGameTwoScore","teamOneGameThreeScore","teamOneGameFourScore","teamOneGameFiveScore"];
const G2 = ["teamTwoGameOneScore","teamTwoGameTwoScore","teamTwoGameThreeScore","teamTwoGameFourScore","teamTwoGameFiveScore"];

function bracketType(m: ApiMatch): string {
  return str(m, "inBracketType", "in_bracket_type").toUpperCase();
}

/** 1 / 2 / 0 (undecided) — the winner field, else a game-win tally. */
function winnerTeam(m: ApiMatch): 0 | 1 | 2 {
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
function sideOf(m: ApiMatch, team: 1 | 2, decided: boolean, won: boolean): BracketSide {
  const bestOf = num(m, "scoreFormatGameBestOutOf") ?? 3;
  const keys = team === 1 ? G1 : G2;
  const games = keys.slice(0, bestOf).map((k) => num(m, k)).filter((g) => g != null) as number[];
  const name = teamName(m, team);
  return {
    participant: name ? { id: teamUuid(m, team) || name, name, seed: num(m, team === 1 ? "teamOneSeed" : "teamTwoSeed") ?? undefined } : null,
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
function buildBracket(
  matches: ApiMatch[],
  opts: { eventId: string; divisionId: string; divisionName: string; format: BracketFormat; stage: "winners" | "losers" | "pools" },
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
  const inStage = (m: ApiMatch) => {
    const t = bracketType(m);
    if (stage === "losers") return /^L/.test(t);
    if (stage === "pools") return t === "RR";
    return hasKnockout ? t === "W" || t === "GS" : t === "RR" || t === "";
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
  const nextIdOf = (m: ApiMatch): string | undefined => {
    if (!isElim) return undefined;
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

/** Pro events for a tournament, with the Finals "Top 8 Ranked" bracket
 *  superseding the "Main Draw" (same rule as the scores adapter). */
async function proEvents(base: string, token: string, uuid: string): Promise<ApiEvent[]> {
  const evJson = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events?bracket_level=Pro`)) as
    | { results?: ApiEvent[] }
    | null;
  const raw = (evJson?.results ?? []).filter((e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE" && e.eventId && e.eventTitle);
  const isTop8 = (t?: string) => /top\s*8\s*ranked/i.test(t ?? "");
  const byDivision = new Map<string, ApiEvent>();
  for (const e of raw) {
    const div = cleanDivision(e.eventTitle as string);
    const existing = byDivision.get(div);
    if (!existing || (isTop8(e.eventTitle) && !isTop8(existing.eventTitle))) byDivision.set(div, e);
  }
  return [...byDivision.values()];
}

export type BracketDraw = {
  division: BracketDivision;
  bracket: Bracket;
  /** Losers bracket (double-elim), else null. */
  losers: Bracket | null;
  /** Round-robin pool play (group+knockout events like the Finals), else null. */
  pools: Bracket | null;
};

async function buildAll(uuid: string): Promise<{ divisions: BracketDivision[]; draws: Map<string, BracketDraw> }> {
  const { token, base } = config();
  if (!token) return { divisions: [], draws: new Map() };
  const events = await proEvents(base, token, uuid);

  const results = await Promise.all(
    events.map(async (e) => {
      const eid = e.eventId as string;
      const name = cleanDivision(e.eventTitle as string);
      const format = bracketTypeFromFormatId(e.bracketFormatId);
      const mj = (await get(base, token, `/v1/ppa/tournaments/${uuid}/tournament_events/${eid}`)) as
        | { results?: ApiMatch[] }
        | null;
      const matches = mj?.results ?? [];

      const meta = { eventId: uuid, divisionId: eid, divisionName: name, format };
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
  return { divisions, draws };
}

const cache = new Map<string, { value: { divisions: BracketDivision[]; draws: Map<string, BracketDraw> }; expires: number }>();
const inFlight = new Map<string, Promise<{ divisions: BracketDivision[]; draws: Map<string, BracketDraw> }>>();

async function load(uuid: string) {
  const hit = cache.get(uuid);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inFlight.get(uuid);
  if (pending) return pending;
  const p = buildAll(uuid)
    .then((value) => {
      cache.set(uuid, { value, expires: Date.now() + TTL_MS });
      return value;
    })
    .catch(() => ({ divisions: [], draws: new Map<string, BracketDraw>() }));
  inFlight.set(uuid, p);
  try {
    return await p;
  } finally {
    inFlight.delete(uuid);
  }
}

export async function getBracketDivisions(uuid: string): Promise<BracketDivision[]> {
  return (await load(uuid)).divisions;
}

export async function getBracketDraw(uuid: string, divisionId: string): Promise<BracketDraw | null> {
  return (await load(uuid)).draws.get(divisionId) ?? null;
}
