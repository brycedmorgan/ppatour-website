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
 * The staleness this adds is not observable: a completed match already took up
 * to ~100s to reach the panel through the module cache, the Data Cache and the
 * edge stacked together, and this moves that to ~125s.
 */
export const BRACKET_LIVE_WINDOW_S = 45;

/**
 * The finished cadence — six hours.
 *
 * ⚠ NOT INFINITE, ON PURPOSE. A draw can be corrected after the fact: a scoring
 * mistake, a retro-actively applied walkover, a division re-published. Six hours
 * means a correction still reaches the site the same day without anybody
 * deploying, while cutting a finished event's cost by ~500x. It also sits
 * comfortably inside the daily `revalidateTag` cron, which remains the backstop.
 */
export const FINISHED_WINDOW_S = 6 * 60 * 60;

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
export type DatedEvent = { endDate?: string | null };

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
 * Tournaments observed finished, so the LIST call can go on the long window too
 * from the second build onwards.
 *
 * ⚠ PER-INSTANCE AND DELIBERATELY SO. A module map is one cache per warm
 * instance, which would be wrong for data (the 9/9 lesson) but is exactly right
 * for a hint: the worst case is that a cold instance pays one live-window list
 * call before it learns, and the entry it writes is only ever an accelerant for
 * a conclusion `windowFromProEvents` reaches independently on every build.
 * Nothing is served from it.
 */
const settled = new Set<string>();

/** Window for the LIST call itself — long only once we have seen it finished. */
export function listWindowFor(uuid: string, liveWindow: number): number {
  return settled.has(uuid) ? FINISHED_WINDOW_S : liveWindow;
}

/** Record what the list said, so the next build can skip the live list call. */
export function noteWindow(uuid: string, window: number): void {
  if (window === FINISHED_WINDOW_S) settled.add(uuid);
  else settled.delete(uuid);
}
