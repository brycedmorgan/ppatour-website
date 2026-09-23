import { revalidateTag } from "next/cache";
import { purgeCacheTag, sweepCache } from "@/lib/pb-cache";
import { NextResponse } from "next/server";
import {
  REGISTRATIONS_CACHE_TAG,
  REPLAYS_CACHE_TAG,
  TOURNAMENT_DETAILS_CACHE_TAG,
  FINISHED_RESULTS_CACHE_TAG,
  LIVE_SCORES_CACHE_TAG,
  RANKINGS_CACHE_TAG,
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

/** Tags `?tag=` may purge on demand. See the note in the handler. */
const PURGEABLE = [
  ...TAGS,
  FINISHED_RESULTS_CACHE_TAG,
  LIVE_SCORES_CACHE_TAG,
  // ⚠ PURGEABLE BUT DELIBERATELY NOT IN `TAGS` (9/23). The ranking boards roll
  // themselves over via their `rank=<today>` URL and must not be dropped on a
  // schedule — see RANKINGS_CACHE_TAG. They are listed here only so a bad board
  // can be cleared by hand, now that the boards and the prebuild snapshot both
  // write to the durable table.
  RANKINGS_CACHE_TAG,
];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  /**
   * ⚠ `?tag=` IS THE MANUAL ESCAPE HATCH FOR DATA THE CRON DELIBERATELY NEVER
   * TOUCHES, and it is the reason a one-year cache window on finished
   * tournaments is a safe call rather than a trap.
   *
   * A settled draw is immutable in practice, but "in practice" is not "always":
   * a match gets voided, a score is amended, a late DQ lands. Without a way to
   * force a re-read, the only remedy would be a code change and a deploy. With
   * it:  curl -H "Authorization: Bearer $CRON_SECRET"    *        "https://www.ppatour.com/api/revalidate-content/?tag=finished-results"
   *
   * ⚠ ALLOWLISTED, NOT FREE-FORM. The route already runs behind CRON_SECRET, but
   * an arbitrary tag name would let one leaked secret purge every cache the site
   * has at will. Only tags named here can be purged, and the scheduled set above
   * is deliberately NOT extended — adding finished-results to `TAGS` would undo
   * the whole point of the tag.
   */
  const requested = new URL(request.url).searchParams.get("tag");
  if (requested) {
    if (!PURGEABLE.includes(requested)) {
      return NextResponse.json(
        { ok: false, error: "unknown tag", purgeable: PURGEABLE },
        { status: 400 },
      );
    }
    revalidateTag(requested, "max");
    // ⚠ AND OUR OWN TABLE, WHICH revalidateTag CANNOT REACH. lib/pb-cache.ts
    // keys entries itself precisely so they survive deployments, which also
    // means Next has no idea they exist. Purging only one of the two layers
    // would leave a corrected result still being served from the other.
    const purged = await purgeCacheTag(requested);
    return NextResponse.json({ ok: true, revalidated: [requested], purged, at: new Date().toISOString() });
  }

  // "max" → stale-while-revalidate: serve cached data on the next visit while
  // the fresh copy is fetched in the background.
  for (const tag of TAGS) revalidateTag(tag, "max");
  for (const tag of TAGS) await purgeCacheTag(tag);
  // Expired rows are already ignored by reads; this just stops the table
  // growing without bound.
  const swept = await sweepCache();

  return NextResponse.json({ ok: true, revalidated: TAGS, swept, at: new Date().toISOString() });
}
