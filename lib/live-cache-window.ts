/**
 * How long the live-data adapters may cache one tournament's `tournament_events`
 * responses.
 *
 * ⚠ A FINISHED TOURNAMENT WAS BEING POLLED ON THE SAME 20s CADENCE AS A LIVE
 * ONE, AND THAT IS PURE WASTE. Measured on production 9/17: the National
 * Championships — which ended **11 days earlier, on 9/6** — still cost
 * **10,402 upstream calls in twelve hours** across `/api/brackets` and its own
 * event page. Its draw had not changed since Championship Sunday and never will
 * again. Every one of those calls bought a byte-identical answer.
 *
 * The traffic itself is legitimate: people do keep opening a finished event's
 * bracket. What was wrong was asking upstream again every twenty seconds to
 * re-learn a result that is now history.
 *
 * ⚠ IT FAILS SHORT, NOT LONG, AND THAT IS THE WHOLE SAFETY ARGUMENT. Every path
 * that cannot prove a tournament is over — an unknown uuid, a feed that is down,
 * an unparseable date — gets {@link LIVE_WINDOW_S}, i.e. exactly today's
 * behaviour. Serving a stale score during a live match is the failure this repo
 * has fixed twice (9/5, 9/6); serving a stale score for a tournament that ended
 * last week is not a failure at all.
 */
import { getEvents } from "@/lib/events-api";
import { hasTournamentEnded } from "@/lib/placeholder-data";

/**
 * The live cadence. Deliberately clear of the 15s bracket poll and the 30s
 * scores poll that feed it — a cache window at or below its own request rate is
 * not a cache (the 9/9 finding).
 */
export const LIVE_WINDOW_S = 20;

/**
 * The finished cadence — six hours.
 *
 * ⚠ NOT `INFINITE_CACHE`, AND NOT A DAY, ON PURPOSE. A draw can be corrected
 * after the fact: a scoring mistake, a retro-actively applied walkover, a
 * division re-published. Six hours means a correction still reaches the site the
 * same day without anybody deploying, while cutting a finished event's upstream
 * cost by ~1,000x against the 20s window. It is also comfortably inside the
 * daily `revalidateTag` cron, so the nightly refresh remains the backstop.
 */
export const FINISHED_WINDOW_S = 6 * 60 * 60;

/**
 * How long after the final day before a tournament counts as finished.
 *
 * ⚠ ONE FULL DAY OF MARGIN, BECAUSE THE FEED'S DATES ARE VENUE-LOCAL. The tour
 * runs Cary to Kuala Lumpur and this repo already has the scar from reading a
 * local wall-clock time as UTC (see `plannedStart` in lib/ticker-api.ts). A day
 * of slack means no timezone on the calendar can make us freeze a draw while its
 * last matches are still being played — the cost of the margin is one extra day
 * on the 20s cadence, which is nothing, and the cost of getting it wrong is a
 * frozen bracket on Championship Sunday.
 */
const SETTLED_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * The cache window, in seconds, for `tournament_events` calls about `uuid`.
 *
 * Returns {@link FINISHED_WINDOW_S} only when the calendar positively says this
 * tournament finished more than {@link SETTLED_AFTER_MS} ago. Anything else —
 * live, upcoming, unknown, or unresolvable — gets {@link LIVE_WINDOW_S}.
 */
export async function liveCacheWindowFor(uuid: string | undefined): Promise<number> {
  if (!uuid) return LIVE_WINDOW_S;
  try {
    // Cheap: `getEvents` is React-cached per request and held 24h in the Data
    // Cache, and on a live path the calendar is already warm from the render
    // that got us here.
    const { events } = await getEvents();
    const t = events.find((e) => e.tournamentUuid === uuid);
    if (!t) return LIVE_WINDOW_S;
    // `hasTournamentEnded` is the site's own definition of "the final day has
    // passed" — the same one the event page and the homepage flip on. Reusing
    // it means a tournament cannot be over for the cache and live for the page.
    if (!hasTournamentEnded(t, Date.now() - SETTLED_AFTER_MS)) return LIVE_WINDOW_S;
    return FINISHED_WINDOW_S;
  } catch {
    return LIVE_WINDOW_S;
  }
}
