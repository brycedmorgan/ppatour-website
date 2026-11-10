import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { EVENTS_CACHE_TAG, getEvents, ticketFeedUuids } from "@/lib/events-api";
import { refreshEventTicketUrls } from "@/lib/event-tickets";
import { purgeCacheTag } from "@/lib/pb-cache";

/**
 * Cache refresh for the /events calendar. Invoked every 2 hours by the Vercel
 * Cron in vercel.json (daily until 10/18, so a newly public stop could sit a
 * day before it showed):
 * invalidates the tournaments fetch tag so the next request re-pulls the API
 * and picks up new / changed / removed events.
 *
 * If CRON_SECRET is set, we require Vercel's `Authorization: Bearer <secret>`
 * header (Vercel sends it automatically for cron requests) so the endpoint
 * can't be triggered anonymously.
 */
export const dynamic = "force-dynamic";
/** ~15 GetDetails calls, one at a time (lib/event-tickets). */
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // "max" → stale-while-revalidate: serve cached data on the next visit while
  // the fresh calendar is fetched in the background (Next 16 recommended form).
  revalidateTag(EVENTS_CACHE_TAG, "max");

  /**
   * ⚠ AND OUR OWN TABLE — THIS CRON HAD BEEN PURGING NOTHING (found 9/23).
   * `lib/events-api.ts` reads through `pbCachedJson`, which keys entries itself
   * so they survive a deployment, and `revalidateTag` cannot see them. So the
   * calendar was not refreshing on this schedule at all: it turned over
   * whenever its own 24-hour TTL happened to expire, which drifts, and a new or
   * changed event could sit unseen most of a day after the cron said it had
   * refreshed. Same both-layers rule as /api/revalidate-content.
   */
  const purged = await purgeCacheTag(EVENTS_CACHE_TAG);

  /**
   * Each upcoming US stop's TicketsURL (lib/event-tickets), the site's primary
   * tickets link since 11/9. Read after the purge so a stop that just went
   * public is included. A failure here leaves the previous links in place.
   */
  const { events, source } = await getEvents();
  const tickets =
    source === "live" ? await refreshEventTicketUrls(ticketFeedUuids(events)) : { ok: false, skipped: "fallback" };

  return NextResponse.json({
    ok: true,
    revalidated: EVENTS_CACHE_TAG,
    purged,
    tickets,
    at: new Date().toISOString(),
  });
}
