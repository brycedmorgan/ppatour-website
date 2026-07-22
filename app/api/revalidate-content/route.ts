import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  REGISTRATIONS_CACHE_TAG,
  REPLAYS_CACHE_TAG,
  TOURNAMENT_DETAILS_CACHE_TAG,
} from "@/lib/cache-tags";

/**
 * Daily cache refresh for the remaining API-backed content: tournament details
 * (live-page header), registration counts, and replay video playlists. Invoked
 * by the Vercel Cron in vercel.json: invalidates each fetch tag so the next
 * request re-pulls fresh data (between refreshes they serve from the Data
 * Cache). Same pattern as /api/revalidate-events and /api/revalidate-athletes.
 *
 * If CRON_SECRET is set, we require Vercel's `Authorization: Bearer <secret>`.
 */
export const dynamic = "force-dynamic";

const TAGS = [TOURNAMENT_DETAILS_CACHE_TAG, REGISTRATIONS_CACHE_TAG, REPLAYS_CACHE_TAG];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // "max" → stale-while-revalidate: serve cached data on the next visit while
  // the fresh copy is fetched in the background.
  for (const tag of TAGS) revalidateTag(tag, "max");

  return NextResponse.json({ ok: true, revalidated: TAGS, at: new Date().toISOString() });
}
