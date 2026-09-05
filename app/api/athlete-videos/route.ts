import { NextResponse } from "next/server";
import { getAthleteVideosFor } from "@/lib/athlete-videos";

/**
 * Highlight videos for one athlete + tournament — powers the tournament
 * dropdown on the athlete page (the initial tournament is server-rendered).
 *
 *   GET /api/athlete-videos?slug=<player-slug>&tournament=<uuid> → { videos[] }
 */
/**
 * ⚠ NO `force-dynamic` HERE, DELIBERATELY (9/5). It is documented as
 * equivalent to `fetchCache = "force-no-store"`, and that FORCE overrode the
 * `revalidate` + `tags` this route’s adapter passes — so its tagged 1h Data
 * Cache was never written and every request re-hit the partner API. Pairing it
 * with `default-cache` does not rescue it; a force-* setting wins. Same bug as
 * /api/rankings, same fix.
 *
 * Nothing is lost by dropping it: this handler reads `searchParams`, so it is
 * dynamic on its own terms and always runs.
 */
export const fetchCache = "default-cache";

/**
 * Highlight reels for a finished tournament don't change, so this is the one
 * proxy that can cache hard — an hour at the CDN, a day of stale-while-
 * revalidate. Every dropdown flip used to be an upstream call.
 */
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const tournament = url.searchParams.get("tournament");
  if (!slug || !tournament) {
    return NextResponse.json(
      { error: "Missing slug or tournament" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const videos = await getAthleteVideosFor(slug, tournament);
  return NextResponse.json({ videos }, { headers: { "Cache-Control": CACHE_CONTROL } });
}
