import { NextResponse } from "next/server";
import { searchSite } from "@/lib/site-search";

/**
 * Site search. Exists so /search can query article bodies, athlete bios and
 * program copy without shipping any of that to the browser — the old index was
 * imported by a client component, which capped it at titles and meta strings.
 *
 * Node runtime: the index reads the ~6.3 MB migrated archive from disk.
 */
export const runtime = "nodejs";

const MAX_QUERY = 120;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const q = raw.slice(0, MAX_QUERY);

  if (q.trim().length < 2) {
    return NextResponse.json({ query: q.trim(), groups: [], total: 0 });
  }

  try {
    const result = await searchSite(q);
    return NextResponse.json(result, {
      // Same query, same answer until content changes; keeps repeat typing and
      // shared links off the index entirely.
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (err) {
    console.error("[search] failed", err);
    // Never 500 the search box — an empty result set degrades gracefully.
    return NextResponse.json({ query: q.trim(), groups: [], total: 0 }, { status: 200 });
  }
}
