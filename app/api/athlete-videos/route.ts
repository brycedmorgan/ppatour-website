import { NextResponse } from "next/server";
import { getAthleteVideosFor } from "@/lib/athlete-videos";

/**
 * Highlight videos for one athlete + tournament — powers the tournament
 * dropdown on the athlete page (the initial tournament is server-rendered).
 *
 *   GET /api/athlete-videos?slug=<player-slug>&tournament=<uuid> → { videos[] }
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const tournament = url.searchParams.get("tournament");
  const headers = { "Cache-Control": "no-store" };
  if (!slug || !tournament) {
    return NextResponse.json({ error: "Missing slug or tournament" }, { status: 400, headers });
  }
  const videos = await getAthleteVideosFor(slug, tournament);
  return NextResponse.json({ videos }, { headers });
}
