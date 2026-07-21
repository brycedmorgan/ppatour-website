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

const TIMEOUT_MS = 6000;
const TTL_MS = 60_000;

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
  teams: [ScoreTeam, ScoreTeam];
};
export type ScoresResult = {
  tournamentId: string;
  divisions: { id: string; name: string }[];
  matches: ScoreMatch[];
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
function fullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}

/** "Mens Doubles Pro Main Draw" → "Men's Doubles". */
function cleanDivision(title: string): string {
  return title
    .replace(/\s*Pro Main Draw\s*/i, "")
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

function normalize(m: ApiMatch, division: string, divisionId: string): ScoreMatch | null {
  const start = str(m, "matchStart", "match_start", "date_started");
  const completed = str(m, "matchCompleted", "match_completed", "date_completed");
  const status: ScoreMatch["status"] = completed ? "final" : start ? "live" : "scheduled";

  const bestOf = num(m, "scoreFormatGameBestOutOf", "best_out_of") ?? 3;
  const g1 = ["teamOneGameOneScore","teamOneGameTwoScore","teamOneGameThreeScore","teamOneGameFourScore","teamOneGameFiveScore"];
  const g2 = ["teamTwoGameOneScore","teamTwoGameTwoScore","teamTwoGameThreeScore","teamTwoGameFourScore","teamTwoGameFiveScore"];
  const games1 = g1.slice(0, bestOf).map((k) => num(m, k));
  const games2 = g2.slice(0, bestOf).map((k) => num(m, k));

  // Show matches that were actually played (any score) or are live.
  const played = games1.some((s) => s != null) || games2.some((s) => s != null);
  if (status === "scheduled" || (status === "final" && !played)) return null;

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
  const winnerField = str(m, "winner", "matchWinner").toLowerCase();
  const t1Wins = status === "final" && (winnerField === "team_1" || (!winnerField && w1 > w2));
  const t2Wins = status === "final" && (winnerField === "team_2" || (!winnerField && w2 > w1));

  const { key, label } = dateParts(completed || start);

  const team = (
    p1f: string, p1l: string, p2f: string, p2l: string,
    seed: number | null, games: (number | null)[], winner: boolean,
  ): ScoreTeam => ({
    players: [fullName(p1f, p1l), fullName(p2f, p2l)].filter(Boolean),
    seed,
    games,
    winner,
  });

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
    teams: [
      team(str(m, "teamOnePlayerOneFirstName"), str(m, "teamOnePlayerOneLastName"), str(m, "teamOnePlayerTwoFirstName"), str(m, "teamOnePlayerTwoLastName"), num(m, "teamOneSeed"), games1, t1Wins),
      team(str(m, "teamTwoPlayerOneFirstName"), str(m, "teamTwoPlayerOneLastName"), str(m, "teamTwoPlayerTwoFirstName"), str(m, "teamTwoPlayerTwoLastName"), num(m, "teamTwoSeed"), games2, t2Wins),
    ],
  };
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

const cache = new Map<string, { value: ScoresResult; expires: number }>();
const inFlight = new Map<string, Promise<ScoresResult>>();

async function build(tournamentId: string): Promise<ScoresResult> {
  const { token, base } = config();
  const empty: ScoresResult = { tournamentId, divisions: [], matches: [] };
  if (!token) return empty;
  try {
    const evJson = (await get(base, token, `/v1/ppa/tournaments/${tournamentId}/tournament_events?bracket_level=Pro`)) as
      | { results?: ApiEvent[] }
      | null;
    const events = (evJson?.results ?? []).filter(
      (e) => e.eventType !== "UNDEFINED_PPA_EVENT_TYPE" && e.eventId && e.eventTitle,
    );
    const divisions = events.map((e) => ({ id: e.eventId as string, name: cleanDivision(e.eventTitle as string) }));

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const mj = (await get(base, token, `/v1/ppa/tournaments/${tournamentId}/tournament_events/${e.eventId}`)) as
          | { results?: ApiMatch[] }
          | null;
        const division = cleanDivision(e.eventTitle as string);
        return (mj?.results ?? [])
          .map((m) => normalize(m, division, e.eventId as string))
          .filter((x): x is ScoreMatch => x !== null);
      }),
    );

    return { tournamentId, divisions, matches: perEvent.flat() };
  } catch {
    return empty;
  }
}

export async function getScores(tournamentId: string): Promise<ScoresResult> {
  const hit = cache.get(tournamentId);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inFlight.get(tournamentId);
  if (pending) return pending;
  const p = build(tournamentId).then((value) => {
    cache.set(tournamentId, { value, expires: Date.now() + TTL_MS });
    return value;
  });
  inFlight.set(tournamentId, p);
  try {
    return await p;
  } finally {
    inFlight.delete(tournamentId);
  }
}
