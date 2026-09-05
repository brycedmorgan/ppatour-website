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
  /**
   * Which side won: 1, 2, or 0 when undecided.
   *
   * ⚠ THE CARD USED TO DERIVE THIS FROM THE GAME SCORES, which cannot answer for
   * a match nobody played — so a walkover highlighted neither row. The feed
   * states it outright; this carries it through.
   */
  winnerTeam?: 0 | 1 | 2;
  /** Decided without being played — one side withdrew. */
  outcome?: "walkover";
  teams: [TickerTeam, TickerTeam];
};
export type TickerTournament = { title: string; logo: string | null };
export type TickerResult = {
  matches: TickerMatch[];
  tournament: TickerTournament | null;
  partner: string;
  /**
   * Did this payload come from an upstream call that actually worked.
   *
   * ⚠ WITHOUT THIS, A TIMEOUT AND AN EMPTY COURT SCHEDULE ARE THE SAME BYTES.
   * Every failure used to resolve to `{ matches: [] }` with a 200, so the rail
   * said "No matches on court right now" during Nationals with five matches in
   * progress. Reproduced on the live feed: one poll took 5.04s (the upstream
   * timeout), returned 45 bytes, and the seven polls around it returned 12,137.
   * A consumer cannot tell those apart unless the payload says so.
   */
  ok: boolean;
  /** Last known-good data, served because the live call failed just now. */
  stale?: boolean;
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

  /**
   * ⚠ THE DECLARED WINNER, TRUSTED ONLY ONCE THE MATCH IS FINAL. Measured on the
   * scores feed for the same tournament: 30 of 80 not-yet-played matches carry
   * `winner: 1`, so reading it any earlier crowns winners across an undrawn
   * bracket. Same rule as lib/scores-api and lib/brackets-api.
   */
  const declared = status === "final" && (m.winner === 1 || m.winner === 2) ? m.winner : 0;

  /**
   * ⚠ A WALKOVER'S GAME SCORES ARE ZEROS, NOT NULLS, and this feed marks their
   * per-game status completed — so `notPlayed` above lets them through and the
   * card printed "0" cells for a match nobody played. Nothing was scored, so
   * nothing is shown; the winner is carried by `declared` instead.
   */
  const anyPoint = games1.some((g) => (g ?? 0) > 0) || games2.some((g) => (g ?? 0) > 0);
  const walkover = status === "final" && declared !== 0 && !anyPoint;
  const blank = games1.map(() => null);

  // Stream link: live_url while playing, archived_url once the match is done.
  const svc = m.streamingServices?.find((s) => s.liveUrl || s.archivedUrl);
  const watchUrl = (status === "final" ? svc?.archivedUrl : svc?.liveUrl) || undefined;

  return {
    id: m.matchUuid,
    winnerTeam: declared,
    outcome: walkover ? ("walkover" as const) : undefined,
    round: m.roundText || "",
    division: cleanDivision(m.eventTitle || ""),
    status,
    court: m.courtTitle || "",
    time: status === "upnext" ? formatTime(m.localDateMatchPlannedStart, m.timezoneAbbreviation) : undefined,
    plannedStart: m.localDateMatchPlannedStart || undefined,
    liveGame,
    watchUrl,
    teams: [
      { players: p1, games: walkover ? blank : games1 },
      { players: p2, games: walkover ? blank : games2 },
    ],
  };
}

// Cap every upstream call so a slow/unresponsive backend degrades to the empty
// (loading) state instead of hanging the ticker's spinner indefinitely.
/**
 * How long to wait on `homepage_score_ticker` before giving up.
 *
 * ⚠ 5s WAS INSIDE THE ENDPOINT'S OWN RESPONSE-TIME DISTRIBUTION, WHICH IS THE
 * WORST PLACE TO PUT A TIMEOUT (9/5). Measured on Vercel's external-API view
 * during Nationals: average 2.97s, P75 4.53s, and `/api/ticker` sitting at a
 * P75 duration of exactly 5s with a 44.6% error rate — i.e. we were not timing
 * out on a broken endpoint, we were timing out on a SLOW one, roughly half the
 * time, a few hundred milliseconds before it would have answered.
 *
 * That is worse than it looks, because an aborted request does not save
 * upstream any work — it has already done it, and we throw the result away.
 * Then the cache is not populated, so the next poll asks again and upstream
 * does the same work a second time. A timeout set mid-distribution therefore
 * MULTIPLIES load on exactly the endpoint that is struggling, which is how a
 * slow API and a rate limit turn into each other.
 *
 * 10s is well clear of anything we have measured. Nothing waits on it in a way
 * a visitor feels: /api/ticker is polled in the background and answered from
 * the edge, /watch streams this under its own Suspense boundary, and a warm
 * instance serves from `resultCache` without calling at all.
 */
const TIMEOUT_MS = 10_000;

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
/**
 * The last result per partner that came back from a working call — the same
 * last-known-good idea `plannedLastGood` (below) already applies to start times,
 * for the same reason: a transient upstream failure must not un-publish data we
 * know to be true seconds ago.
 *
 * ⚠ IT EXPIRES. Served indefinitely it would keep a finished tournament's
 * matches on the front page for as long as upstream stayed unreachable. Two
 * minutes is long enough to cover a burst of timeouts and short enough that a
 * genuinely-stale board admits it.
 */
const lastGoodResult = new Map<string, { value: TickerResult; at: number }>();
const LAST_GOOD_MAX_MS = 120_000;

/**
 * How long to stop calling upstream after a failed call, per partner.
 *
 * ⚠ WITHOUT THIS, BEING RATE LIMITED MAKES US CALL HARDER, WHICH IS HOW A BLIP
 * BECOMES AN OUTAGE (9/5). Only a WORKING call is written to `resultCache`, so a
 * failure left nothing cached and the very next poll — 15s later, from every
 * open tab, on every instance — went straight back upstream. `/api/ticker` also
 * (correctly) refuses to let the CDN pin a failure, so none of those polls were
 * absorbed at the edge either. The result is a positive feedback loop: the
 * moment `homepage_score_ticker` starts returning 429 we generate our maximum
 * possible load against the endpoint that is already throttling us, and it
 * cannot recover on its own. Confirmed live mid-Nationals — a direct probe
 * returned `429 Too many requests` while the dashboard showed `/api/ticker`
 * making 30K of the site's 31K upstream calls in twelve hours.
 *
 * A cooldown is the backoff this endpoint never had: `fetchScores` uses a raw
 * fetch, not {@link pbGetJson}, so it has no retry logic and no backoff of any
 * kind. During the window we serve {@link fallbackFor} — the last good board,
 * marked stale — which is what a viewer should see anyway while scores are
 * briefly unreachable.
 *
 * 20s is a little longer than the client's 15s poll, so a tab that polls into a
 * cooldown makes at most one upstream attempt per cooldown rather than one per
 * poll, and recovery is still fast enough to be invisible when the limit lifts.
 */
const FAILURE_COOLDOWN_MS = 20_000;
const failureUntil = new Map<string, number>();

/** What to serve when the live call failed: recent real data, else nothing. */
function fallbackFor(partner: string): TickerResult {
  const held = lastGoodResult.get(partner);
  if (held && Date.now() - held.at < LAST_GOOD_MAX_MS) {
    return { ...held.value, stale: true };
  }
  return { matches: [], tournament: null, partner, ok: false };
}
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
export async function activeTickerPartner(): Promise<string | null> {
  const { token, base } = config();
  return token ? pickActivePartner(token, base) : null;
}

/**
 * ⚠ NOT FOR THE SITE CHROME. This answers "which tour has matches running",
 * across PPA and its sister tours, and that is the wrong question for anything
 * on ppatour.com's own furniture — see the note in `fetchLiveTicker`. It exists
 * for the scores board's date lookup (`fetchPlannedStarts`, which is scoped to a
 * tournament the page already chose) and for the /live rehearsal harness, whose
 * job is to find real live content wherever it is.
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
  // ⚠ THROW, DON'T RETURN EMPTY. A 429 or a 500 is not "no matches on court";
  // resolving it to an empty list is what published that claim mid-tournament.
  if (!res.ok) throw new Error(`homepage_score_ticker ${res.status}`);

  const json = (await res.json()) as { results?: { results?: ApiMatch[] } };
  const rows = json.results?.results ?? [];
  const matches = rows.map(mapMatch);
  const first = rows[0];
  const tournament: TickerTournament | null = first
    ? { title: first.tournamentTitle || "", logo: first.tournamentLogo || null }
    : null;
  return { matches, tournament, partner, ok: true };
}

export async function fetchLiveTicker(partnerArg?: string): Promise<TickerResult> {
  const { token, base } = config();

  /**
   * ⚠ THE DEFAULT IS THE MAIN PPA TOUR, AND IT IS NOT AUTO-PICKED (Wesley,
   * 8/20: "Main PPA Tournament should be the only content that shows on the
   * actual home page. Especially anything in that top nav and the hero.").
   *
   * This used to call `pickActivePartner`, which returns the FIRST partner
   * with matches running across PPA / PPA Australia / PPA Asia. So with no PPA
   * event on, ppatour.com's own top bar advertised a sister tour — measured on
   * the live homepage: "Up Next · Round 16 · C. Wang / Y. Long vs Q. Chen /
   * A. Brown · 9:00 AM CST", a PPA Asia 500 match in Shenzhen. Every consumer
   * of this feed is site chrome (the site-wide ticker, the /live marquee and
   * score rail, /watch's Live Now band), so the auto-pick put sister-tour
   * content on the tour's own furniture.
   *
   * A sister tour still reaches those surfaces on request — `?partner=` is
   * honoured end to end (use-live-ticker reads it from the URL, /api/ticker
   * forwards it), which is how the PPA Asia window is being used to rehearse
   * live behaviour. It is opt-in now rather than automatic.
   */
  const partner = partnerArg || process.env.PB_TICKER_PARTNER || "PPA";
  if (!token) return { matches: [], tournament: null, partner, ok: false };

  const cached = resultCache.get(partner);
  if (cached && cached.expires > Date.now()) return cached.value;

  // ⚠ BACKING OFF IS NOT OPTIONAL HERE — see FAILURE_COOLDOWN_MS. A recent
  // failure means we do not call upstream at all; the viewer gets the last good
  // board rather than us adding another request to an endpoint that is already
  // refusing them.
  const coolingUntil = failureUntil.get(partner) ?? 0;
  if (coolingUntil > Date.now()) return fallbackFor(partner);

  const pending = resultInFlight.get(partner);
  if (pending) return pending;

  const p = (async () => {
    try {
      const result = await fetchScores(token, base, partner);
      // ⚠ ONLY A WORKING CALL IS CACHED, and only a working call becomes the
      // fallback. Caching a failure pinned "nothing is live" for RESULT_TTL_MS
      // and then for however long the CDN held the 200 on top of it.
      resultCache.set(partner, { value: result, expires: Date.now() + RESULT_TTL_MS });
      lastGoodResult.set(partner, { value: result, at: Date.now() });
      failureUntil.delete(partner);
      return result;
    } catch {
      // Start the cooldown. The failure itself is still never cached as a
      // RESULT — only the decision to stop asking for a moment is remembered.
      failureUntil.set(partner, Date.now() + FAILURE_COOLDOWN_MS);
      return fallbackFor(partner);
    }
  })();
  resultInFlight.set(partner, p);
  try {
    return await p;
  } finally {
    resultInFlight.delete(partner);
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
