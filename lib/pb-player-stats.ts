/**
 * A pro's PPA Tour stats from pickleball.com's own stats engine — the numbers
 * behind pickleball.com/players/<slug>/stats (Kenan, 11/12; his doc is the
 * Slack file "PPA Player Stats (pickleball.com Stats tab).md").
 *
 *   GET {base}/v1/users/{uuid}/matches_stats?partner=ppa,upa&scope_title=Pro&use_camel_case=true
 *   (+ &last_year=true for the rolling 12 months)
 *
 * This replaces counting the profile's Stats section out of our own career
 * ledger (lib/career-ledger): the engine covers 2020 on, not May 2023, and
 * carries numbers the draws cannot (ratings-based upsets, opponent handedness).
 * The ledger still feeds Tournament Results, which needs every match, and is
 * the Stats fallback when this call fails (components/athletes/PlayerCareer).
 *
 * ⚠ ~890 KB PER CALL (ALW, 11/12), almost all of it head-to-head maps we don't
 * show. So it is NOT stored in pb-cache's table (two calls × ~1,100 pros would
 * be ~2 GB) and NOT in Next's data cache (2 MB entry limit). It is fetched,
 * cut down to the ~5 KB below, and the CDN holds /api/player-stats for hours.
 *
 * ⚠ `{D}Apperances` (sic) IN PlayerStats COUNTS MATCHES, NOT TOURNAMENTS, though
 * Kenan's doc says tournaments: ALW Doubles 404 = 377 W + 27 L. Events are
 * counted from `PlayerTournamentStats` rows instead, where it is 1 per stop.
 *
 * ⚠ Platform 9 is limited to 5 requests/second on this route. Two per profile,
 * only on a CDN miss.
 *
 * ⚠ NO MEDAL WORDS (Hannah, 7/28) and NO RATINGS SHOWN (Connor, 7/29): the
 * match objects carry ratings; they are dropped here, never passed on.
 */
import type { CareerMatch, DivisionKind, Split } from "@/lib/career-stats";

export type PbStatBlock = {
  matches: Split;
  games: Split;
  points: Split;
  titles: number;
  runnerUp: number;
  semis: number;
  longestStreak: number;
  current: { won: boolean; n: number } | null;
  deciding: Split;
  afterWonFirst: Split;
  afterLostFirst: Split;
  /** pickleball.com's "upset wins": matches against a higher-rated team. */
  upsets: Split;
  /** Championship matches: titles vs finals lost. */
  finals: Split;
  vsLefty: Split;
  bestWin: CareerMatch | null;
};

export type PbScope = Partial<Record<DivisionKind, PbStatBlock>>;

export type PbPlayerStats = {
  career: PbScope;
  last12: PbScope;
  years: Record<string, PbScope>;
  /**
   * Every stop played, newest first: the date, which divisions, and per
   * division [titles, finals lost, semifinals] there.
   *
   * ⚠ THE 12-MONTH CALL'S Gold / Silver / Semifinalist ARE CAREER TOTALS
   * (ALW singles: 67 "in the last 12 months", 11/12) — pickleball.com only shows
   * win–loss, streaks and best win from it. So 12-month titles are counted
   * from these rows instead.
   */
  tournaments: { date: string; kinds: DivisionKind[]; medals: Partial<Record<DivisionKind, [number, number, number]>> }[];
};

type Obj = Record<string, unknown>;
const PREFIX: Record<DivisionKind, string> = { doubles: "Doubles", mixed: "Mix", singles: "Singles" };
const KINDS = Object.keys(PREFIX) as DivisionKind[];

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const sp = (w: unknown, l: unknown): Split => ({ w: num(w), l: num(l) });

/** "Womens" + "Doubles" → "Women's Doubles". */
function divisionName(m: Obj): string {
  const group = str(m.playerGroupTitle).replace(/^womens$/i, "Women's").replace(/^mens$/i, "Men's");
  return [group, str(m.formatTitle)].filter(Boolean).join(" ");
}

/** One of the engine's match objects as a box-score match, from `uuid`'s side. */
function toMatch(m: unknown, uuid: string): CareerMatch | null {
  if (!m || typeof m !== "object") return null;
  const o = m as Obj;
  const one = ["teamOnePlayerOneUuid", "teamOnePlayerTwoUuid"].some((k) => o[k] === uuid);
  const two = ["teamTwoPlayerOneUuid", "teamTwoPlayerTwoUuid"].some((k) => o[k] === uuid);
  if (!one && !two) return null;
  const [me, them] = one ? ["teamOne", "teamTwo"] : ["teamTwo", "teamOne"];
  const names = (t: string) => [str(o[`${t}PlayerOneName`]), str(o[`${t}PlayerTwoName`])].filter(Boolean);
  const scores = (t: string) => ["One", "Two", "Three", "Four", "Five"].map((g) => num(o[`${t}Game${g}Score`]));
  const mine = scores(me);
  const theirs = scores(them);
  // Keep the games actually played (0–0 is an unplayed slot).
  const played = mine.map((_, i) => i).filter((i) => mine[i] || theirs[i]);
  const myNames = names(me);
  const winner = num(o.winner);
  const end = str(o.tournamentEndDate) || str(o.matchCompleted);
  return {
    id: str(o.matchUuid),
    round: str(o.roundText),
    status: "final",
    partners: myNames.filter((_, i) => o[`${me}Player${i ? "Two" : "One"}Uuid`] !== uuid),
    opponents: names(them),
    games: [played.map((i) => mine[i]), played.map((i) => theirs[i])],
    won: winner ? winner === (one ? 1 : 2) : null,
    eventId: str(o.tournamentUuid),
    eventName: str(o.tournamentTitle).replace(/^PPA Tour:\s*/i, ""),
    endDate: end.slice(0, 10),
    division: divisionName(o),
    stage: "bracket",
    seed: num(o[`${me}Seed`]) || undefined,
    oppSeed: num(o[`${them}Seed`]) || undefined,
  };
}

function block(s: Obj, kind: DivisionKind, uuid: string): PbStatBlock | null {
  const p = PREFIX[kind];
  const won = num(s[`${p}Won`]);
  const lost = num(s[`${p}Lost`]);
  if (!won && !lost) return null;
  const titles = num(s[`${p}Gold`]);
  const runnerUp = num(s[`${p}Silver`]);
  const curW = num(s[`${p}CurrentWinStreak`]);
  const curL = num(s[`${p}CurrentLoseStreak`]);
  return {
    matches: { w: won, l: lost },
    games: sp(s[`TotalGamesWon${p}`], s[`TotalGamesLost${p}`]),
    points: sp(s[`TotalPointsWon${p}`], s[`TotalPointsLost${p}`]),
    titles,
    runnerUp,
    semis: num(s[`${p}Semifinalist`]),
    longestStreak: num(s[`${p}LongestWinStreak`]),
    current: curW ? { won: true, n: curW } : curL ? { won: false, n: curL } : null,
    deciding: sp(s[`${p}DecidingSetWins`], s[`${p}DecidingSetLost`]),
    afterWonFirst: sp(s[`${p}AfterWinningFirstGameWins`], s[`${p}AfterWinningFirstGameLost`]),
    afterLostFirst: sp(s[`${p}AfterLosingFirstGameWins`], s[`${p}AfterLosingFirstGameLost`]),
    upsets: sp(s[`${p}UnderdogWins`], s[`${p}UnderdogLoss`]),
    finals: { w: titles, l: runnerUp },
    vsLefty: sp(s[`${p}VSLeftHandWins`], s[`${p}VSLeftHandLost`]),
    bestWin: toMatch(s[`${p}BestWin`], uuid),
  };
}

function scope(s: unknown, uuid: string): PbScope {
  const out: PbScope = {};
  if (!s || typeof s !== "object") return out;
  for (const k of KINDS) {
    const b = block(s as Obj, k, uuid);
    if (b) out[k] = b;
  }
  return out;
}

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

async function getJson(url: string, token: string): Promise<Obj | null> {
  try {
    const r = await fetch(url, {
      headers: { "PB-API-TOKEN": token },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as unknown;
    return j && typeof j === "object" ? (j as Obj) : null;
  } catch {
    return null;
  }
}

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Null when the token is missing, the call fails, or the player has no PPA matches. */
export async function pbPlayerStats(uuid: string): Promise<PbPlayerStats | null> {
  const { token, base } = config();
  if (!token || !isUuid(uuid)) return null;
  const q = `${base}/v1/users/${uuid}/matches_stats?partner=ppa,upa&scope_title=Pro&use_camel_case=true`;
  // Sequential, not parallel: the route allows 5/s for the whole platform.
  const career = await getJson(q, token);
  if (!career?.PlayerStats) return null;
  const last = await getJson(`${q}&last_year=true`, token);

  const years: Record<string, PbScope> = {};
  for (const [y, s] of Object.entries((career.StatsPerYear as Obj | undefined) ?? {})) {
    const sc = scope(s, uuid);
    if (Object.keys(sc).length) years[y] = sc;
  }

  const tournaments: PbPlayerStats["tournaments"] = [];
  for (const yr of Object.values((career.PlayerTournamentStats as Obj | undefined) ?? {})) {
    const rows = ((yr as Obj | undefined)?.PlayerTournamentStats as Obj | undefined) ?? {};
    for (const row of Object.values(rows)) {
      const r = row as Obj;
      const kinds = KINDS.filter((k) => num(r[`${PREFIX[k]}Apperances`]) > 0);
      const date = str(r.TournamentDate).slice(0, 10);
      const medals: PbPlayerStats["tournaments"][number]["medals"] = {};
      for (const k of kinds) {
        const p = PREFIX[k];
        medals[k] = [num(r[`${p}Gold`]), num(r[`${p}Silver`]), num(r[`${p}Semifinalist`])];
      }
      if (kinds.length && date) tournaments.push({ date, kinds, medals });
    }
  }
  tournaments.sort((a, b) => b.date.localeCompare(a.date));

  const out: PbPlayerStats = {
    career: scope(career.PlayerStats, uuid),
    // A failed 12-month call leaves this empty; the section then says so.
    last12: scope(last?.PlayerStats, uuid),
    years,
    tournaments,
  };
  return Object.keys(out.career).length ? out : null;
}
