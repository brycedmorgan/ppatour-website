import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

/**
 * Daily cache refresh for the athlete pages. Invoked by the Vercel Cron in
 * vercel.json: invalidates the athlete API fetch tag (stats, DUPR, division
 * rankings, highlights) so the next request re-pulls fresh data. Between
 * refreshes those calls are served from the Data Cache, so page renders and
 * builds don't re-hit — and never trip — the partner API's rate limit.
 *
 * If CRON_SECRET is set, we require Vercel's `Authorization: Bearer <secret>`.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // "max" → stale-while-revalidate: serve cached data on the next visit while
  // the fresh player data is fetched in the background.
  revalidateTag(ATHLETES_CACHE_TAG, "max");

  return NextResponse.json({
    ok: true,
    revalidated: ATHLETES_CACHE_TAG,
    at: new Date().toISOString(),
  });
}
