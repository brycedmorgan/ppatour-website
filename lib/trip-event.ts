/**
 * Shared builder for the Trip Builder's event context. Both the event page and
 * the "email my plan" API route build the `TripEvent` from here, so the on-page
 * wizard and the emailed plan can never disagree about dates, links, hotels or
 * the pro roster.
 */
import "server-only";
import { getEventGuide } from "@/lib/event-guides";
import { publishedHotelsFor } from "@/lib/published-hotels";
import { ticketsOnSale } from "@/lib/tixr-prices";
import { withUtm } from "@/lib/utm";
import { buildTripPros } from "@/lib/trip-pros";
import { getEvents } from "@/lib/events-api";
import { eventYear, tournaments, type Tournament } from "@/lib/placeholder-data";
import type { TripEvent } from "@/lib/trip";

/** Build the serializable TripEvent the wizard/email need from a tournament. */
export async function buildTripEvent(t: Tournament): Promise<TripEvent> {
  const guide = getEventGuide(t.slug);
  const publishedHotels = await publishedHotelsFor(t.city);
  const stayHotels = publishedHotels ?? guide?.hotels ?? [];
  const mapQuery = guide?.mapQuery ?? `${t.venue}, ${t.city}, ${t.state}`;
  const onSale = ticketsOnSale(t.ticketsUrl);
  return {
    slug: t.slug,
    name: t.name,
    city: t.city,
    state: t.state,
    venue: t.venue,
    startDate: t.startDate,
    endDate: t.endDate,
    airport: guide?.airport,
    airportNote: guide?.airportNote,
    mapQuery,
    ticketsUrl: onSale
      ? withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "trip-builder-tickets" })
      : null,
    registerUrl: withUtm(t.registerUrl, {
      campaign: t.eventCode ?? t.slug,
      content: "trip-builder-register",
    }),
    hotels: stayHotels,
    dining: guide?.dining ?? [],
    doing: guide?.doing ?? [],
    pros: await buildTripPros(),
  };
}

/**
 * Resolve a tournament by (year, slug) for a non-page caller (the email route).
 * Mirrors the page's own resolveEvent: curated wins, live fills, and link-out /
 * challenger stops (no internal page) return null — we don't email a plan for an
 * event we don't run a page for.
 */
export async function resolveTournamentForTrip(
  year: string,
  slug: string,
): Promise<Tournament | null> {
  const match = (x: Tournament) => x.slug === slug && eventYear(x) === year;
  const curated = tournaments.find(match) ?? null;
  const live = (await getEvents()).events.find(match) ?? null;
  const t = curated ?? live;
  if (!t || t.tierKey === "challenger" || t.hasInternalPage === false) return null;
  const name = live?.name && live.name !== t.name ? live.name : t.name;
  return { ...t, name };
}
