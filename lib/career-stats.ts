/**
 * A pro's career numbers, counted from their matches (client-safe, pure).
 * The data is lib/player-career (from the stored career ledger); this file
 * only filters and counts, so the profile's Stats section can switch
 * division and season without another request.
 *
 * The set follows pickleball.com/players/<slug>/stats (Wesley, 11/9): win–loss,
 * longest streak, deciding games, after winning / losing the first game,
 * finals, titles and finals by year, points and games won and lost. Two
 * differences, both forced by the data:
 *
 * - "Versus higher rated team" and "Upset wins" need ratings at match time,
 *   which the draws do not carry. Seeds stand in: "versus higher seed" is a
 *   match against a better-seeded team (or any seeded team, when unseeded).
 * - Coverage starts with the tour feed (May 2023), not 2019. The section says so.
 *
 * ⚠ NO MEDAL WORDS OR COLOURS (Hannah, 7/28): Titles / Finals / Semifinals.
 */
import type { HistoryMatch } from "@/lib/player-history";

export type DivisionKind = "doubles" | "mixed" | "singles";

export type CareerMatch = HistoryMatch & {
  stage: "pools" | "bracket" | "losers";
  seed?: number;
  oppSeed?: number;
};

export type CareerDivision = {
  division: string;
  kind: DivisionKind;
  partners: string[];
  /** "Champion", "Finalist", "Semifinalist", "Quarterfinalist", "Round of 16", "Pools"… */
  finish: string;
  place: 1 | 2 | 3 | null;
  /** In the order played (pools, then the bracket, then the losers' side). */
  matches: CareerMatch[];
};

export type CareerEvent = {
  eventId: string;
  name: string;
  href: string | null;
  startDate: string;
  endDate: string;
  logoUrl: string | null;
  international: boolean;
  divisions: CareerDivision[];
};

export type PlayerCareer = {
  /** Newest first. */
  events: CareerEvent[];
  /** Start date of the oldest stop the ledger holds — what "Career" covers. */
  since: string | null;
  builtAt: string | null;
};

/**
 * How deep in a draw a round is. The draws carry no per-match date we can sort
 * on, so depth stands in: a semifinal was played after a quarterfinal in any
 * division. Pools are earliest; an unrecognised name sits mid-pack.
 * Names as lib/brackets-api writes them: "Final", "SF", "QF", "R16"…;
 * "Losers Round N" / "Losers Final"; "Round N" for pools and round-robin.
 */
export function roundDepth(round: string): number {
  const losers = /^losers round (\d+)/i.exec(round);
  if (losers) return 40 + Number(losers[1]);
  if (/^losers final/i.test(round)) return 85;
  const rr = /^round (\d+)/i.exec(round);
  if (rr) return 10 + Number(rr[1]);
  if (/semi|^sf\b/i.test(round)) return 90;
  if (/bronze/i.test(round)) return 95;
  if (/final|gold/i.test(round) && !/quarter/i.test(round)) return 100;
  if (/quarter|^qf\b/i.test(round)) return 80;
  const r = /^r(?:ound of )?\s*(\d+)/i.exec(round);
  if (r) return 70 - Math.log2(Number(r[1]) || 2);
  return 50;
}

export type KindFilter = "all" | DivisionKind;
/** "career", "12m" (the last 12 months), or a year: "2026". */
export type PeriodFilter = string;

export type Split = { w: number; l: number };

export type CareerStats = {
  events: number;
  matches: Split;
  games: Split;
  points: Split;
  longestStreak: number;
  /** The run they are on now, newest match backwards. */
  current: { won: boolean; n: number } | null;
  deciding: Split;
  afterWonFirst: Split;
  afterLostFirst: Split;
  vsHigherSeed: Split;
  /** Wins without dropping a game (two games or more). */
  straightGames: number;
  /** Win–loss in finals. */
  finals: Split;
  titles: number;
  runnerUp: number;
  semis: number;
  bestWin: CareerMatch | null;
};

export type YearRow = { year: string; events: number; titles: number; runnerUp: number; semis: number; matches: Split };

const split = (): Split => ({ w: 0, l: 0 });
const add = (s: Split, won: boolean) => (won ? s.w++ : s.l++);

/** Seasons the player has results in, newest first. */
export function careerYears(c: PlayerCareer): string[] {
  return [...new Set(c.events.map((e) => e.endDate.slice(0, 4)))].sort().reverse();
}

function inPeriod(e: CareerEvent, period: PeriodFilter, now: number): boolean {
  if (period === "career") return true;
  if (period === "12m") return e.endDate >= new Date(now - 365 * 864e5).toISOString().slice(0, 10);
  return e.endDate.startsWith(period);
}

function divisionsOf(e: CareerEvent, kind: KindFilter): CareerDivision[] {
  return kind === "all" ? e.divisions : e.divisions.filter((d) => d.kind === kind);
}

/** A match that went to a deciding game: 3 games, each side took one, or 5. */
function wentToDecider(m: CareerMatch): boolean {
  const n = m.games[0].length;
  if (n === 5) return true;
  if (n !== 3) return false;
  const mine = m.games[0].filter((g, i) => g > m.games[1][i]).length;
  return mine === 1 || mine === 2;
}

const isFinal = (m: CareerMatch) => m.stage === "bracket" && /^final$|^gold/i.test(m.round);

/** Every played match in the filter, oldest first. */
export function matchesInOrder(c: PlayerCareer, kind: KindFilter, period: PeriodFilter, now = Date.now()): CareerMatch[] {
  const events = c.events.filter((e) => inPeriod(e, period, now)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const out: CareerMatch[] = [];
  for (const e of events) {
    const atStop = divisionsOf(e, kind).flatMap((d) => d.matches.map((m, i) => ({ m, i })));
    // Earlier rounds of every division before later ones; draw order breaks ties.
    atStop.sort((a, b) => roundDepth(a.m.round) - roundDepth(b.m.round) || a.i - b.i);
    out.push(...atStop.map((x) => x.m));
  }
  return out;
}

export function careerStats(c: PlayerCareer, kind: KindFilter, period: PeriodFilter, now = Date.now()): CareerStats {
  const s: CareerStats = {
    events: 0,
    matches: split(),
    games: split(),
    points: split(),
    longestStreak: 0,
    current: null,
    deciding: split(),
    afterWonFirst: split(),
    afterLostFirst: split(),
    vsHigherSeed: split(),
    straightGames: 0,
    finals: split(),
    titles: 0,
    runnerUp: 0,
    semis: 0,
    bestWin: null,
  };

  for (const e of c.events) {
    if (!inPeriod(e, period, now)) continue;
    const divs = divisionsOf(e, kind);
    if (!divs.length) continue;
    s.events++;
    for (const d of divs) {
      if (d.place === 1) s.titles++;
      else if (d.place === 2) s.runnerUp++;
      else if (d.place === 3) s.semis++;
    }
  }

  let run = 0;
  for (const m of matchesInOrder(c, kind, period, now)) {
    if (m.won === null) continue;
    const won = m.won;
    add(s.matches, won);
    run = won ? run + 1 : 0;
    s.longestStreak = Math.max(s.longestStreak, run);
    if (isFinal(m)) add(s.finals, won);
    if (m.oppSeed && (!m.seed || m.oppSeed < m.seed)) add(s.vsHigherSeed, won);
    if (m.outcome === "walkover" || !m.games[0].length) continue;

    const [mine, theirs] = m.games;
    mine.forEach((g, i) => {
      add(s.games, g > theirs[i]);
      s.points.w += g;
      s.points.l += theirs[i] ?? 0;
    });
    if (mine.length >= 2) {
      add(mine[0] > theirs[0] ? s.afterWonFirst : s.afterLostFirst, won);
      if (won && mine.every((g, i) => g > theirs[i])) s.straightGames++;
    }
    if (wentToDecider(m)) add(s.deciding, won);
    // Best win: the best-seeded team they beat; a later, deeper win breaks ties.
    if (won && m.oppSeed && (!s.bestWin || m.oppSeed <= (s.bestWin.oppSeed ?? Infinity))) s.bestWin = m;
  }

  // The run they are on now: count back from the newest decided match.
  const decided = matchesInOrder(c, kind, period, now).filter((m) => m.won !== null);
  const last = decided[decided.length - 1];
  if (last) {
    let n = 0;
    for (let i = decided.length - 1; i >= 0 && decided[i].won === last.won; i--) n++;
    s.current = { won: last.won === true, n };
  }
  return s;
}

/** Titles, finals and semifinals per season (pickleball.com's "Titles and finals"). */
export function titlesByYear(c: PlayerCareer, kind: KindFilter): YearRow[] {
  return careerYears(c).map((year) => {
    const st = careerStats(c, kind, year);
    return { year, events: st.events, titles: st.titles, runnerUp: st.runnerUp, semis: st.semis, matches: st.matches };
  });
}

export const pct = (s: Split): string => (s.w + s.l ? `${Math.round((100 * s.w) / (s.w + s.l))}%` : "—");
export const wl = (s: Split): string => `${s.w}–${s.l}`;
