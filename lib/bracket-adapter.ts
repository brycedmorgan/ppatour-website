/**
 * Adapter: real Pickleball.com bracket API shape → our internal Bracket model.
 *
 * The PB "elimination" payload is a flat list of matches linked by
 * `matchWinnerGoesTo` (double-elim also uses `matchLoserGoesTo`). Each match
 * carries `inBracketType` (W = winners, L1/L2 = losers, GS = gold/silver final,
 * B = bronze). For v1 we render the **winners path** (W + GS) as a single-elim
 * tree — which is the entire draw for single-elim events and the main line for
 * double-elim. Rounds are derived from the winner-advances graph.
 */
import type {
  Bracket,
  BracketFormat,
  BracketMatch,
  BracketRound,
  BracketSide,
} from "@/lib/bracket-types";

export type PbGame = { score: number | null; isWinner: boolean; variation?: string };
export type PbTeam = {
  id: string;
  players: string[];
  seedNumber: number | null;
  games: PbGame[];
};
export type PbMatch = {
  id: string;
  matchNumber?: number;
  matchStatus?: number; // 1 upcoming · 2 live · 4 final
  matchCompleted?: string;
  court?: string;
  date?: string;
  maxGames?: number;
  inBracketType?: string; // W · L1 · L2 · GS · B
  matchWinnerGoesTo?: string | null;
  matchLoserGoesTo?: string | null;
  links?: { matchStatsURL?: string };
  teams?: PbTeam[];
};

const MAIN_PATH = new Set(["W", "GS"]);

function status(m: PbMatch): BracketMatch["status"] {
  return m.matchStatus === 2 ? "live" : m.matchStatus === 4 ? "final" : "scheduled";
}

function gamesWon(t: PbTeam | undefined): number {
  return (t?.games ?? []).filter((g) => g?.isWinner).length;
}

function side(t: PbTeam | undefined, winner: boolean): BracketSide {
  if (!t) return { participant: null, games: [], winner: false };
  return {
    participant: {
      id: t.id,
      name: (t.players ?? []).filter(Boolean).join(" / ") || "TBD",
      seed: t.seedNumber ?? undefined,
    },
    games: (t.games ?? []).filter((g) => g && g.score != null).map((g) => g.score as number),
    winner,
  };
}

/** "Final" / "Semifinals" / "Quarterfinals" / "Round of N" by distance to the final. */
function roundName(fromEnd: number): string {
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round of ${2 ** (fromEnd + 1)}`;
}

export function adaptElimination(
  matches: PbMatch[],
  opts: {
    eventId: string;
    divisionId: string;
    divisionName: string;
    format?: BracketFormat;
    /** "winners" (W + gold/silver final) or "losers" (L1/L2…). */
    stage?: "winners" | "losers";
  },
): Bracket {
  const stage = opts.stage ?? "winners";
  const inStage = (m: PbMatch) => {
    const t = m.inBracketType ?? "W";
    return stage === "losers" ? /^L/i.test(t) : MAIN_PATH.has(t);
  };
  const main = matches.filter(inStage);
  const byId = new Map(main.map((m) => [m.id, m]));

  // Reverse edges: which matches feed into a given match (winner advances).
  const feeders = new Map<string, PbMatch[]>();
  for (const m of main) {
    const tgt = m.matchWinnerGoesTo;
    if (tgt && byId.has(tgt)) {
      const list = feeders.get(tgt) ?? [];
      list.push(m);
      feeders.set(tgt, list);
    }
  }

  // Round index = longest chain of winner-advances leading into a match.
  const memo = new Map<string, number>();
  const roundOf = (m: PbMatch): number => {
    const hit = memo.get(m.id);
    if (hit != null) return hit;
    const fs = feeders.get(m.id) ?? [];
    const r = fs.length ? 1 + Math.max(...fs.map(roundOf)) : 0;
    memo.set(m.id, r);
    return r;
  };

  const maxRound = main.reduce((mx, m) => Math.max(mx, roundOf(m)), 0);

  const toMatch = (m: PbMatch): BracketMatch => {
    const [a, b] = m.teams ?? [];
    const aw = gamesWon(a);
    const bw = gamesWon(b);
    const decided = m.matchStatus === 4 || aw !== bw;
    const winnerGoesTo =
      m.matchWinnerGoesTo && byId.has(m.matchWinnerGoesTo) ? m.matchWinnerGoesTo : undefined;
    return {
      id: m.id,
      number: m.matchNumber,
      roundIndex: roundOf(m),
      status: status(m),
      court: m.court,
      time: m.date,
      sides: [side(a, decided && aw > bw), side(b, decided && bw > aw)],
      nextMatchId: winnerGoesTo,
    };
  };

  const rounds: BracketRound[] = [];
  for (let ri = 0; ri <= maxRound; ri++) {
    const ms = main
      .filter((m) => roundOf(m) === ri)
      .sort((x, y) => (x.matchNumber ?? 0) - (y.matchNumber ?? 0));
    if (!ms.length) continue;
    const name =
      stage === "losers"
        ? ri === maxRound
          ? "Losers Final"
          : `Losers Round ${ri + 1}`
        : roundName(maxRound - ri);
    rounds.push({ name, matches: ms.map(toMatch) });
  }

  // Vertically order each round to follow its next round: a match sits beside
  // the match it feeds, so connector lines run cleanly (no crossings).
  for (let ri = rounds.length - 2; ri >= 0; ri--) {
    const nextOrder = new Map(rounds[ri + 1].matches.map((m, i) => [m.id, i]));
    rounds[ri].matches.sort((a, b) => {
      const oa = a.nextMatchId != null ? nextOrder.get(a.nextMatchId) ?? 1e9 : 1e9;
      const ob = b.nextMatchId != null ? nextOrder.get(b.nextMatchId) ?? 1e9 : 1e9;
      return oa - ob || (a.number ?? 0) - (b.number ?? 0);
    });
  }

  // Gold/silver from the winners final (losers bracket has no medals here).
  if (stage === "winners") {
    const finalMatch = rounds[rounds.length - 1]?.matches[0];
    if (finalMatch && finalMatch.status === "final") {
      for (const s of finalMatch.sides) {
        if (s.participant) s.participant.medal = s.winner ? "gold" : "silver";
      }
    }
  }

  return {
    eventId: opts.eventId,
    divisionId: opts.divisionId,
    divisionName: opts.divisionName,
    format: opts.format ?? "single-elim",
    rounds,
  };
}
