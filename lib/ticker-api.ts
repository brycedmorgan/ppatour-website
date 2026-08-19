/**
 * Live score ticker adapter — Pickleball.com Partner API.
 *
 *   GET {base}/v2/data/homepage_ticker_activity  → which partners are live
 *   GET {base}/v2/data/homepage_score_ticker     → the live/upcoming matches
 *   header  PB-API-TOKEN: <token>
 *
 * Both are authorized for our token. The score endpoint only serves the
 * current window (live / upcoming / just-finished) and filters by `partner`
 * (+ bracket_level_ids + a ±1-day window) — it ignores tournament UUIDs.
 *
 * Server-only (reads the token). Never throws — returns an empty result on any
 * problem. Map each raw match into the shape the ticker card renders.
 */

export type TickerPlayer = { name: string; headshot: string | null };
export type TickerTeam = { players: TickerPlayer[]; games: (number | null)[] };
export type TickerMatch = {
  id: string;
  round: string;
  /** Division, e.g. "Men's Doubles" (cleaned eventTitle); "" if unknown. */
  division: string;
  status: "live" | "final" | "upnext";
  court: string;
  time?: string;
  /**
   * When the match is due on court, as the feed states it —
   * "2026-08-20T09:00:00Z".
   *
   * ⚠ LOCAL WALL-CLOCK TIME WEARING A "Z". It is 9am at the venue (see
   * `timezoneAbbreviation`, "CST" for Shenzhen), not 9am UTC. Read the date part
   * as written; converting shifts the tournament day for every event outside
   * UTC, which is most of them. `time` above is the formatted display string —
   * this is the machine-readable one, and lib/scores-api needs it because the
   * scores endpoint has no scheduled date of its own.
   */
  plannedStart?: string;
  /** Index (0-2) of the in-progress game when live. */
  liveGame?: number;
  /** Live stream URL for this match, when the feed provides one. */
  watchUrl?: string;
  teams: [TickerTeam, TickerTeam];
};
export type TickerTournament = { title: string; logo: string | null };
export type TickerResult = {
  matches: TickerMatch[];
  tournament: TickerTournament | null;
  partner: string;
};

/** Raw match fields (camelCase) we rely on from homepage_score_ticker. */
type ApiMatch = {
  matchUuid: string;
  matchStatus: number; // 1 upcoming · 2 live · 4 final
  roundText?: string;
  eventTitle?: string; // division, e.g. "Mens Doubles Pro Main Draw"
  courtTitle?: string;
  winner?: number;
  localDateMatchPlannedStart?: string;
  timezoneAbbreviation?: string;
  tournamentTitle?: string;
  tournamentLogo?: string;
  gameOneStatus?: string;
  gameTwoStatus?: string;
  gameThreeStatus?: string;
  teamOneGameOneScore?: number;
  teamOneGameTwoScore?: number;
  teamOneGameThreeScore?: number;
  teamTwoGameOneScore?: number;
  teamTwoGameTwoScore?: number;
  teamTwoGameThreeScore?: number;
  teamOnePlayerOneName?: string;
  teamOnePlayerOneFirstName?: string;
  teamOnePlayerOneLastName?: string;
  teamOnePlayerOnePicture?: string;
  teamOnePlayerTwoName?: string;
  teamOnePlayerTwoFirstName?: string;
  teamOnePlayerTwoLastName?: string;
  teamOnePlayerTwoPicture?: string;
  teamTwoPlayerOneName?: string;
  teamTwoPlayerOneFirstName?: string;
  teamTwoPlayerOneLastName?: string;
  teamTwoPlayerOnePicture?: string;
  teamTwoPlayerTwoName?: string;
  teamTwoPlayerTwoFirstName?: string;
  teamTwoPlayerTwoLastName?: string;
  teamTwoPlayerTwoPicture?: string;
  streamingServices?: { liveUrl?: string; archivedUrl?: string }[];
};

/**
 * ⚠ THE TICKER READS PRODUCTION NOW, AND THE DEV INSTANCE IS OPT-IN.
 *
 * This used to be `PB_API_DEV_TOKEN || PB_API_TOKEN` — dev preferred whenever
 * those vars happened to be present. That made this the ONLY module on the site
 * reading api.pickleballdev.net; scores-api, brackets-api and tournament-api all
 * read production. The consequence was silent and total: with the dev vars set,
 * production reported PPA Asia live with 47 matches while the dev instance
 * returned 0 for the same window — so the site-wide ticker read "Next Event"
 * through a live tournament and the /live rail sat on its spinner. Nothing
 * errored; an empty window and "nothing is on" are the same response.
 *
 * Opt in with `PB_TICKER_SOURCE=dev` when you genuinely need the ticker pointed
 * at a rehearsal tournament on the dev instance. Anything else — including the
 * dev vars being set for other reasons — gets production.
 *
 * ⚠ CHECK VERCEL. If PB_API_DEV_URL / PB_API_DEV_TOKEN are set in the production
 * environment, the live site's ticker has been reading the dev instance too.
 */
function config() {
  const useDev = process.env.PB_TICKER_SOURCE === "dev";
  const token =
    (useDev ? process.env.PB_API_DEV_TOKEN : undefined) ?? process.env.PB_API_TOKEN;
  const base = (
    (useDev ? process.env.PB_API_DEV_URL : undefined) ??
    process.env.PB_API_BASE_URL ??
    "https://api.pickleball.com"
  ).replace(/[/]$/, "");
  return { token, base };
}

function shortName(first?: string, last?: string, full?: string): string {
  if (first && last) return `${first.charAt(0)}. ${last}`;
  return (full || last || first || "").trim();
}

/** "7:00 AM AEST" from an ISO string — parsed off the string to avoid TZ drift. */
function formatTime(iso?: string, tz?: string): string | undefined {
  if (!iso) return undefined;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return undefined;
  let h = Number.parseInt(m[1], 10);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}${tz ? ` ${tz}` : ""}`;
}

/** "Mens Doubles Pro Main Draw" → "Men's Doubles". */
function cleanDivision(title: string): string {
  return title
    .replace(/\s*Pro Main Draw\s*/i, "")
    .replace(/\bMens\b/i, "Men's")
    .replace(/\bWomens\b/i, "Women's")
    .trim();
}

function mapMatch(m: ApiMatch): TickerMatch {
  const status: TickerMatch["status"] =
    m.matchStatus === 2 ? "live" : m.matchStatus === 4 ? "final" : "upnext";

  const gs = [m.gameOneStatus, m.gameTwoStatus, m.gameThreeStatus];
  const t1 = [m.teamOneGameOneScore, m.teamOneGameTwoScore, m.teamOneGameThreeScore];
  const t2 = [m.teamTwoGameOneScore, m.teamTwoGameTwoScore, m.teamTwoGameThreeScore];
  // Per-game status (verified on the dev feed): "0" not started, "1" in
  // progress (the live game), anything else (e.g. "7") completed. Upcoming
  // matches show em dashes regardless.
  const upcoming = status === "upnext";
  const notPlayed = (st?: string) => upcoming || st == null || st === "" || st === "0";
  const games1 = gs.map((st, i) => (notPlayed(st) ? null : t1[i] ?? 0));
  const games2 = gs.map((st, i) => (notPlayed(st) ? null : t2[i] ?? 0));

  let liveGame: number | undefined;
  if (status === "live") {
    const idx = gs.findIndex((st) => st === "1");
    if (idx >= 0) liveGame = idx;
  }

  const p1: TickerPlayer[] = [];
  if (m.teamOnePlayerOneLastName || m.teamOnePlayerOneName)
    p1.push({
      name: shortName(m.teamOnePlayerOneFirstName, m.teamOnePlayerOneLastName, m.teamOnePlayerOneName),
      headshot: m.teamOnePlayerOnePicture || null,
    });
  if (m.teamOnePlayerTwoLastName || m.teamOnePlayerTwoName)
    p1.push({
      name: shortName(m.teamOnePlayerTwoFirstName, m.teamOnePlayerTwoLastName, m.teamOnePlayerTwoName),
      headshot: m.teamOnePlayerTwoPicture || null,
    });

  const p2: TickerPlayer[] = [];
  if (m.teamTwoPlayerOneLastName || m.teamTwoPlayerOneName)
    p2.push({
      name: shortName(m.teamTwoPlayerOneFirstName, m.teamTwoPlayerOneLastName, m.teamTwoPlayerOneName),
      headshot: m.teamTwoPlayerOnePicture || null,
    });
  if (m.teamTwoPlayerTwoLastName || m.teamTwoPlayerTwoName)
    p2.push({
      name: shortName(m.teamTwoPlayerTwoFirstName, m.teamTwoPlayerTwoLastName, m.teamTwoPlayerTwoName),
      headshot: m.teamTwoPlayerTwoPicture || null,
    });

  // Stream link: live_url while playing, archived_url once the match is done.
  const svc = m.streamingServices?.find((s) => s.liveUrl || s.archivedUrl);
  const watchUrl = (status === "final" ? svc?.archivedUrl : svc?.liveUrl) || undefined;

  return {
    id: m.matchUuid,
    round: m.roundText || "",
    division: cleanDivision(m.eventTitle || ""),
    status,
    court: m.courtTitle || "",
    time: status === "upnext" ? formatTime(m.localDateMatchPlannedStart, m.timezoneAbbreviation) : undefined,
    plannedStart: m.localDateMatchPlannedStart || undefined,
    liveGame,
    watchUrl,
    teams: [
      { players: p1, games: games1 },
      { players: p2, games: games2 },
    ],
  };
}

// Cap every upstream call so a slow/unresponsive backend degrades to the empty
// (loading) state instead of hanging the ticker's spinner indefinitely.
const TIMEOUT_MS = 5000;

type CacheEntry<T> = { value: T; expires: number };
// Which partner is live changes slowly; the match window changes fast.
const PARTNER_TTL_MS = 60_000;
const RESULT_TTL_MS = 5_000;

// Module-scoped caches. They persist across requests on a warm server instance,
// so repeated 15s polls and the two ticker consumers (header ticker + sticky
// live banner) don't each re-hit the upstream API. The in-flight maps collapse
// simultaneous requests into a single upstream call (request coalescing).
let partnerCache: CacheEntry<string | null> | null = null;
let partnerInFlight: Promise<string | null> | null = null;
const resultCache = new Map<string, CacheEntry<TickerResult>>();
let plannedCache: CacheEntry<Map<string, string>> | null = null;
let plannedInFlight: Promise<Map<string, string>> | null = null;
/**
 * The last planned-start map that actually had something in it.
 *
 * ⚠ A PUBLISHED START TIME BARELY MOVES, AND A 429 MUST NOT UNPUBLISH IT. Every
 * transient failure returns an empty map, which is indistinguishable downstream
 * from "nothing is scheduled" — so the scores board dropped its real dates and
 * showed "Date TBA" for a minute at a time. Serving the last known-good answer
 * is both more accurate and more stable; the worst case is a start time a few
 * minutes stale, against a schedule published days ahead.
 */
let plannedLastGood: Map<string, string> | null = null;
const resultInFlight = new Map<string, Promise<TickerResult>>();

/**
 * First partner with active matches (auto-pick when none is specified). Cached
 * ~60s so we don't pay this extra discovery round trip on every request while
 * still auto-detecting PPA / PPA Australia / PPA Asia windows.
 */
async function pickActivePartner(token: string, base: string): Promise<string | null> {
  if (partnerCache && partnerCache.expires > Date.now()) return partnerCache.value;
  if (partnerInFlight) return partnerInFlight;

  partnerInFlight = (async () => {
    try {
      const params = new URLSearchParams({
        partners: "PPA,PPA Australia,PPA Asia",
        bracket_level_ids: "2",
        use_camel_case: "true",
      });
      const res = await fetch(`${base}/v2/data/homepage_ticker_activity?${params}`, {
        headers: { "PB-API-TOKEN": token },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        activeTickers?: { partnersFlag: string; hasActiveMatches: boolean }[];
      };
      return json.activeTickers?.find((t) => t.hasActiveMatches)?.partnersFlag ?? null;
    } catch {
      return null;
    }
  })();

  try {
    const value = await partnerInFlight;
    partnerCache = { value, expires: Date.now() + PARTNER_TTL_MS };
    return value;
  } finally {
    partnerInFlight = null;
  }
}

/** Fetch + map the current match window for one partner (uncached). */
async function fetchScores(
  token: string,
  base: string,
  partner: string,
): Promise<TickerResult> {
  const now = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams({
    start_date: String(now - 86400),
    end_date: String(now + 86400),
    partner,
    bracket_level_ids: "2",
    page_size: "20",
    current_page: "1",
    use_camel_case: "true",
  });
  const res = await fetch(`${base}/v2/data/homepage_score_ticker?${params}`, {
    headers: { "PB-API-TOKEN": token },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return { matches: [], tournament: null, partner };

  const json = (await res.json()) as { results?: { results?: ApiMatch[] } };
  const rows = json.results?.results ?? [];
  const matches = rows.map(mapMatch);
  const first = rows[0];
  const tournament: TickerTournament | null = first
    ? { title: first.tournamentTitle || "", logo: first.tournamentLogo || null }
    : null;
  return { matches, tournament, partner };
}

export async function fetchLiveTicker(partnerArg?: string): Promise<TickerResult> {
  const { token, base } = config();
  const empty: TickerResult = { matches: [], tournament: null, partner: partnerArg ?? "" };
  if (!token) return empty;

  try {
    let partner = partnerArg || process.env.PB_TICKER_PARTNER || "";
    if (!partner) partner = (await pickActivePartner(token, base)) || "PPA";

    const cached = resultCache.get(partner);
    if (cached && cached.expires > Date.now()) return cached.value;

    const pending = resultInFlight.get(partner);
    if (pending) return pending;

    const p = (async () => {
      const result = await fetchScores(token, base, partner);
      resultCache.set(partner, { value: result, expires: Date.now() + RESULT_TTL_MS });
      return result;
    })();
    resultInFlight.set(partner, p);
    try {
      return await p;
    } finally {
      resultInFlight.delete(partner);
    }
  } catch {
    return empty;
  }
}

/**
 * Every published start time in the current window, keyed by match UUID.
 *
 * ⚠ THIS EXISTS BECAUSE THE SCORES FEED HAS NO SCHEDULED DATE. A confirmed but
 * unplayed match arrives from `/v1/ppa/tournaments/{id}/tournament_events/…`
 * with `matchStart: null` and `matchCompleted: null` and nothing else — there
 * is no field saying when it is due — and the per-tournament schedule paths all
 * 403 for our token. `homepage_score_ticker` rows carry
 * `localDateMatchPlannedStart`, so lib/scores-api joins on match UUID to give
 * its upcoming matches a real day. Living here keeps every call to this
 * endpoint, and its rate limiting, in one module.
 *
 * ⚠ IT IS A SEPARATE REQUEST FROM `fetchLiveTicker`, AND HAS TO BE. That one
 * asks for `page_size: 20` — the rail shows a handful of matches — and the
 * soonest 20 rows at a tour stop are its QUALIFIERS, while the scores board
 * shows main-draw divisions. The two sets were disjoint, so the join matched
 * nothing and every match read "Date TBA". This asks for the whole window.
 *
 * ⚠ ONE REQUEST, NOT ONE PER PARTNER. The first attempt fanned out across PPA /
 * PPA Australia / PPA Asia in parallel on every scores build and earned a 429,
 * which silently emptied the map — wrong dates are impossible here, but missing
 * ones look identical to "not scheduled yet". The active partner is already
 * known and cached (`pickActivePartner`), so one call answers it.
 */
export async function fetchPlannedStarts(): Promise<Map<string, string>> {
  const { token, base } = config();
  if (!token) return new Map();
  if (plannedCache && plannedCache.expires > Date.now()) return plannedCache.value;
  if (plannedInFlight) return plannedInFlight;

  plannedInFlight = (async () => {
    const found = new Map<string, string>();
    try {
      const partner =
        process.env.PB_TICKER_PARTNER || (await pickActivePartner(token, base)) || "PPA";
      const now = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams({
        start_date: String(now - 86400),
        end_date: String(now + 7 * 86400),
        partner,
        bracket_level_ids: "2",
        page_size: "100",
        current_page: "1",
        use_camel_case: "true",
      });
      const res = await fetch(`${base}/v2/data/homepage_score_ticker?${params}`, {
        headers: { "PB-API-TOKEN": token },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return found;
      const json = (await res.json()) as { results?: { results?: ApiMatch[] } };
      for (const row of json.results?.results ?? []) {
        if (row.matchUuid && row.localDateMatchPlannedStart) {
          found.set(row.matchUuid, row.localDateMatchPlannedStart);
        }
      }
    } catch {
      // A missing map degrades to "Date TBA", never to a wrong date.
    }
    return found;
  })();

  try {
    const value = await plannedInFlight;
    if (value.size > 0) {
      plannedCache = { value, expires: Date.now() + PARTNER_TTL_MS };
      plannedLastGood = value;
      return value;
    }
    // Empty means the request failed or the window is genuinely bare; we cannot
    // tell them apart, so fall back to the last good answer rather than
    // un-publishing every date. Not cached — the next call retries.
    return plannedLastGood ?? value;
  } finally {
    plannedInFlight = null;
  }
}
