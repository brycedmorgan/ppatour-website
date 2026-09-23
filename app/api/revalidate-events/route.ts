import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { EVENTS_CACHE_TAG } from "@/lib/events-api";
import { purgeCacheTag } from "@/lib/pb-cache";

/**
 * Daily cache refresh for the /events calendar. Invoked by the Vercel Cron
 * defined in vercel.json at midnight Central (see there for the DST note):
 * invalidates the tournaments fetch tag so the next request re-pulls the API
 * and picks up new / changed / removed events.
 *
 * If CRON_SECRET is set, we require Vercel's `Authorization: Bearer <secret>`
 * header (Vercel sends it automatically for cron requests) so the endpoint
 * can't be triggered anonymously.
 */
export const dynamic = "force-dynamic";

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

  return NextResponse.json({
    ok: true,
    revalidated: EVENTS_CACHE_TAG,
    purged,
    at: new Date().toISOString(),
  });
}
