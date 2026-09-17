/**
 * How long the live-data adapters may cache one tournament's `tournament_events`
 * responses.
 *
 * ⚠ A FINISHED TOURNAMENT WAS BEING POLLED ON THE LIVE CADENCE, AND THAT IS
 * PURE WASTE. Measured 9/17: the National Championships — which ended eleven
 * days earlier — was still rebuilding its bracket every 41 seconds, 531 upstream
 * calls an hour for a draw that had not changed since Championship Sunday and
 * never will again.
 *
 * ── ⚠ THE FIRST VERSION OF THIS FILE ASKED `getEvents()` AND THAT WAS WRONG ──
 * It looked the tournament up in the calendar feed by uuid. Two things went
 * wrong in production, both measured:
 *
 *   1. It did not work. Nationals kept rebuilding every 41s. The calendar's
 *      `tournamentUuid` is API-sourced only and absent from every hand-authored
 *      record (CLAUDE.md, 8/19) — so the moment `getEvents()` fell back to the
 *      curated list, nothing matched, the rule failed short, and the long window
 *      was never applied.
 *   2. It cost 236 calls/hour of its own. `getEvents` inside the force-dynamic
 *      `/api/brackets` segment did not hit the Data Cache, so the lookup added
 *      one `ppa_tournaments` call per bracket rebuild — a tenth of the very
 *      volume it was meant to reduce.
 *
 * ── WHAT IT USES INSTEAD, WHICH IS FREE AND MORE HONEST ───────────────────────
 * `tournament_events?bracket_level=Pro` — the list call that every build already
 * makes as its first request — carries `endDate` per division, and it is **null
 * while that division is still being played**. Verified on the live API:
 *
 *   Arizona (live)   Womens Doubles Pro Main Draw  endDate: null
 *   Nationals (done) Womens Doubles Pro Main Draw  endDate: 2026-09-06T16:06:05Z
 *
 * So "every pro division has an end date, and the last one was over a day ago"
 * is a self-contained, zero-cost test that reads what actually happened on
 * court rather than what a calendar row claims. No second request, no uuid
 * join, nothing to fall back to.
 */

/**
 * The live cadence for SCORES. Clear of the 30s board poll feeding it — a cache
 * window at or below its own request rate is not a cache (the 9/9 finding).
 */
export const LIVE_WINDOW_S = 20;

/**
 * The live cadence for BRACKETS, deliberately longer than the scores one.
 *
 * ⚠ THEY ARE DIFFERENT NUMBERS BECAUSE THEY ANSWER DIFFERENT QUESTIONS. A
 * scoreboard changes point by point; a draw changes only when a match ENDS,
 * which is every twenty to forty minutes per court. Paying the bracket's
 * six-call fan-out on the scoreboard's cadence bought nothing — measured 9/17,
 * the live Arizona draw was rebuilding every 14 seconds for 1,454 calls an hour.
 *
 * ⚠ 90s, NOT LONGER, AND THE CEILING IS THE LIVE DOT. The bracket is not a
 * static picture of the draw: BracketView renders `status === "live"` as a
 * pulsing indicator and shows per-game scores as they are played. So this window
 * is bounded by in-progress scores, not by advancement — a pulsing "live" badge
 * beside a score that is minutes stale, on the same page as a scoreboard
 * refreshing every 30s, reads as a broken page rather than a cached one.
 *
 * Worst-case staleness for an in-progress score is the edge (45s) plus the module
 * cache (60s) plus this, so roughly three minutes. Advancement — who is through
 * to the next round, which is what a draw is actually for — cannot be more than
 * one window behind, and matches take twenty minutes at the very least.
 *
 * If bracket volume ever needs halving again, the honest lever is not this number
 * but making the window depend on whether any match in THAT tournament is
 * currently live: a draw with nothing on court can be held for many minutes
 * without anyone being able to tell.
 */
export const BRACKET_LIVE_WINDOW_S = 90;

/**
 * The cadence for a tournament that has not started yet — once a day.
 *
 * ⚠ WESLEY, 9/17: an upcoming event "should refresh daily". Its ten division
 * shells exist as soon as it is on the calendar but hold no matches and no names
 * until the draw drops in event week, so polling them on a live cadence was
 * re-reading the same empty shells forever. Measured that day, three upcoming
 * stops — Las Vegas, the Chicago Cup and the 2027 Masters — were all being
 * polled with zero divisions started.
 */
export const UPCOMING_WINDOW_S = 24 * 60 * 60;

/**
 * How close to first serve the daily window gives way to the live one.
 *
 * ⚠ WITHOUT THIS, A 24-HOUR CACHE WOULD HIDE THE START OF A TOURNAMENT FOR UP TO
 * A DAY, which is the single worst failure available here — this repo has fixed
 * "the first match of a session must appear quickly" twice already (9/9).
 *
 * The arithmetic is self-correcting, which is why two days is enough rather than
 * a week. The longest a daily entry can survive is 24h, so an entry written at
 * the last moment it still qualified (T-2d) expires at T-1d; from there every
 * refresh sees the event inside the guard and drops to the live cadence. The
 * live window is therefore in force for AT LEAST a full day before first serve,
 * which is also when the draw itself publishes.
 */
const LIVE_FROM_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * The finished cadence — a year, i.e. never again in any practical sense.
 *
 * ⚠ WESLEY, 9/17: "completed tournaments should never trigger an API call again
 * because the tournament is over and the content will not change again." This
 * was six hours; it is now effectively permanent.
 *
 * A year is the honest way to spell "never" here. Next stores anything at or
 * above its INFINITE_CACHE sentinel as CACHE_ONE_YEAR_SECONDS anyway
 * (`normalizedRevalidate` in patch-fetch.js), so a year IS the infinite window —
 * and keeping it a plain number means every caller stays arithmetic.
 *
 * ⚠ THE ESCAPE HATCH IS THE TAG, AND IT IS WHY THIS IS SAFE. These entries carry
 * LIVE_SCORES_CACHE_TAG, which lib/cache-tags.ts documents as purgeable by hand
 * and deliberately purged by NO cron. So a draw that genuinely is corrected after
 * the fact — a voided match, an amended score, a late DQ — is one
 * `revalidateTag("live-scores")` away from being re-read, rather than needing a
 * deploy. Without that hatch this window would be the wrong call.
 *
 * ⚠ "NEVER" MEANS NEVER ON A SCHEDULE, NOT PROVABLY ZERO FOREVER. Vercel's Data
 * Cache evicts under pressure and a cold entry re-fetches once. The steady state
 * is zero calls; the floor is one call per tournament per evicted entry.
 */
export const FINISHED_WINDOW_S = 365 * 24 * 60 * 60;

/**
 * Module-cache TTL for a finished tournament's BUILT result.
 *
 * ⚠ THE DATA CACHE ALONE DOES NOT REACH ZERO, WHICH IS THE POINT OF THIS. The
 * adapters hold their assembled draw/board in module scope for 60s and rebuild
 * after that — and a rebuild re-reads every fetch behind it. So even with a
 * permanent Data Cache, a warm instance kept re-assembling Nationals once a
 * minute forever, and each rebuild was six cache reads that could each miss.
 * With both layers pinned, a warm instance builds a finished tournament ONCE and
 * serves it from memory thereafter.
 */
export const FINISHED_MEMO_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * How long after the last division ends before a tournament counts as settled.
 *
 * ⚠ ONE FULL DAY OF MARGIN, BECAUSE THESE TIMESTAMPS ARE VENUE-LOCAL IN SPIRIT.
 * The tour runs Cary to Kuala Lumpur and this repo already has the scar from
 * reading a local wall-clock time as UTC (see `plannedStart` in
 * lib/ticker-api.ts). A day of slack means no timezone can freeze a draw while
 * its last matches are still being played. The cost of the margin is one extra
 * day on the live cadence; the cost of getting it wrong is a frozen bracket on
 * Championship Sunday.
 */
const SETTLED_AFTER_MS = 24 * 60 * 60 * 1000;

/** The shape this module needs from one `tournament_events` row. */
export type DatedEvent = {
  /** Null until this division actually begins play — the "has it started" test. */
  startDate?: string | null;
  /** Null while this division is still being played. */
  endDate?: string | null;
  /** Scheduled play date, present long before anything starts. */
  eventDate?: string | null;
};

/**
 * Decide the window for a tournament's per-division calls from its own event
 * list.
 *
 * ⚠ IT FAILS SHORT ON EVERY UNCERTAINTY — no rows, any division still open, an
 * unparseable date. Serving a stale score during a live match is the failure
 * this repo has fixed twice (9/5, 9/6); serving a stale bracket for a
 * tournament that ended last week is not a failure at all.
 */
export function windowFromProEvents(rows: DatedEvent[], liveWindow: number): number {
  if (!rows.length) return liveWindow;

  // ── UPCOMING ──────────────────────────────────────────────────────────────
  // Not one division has begun, so there is nothing to watch change. Verified
  // on the live API: Las Vegas, Chicago Cup and the 2027 Masters all report 10
  // divisions with startDate null, while the live Arizona Open reports 10 of 10
  // started.
  if (!rows.some((r) => r.startDate)) {
    const scheduled = rows
      .map((r) => (r.eventDate ? Date.parse(r.eventDate) : NaN))
      .filter((t) => Number.isFinite(t));
    if (!scheduled.length) return liveWindow;
    const firstServe = Math.min(...scheduled);
    // Inside the guard the live cadence takes over, so the start is never missed.
    return firstServe - Date.now() > LIVE_FROM_MS ? UPCOMING_WINDOW_S : liveWindow;
  }

  // ── COMPLETED ─────────────────────────────────────────────────────────────
  // Play has begun somewhere. It is over only when EVERY division has closed and
  // the last one closed more than a day ago.
  let latest = 0;
  for (const r of rows) {
    // A null end date means that division is still being played. One is enough.
    if (!r.endDate) return liveWindow;
    const t = Date.parse(r.endDate);
    if (!Number.isFinite(t)) return liveWindow;
    if (t > latest) latest = t;
  }
  return Date.now() - latest > SETTLED_AFTER_MS ? FINISHED_WINDOW_S : liveWindow;
}

/**
 * The window last computed for each tournament, so the LIST call can use it too
 * from the second build onwards.
 *
 * ⚠ IT HAS TO REMEMBER THE WINDOW, NOT JUST "IS IT FINISHED". The list call is
 * the one that tells us which state a tournament is in, so on its own it can
 * never benefit from the answer — and for an UPCOMING tournament that left it
 * running at the live cadence forever while the five calls behind it sat on a
 * daily window. Remembering the number fixes both states with one map.
 *
 * ⚠ PER-INSTANCE AND DELIBERATELY SO. A module map is one cache per warm
 * instance, which would be wrong for data (the 9/9 lesson) but is exactly right
 * for a hint: the worst case is a cold instance paying one live-window list call
 * before it learns, and what it writes is only ever an accelerant for a
 * conclusion `windowFromProEvents` reaches independently on every build. Nothing
 * is served from it.
 *
 * ⚠ AND IT IS SAFE TO REMEMBER A LONG WINDOW ONLY BECAUSE BOTH LONG WINDOWS ARE
 * SELF-CORRECTING. A finished tournament never changes state again; an upcoming
 * one drops to the live cadence at least a full day before first serve (see
 * LIVE_FROM_MS). Neither can strand the list call on a stale window through a
 * transition that matters.
 */
const remembered = new Map<string, number>();

/** Has this instance seen this tournament finished? */
export function isSettled(uuid: string): boolean {
  return remembered.get(uuid) === FINISHED_WINDOW_S;
}

/** Window for the LIST call itself — whatever the last build concluded. */
export function listWindowFor(uuid: string, liveWindow: number): number {
  return remembered.get(uuid) ?? liveWindow;
}

/** Record what the list said, so the next build starts from the right window. */
export function noteWindow(uuid: string, window: number): void {
  remembered.set(uuid, window);
}
