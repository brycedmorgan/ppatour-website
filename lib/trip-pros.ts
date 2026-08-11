/**
 * Server-side builder for the Trip Builder's "who do you want to watch?" pro
 * list. Live WPR roster in production; the site's existing offline ranking
 * placeholder (`divisionRankings`) as the dev/no-token fallback — the same
 * fallback the rest of the site uses, so this introduces no new hand-kept data.
 *
 * Never throws — returns [] on any problem so the watch flow just hides the
 * picker rather than breaking the page.
 */
import "server-only";
import { curatedSlugFor, getWprRoster } from "@/lib/rankings-api";
import { divisionRankings } from "@/lib/home-content";
import { getPublishedAthlete } from "@/lib/published-athletes";
import { getAthlete } from "@/lib/athletes";
import type { TripPro } from "@/lib/trip";

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function nameFor(slug: string): string {
  return getPublishedAthlete(slug)?.name ?? getAthlete(slug)?.name ?? titleCase(slug);
}

function divisionsFor(slug: string): string[] {
  return getPublishedAthlete(slug)?.divisions ?? getAthlete(slug)?.divisions ?? [];
}

export async function buildTripPros(limit = 40): Promise<TripPro[]> {
  try {
    const live = await getWprRoster();
    if (live.length > 0) {
      return live
        .map((a) => ({
          slug: curatedSlugFor(a.slug) ?? a.slug,
          name: a.name,
          rank: a.rank,
          divisions: divisionsFor(curatedSlugFor(a.slug) ?? a.slug),
        }))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit);
    }
  } catch {
    /* fall through to the placeholder */
  }

  // Fallback: fold the per-discipline placeholder into one row per player,
  // taking their best (lowest) rank and the disciplines they appear in.
  const bySlug = new Map<string, { rank: number; divisions: Set<string> }>();
  for (const d of divisionRankings) {
    for (const e of d.entries) {
      const cur = bySlug.get(e.slug) ?? { rank: e.rank, divisions: new Set<string>() };
      cur.rank = Math.min(cur.rank, e.rank);
      cur.divisions.add(d.label);
      bySlug.set(e.slug, cur);
    }
  }
  return [...bySlug.entries()]
    .map(([slug, v]) => ({
      slug,
      name: nameFor(slug),
      rank: v.rank,
      divisions: divisionsFor(slug).length ? divisionsFor(slug) : [...v.divisions],
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);
}
