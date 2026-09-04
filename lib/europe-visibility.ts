import { EUROPE_PUBLIC } from "@/lib/europe-launch";
import { europeRoster } from "@/lib/europe-roster";
import { getPublishedAthlete } from "@/lib/published-athletes";

/**
 * Server-side half of the Europe launch gate. Kept out of ./europe-launch.ts so
 * that file stays importable from client components — see the warning there.
 */

const EUROPE_SLUGS = new Set(europeRoster.map((p) => p.slug));

/**
 * Is this athlete page one the Europe launch created, and still unlisted?
 *
 * ⚠ THE `getPublishedAthlete` CHECK IS LOAD-BEARING, NOT DEFENSIVE. Seven of the
 * 26 Europe pros — Owczarek, Platel, Cugliari, Amaro, Paque, Seccia, Protzek —
 * already had a public, indexed profile from the WordPress scrape long before
 * PPA Tour Europe was a page. Adding a portrait and a tagline to those pages is
 * not a reason to pull them out of the index; doing so would be a live SEO
 * regression dressed up as a launch control. Only the 19 URLs this work MINTED
 * are held back.
 */
export function isUnlistedEuropeAthlete(slug: string): boolean {
  if (EUROPE_PUBLIC) return false;
  if (!EUROPE_SLUGS.has(slug)) return false;
  return !getPublishedAthlete(slug);
}
