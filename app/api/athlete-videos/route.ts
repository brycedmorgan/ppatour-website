import { NextResponse } from "next/server";
import { getAthleteVideosFor } from "@/lib/athlete-videos";

/**
 * Highlight videos for one athlete + tournament — powers the tournament
 * dropdown on the athlete page (the initial tournament is server-rendered).
 *
 *   GET /api/athlete-videos?slug=<player-slug>&tournament=<uuid> → { videos[] }
 */
export const dynamic = "force-dynamic";

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
