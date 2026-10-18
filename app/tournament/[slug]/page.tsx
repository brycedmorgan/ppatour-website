import { permanentRedirect } from "next/navigation";
import { getEvents } from "@/lib/events-api";
import { eventHref, eventYear, tournaments, type Tournament } from "@/lib/placeholder-data";

/**
 * Legacy WordPress `/tournament/<slug>/` URLs → the matching event page.
 *
 * Before 10/18 `next.config.ts` sent every one of these to `/events/` (the
 * schedule index), which GSC reads as a soft redirect and which strands a fan
 * who clicked a two-year-old link to the Arizona Open on a page about every
 * event. The old slugs are the same stems this site uses (`arizona-open`,
 * `newport-beach-open`), so a 1:1 is usually possible: the newest season of
 * that stop with an internal page wins; anything unmatched still lands on the
 * schedule, as before. 308 (permanent), as the old rule was.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(ppa|carvana|veolia)-/, "")
    .replace(/-?(\d{4})$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default async function LegacyTournamentRedirect({ params }: Params) {
  const { slug } = await params;
  const want = norm(slug);
  const { events } = await getEvents();
  const pool: Tournament[] = [
    ...tournaments.filter((t) => t.tierKey !== "challenger" && t.hasInternalPage !== false),
    ...events.filter((e) => e.hasInternalPage),
  ];
  const match = pool
    .filter((t) => norm(t.slug) === want || t.slug === slug)
    .sort((a, b) => eventYear(b).localeCompare(eventYear(a)))[0];
  permanentRedirect(match ? `${eventHref(match)}/` : "/events/");
}
